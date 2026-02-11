import { existsSync } from 'fs'
import { rm, readFile } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import { promisify } from 'util'
import { exec as execCallback } from 'child_process'
import type { ResourceStore } from '@agentforge/dataobject'
import {
  DockerClient,
  ContainerLifecycle,
  ImageBuilder,
  PortPool,
  ResourceTracker,
  ExpressServiceBuilder,
} from '../../infrastructure'
import { workloadEvents } from './events'

const exec = promisify(execCallback)

type WorkloadStage = 'pending' | 'starting-container' | 'cloning-repo' | 'starting-service' | 'running' | 'graceful-shutdown' | 'stopped' | 'failed'

interface LogEntry {
  timestamp: Date
  stage: WorkloadStage
  message: string
  level: 'info' | 'warn' | 'error'
}

interface RunningWorkload {
  workloadId: string
  containerId: string
  port: number
  logs: LogEntry[]
  workDir: string
}

export class WorkloadOrchestrator {
  private workloadStore?: ResourceStore<any>
  private runningWorkloads: Map<string, RunningWorkload> = new Map()
  private dockerClient: DockerClient
  private containerLifecycle: ContainerLifecycle
  private imageBuilder: ImageBuilder
  private expressBuilder: ExpressServiceBuilder
  private portPool: PortPool
  private resources: ResourceTracker

  constructor() {
    this.dockerClient = new DockerClient()
    this.containerLifecycle = new ContainerLifecycle(this.dockerClient)
    this.imageBuilder = new ImageBuilder(this.dockerClient)
    this.expressBuilder = new ExpressServiceBuilder(this.imageBuilder)
    this.portPool = new PortPool({ min: 3100, max: 3200 })
    this.resources = new ResourceTracker()
  }

  setWorkloadStore(store: ResourceStore<any>) {
    this.workloadStore = store
  }

  private async addLog(workloadId: string, stage: WorkloadStage, message: string, level: 'info' | 'warn' | 'error' = 'info'): Promise<void> {
    const running = this.runningWorkloads.get(workloadId)
    if (running) {
      running.logs.push({
        timestamp: new Date(),
        stage,
        message,
        level,
      })
    }

    // Note: Logs are stored in memory only and will be written to DB
    // when updateStage is called to avoid excessive DB writes
  }

  private async updateStage(workloadId: string, stage: WorkloadStage, stageStatus: 'running' | 'success' | 'failed' = 'running', error?: string): Promise<void> {
    try {
      const workload = await this.workloadStore!.findById(workloadId)
      if (!workload) return

      // Initialize stages array if it doesn't exist
      const stages = workload.stages || []

      // Find or create stage result
      let stageResult = stages.find((s: any) => s.stage === stage)
      if (!stageResult) {
        stageResult = {
          stage,
          status: 'pending',
          logs: [],
        }
        stages.push(stageResult)
      }

      // Update stage status
      stageResult.status = stageStatus
      if (stageStatus === 'running' && !stageResult.startedAt) {
        stageResult.startedAt = new Date().toISOString()
      }
      if ((stageStatus === 'success' || stageStatus === 'failed') && !stageResult.completedAt) {
        stageResult.completedAt = new Date().toISOString()
      }
      if (error) {
        stageResult.error = error
      }

      // Add in-memory logs to this stage's logs
      const running = this.runningWorkloads.get(workloadId)
      if (running) {
        const stageLogs = running.logs
          .filter(log => log.stage === stage)
          .map(log => log.message)

        if (stageLogs.length > 0) {
          stageResult.logs = [...(stageResult.logs || []), ...stageLogs]
        }
      }

      // Determine overall workload status
      let workloadStatus: 'pending' | 'running' | 'success' | 'failed' = 'running'
      if (stageStatus === 'failed') {
        workloadStatus = 'failed'
      } else if (stage === 'stopped' && stageStatus === 'success') {
        workloadStatus = 'success'
      }

      await this.workloadStore!.update(workloadId, {
        currentStage: stage,
        status: workloadStatus,
        stages,
        updatedAt: new Date().toISOString(),
      })

      // Emit workload update event for real-time UI updates
      await this.emitWorkloadUpdate(workloadId)
    } catch (err) {
      console.error(`Failed to update workload stage: ${err}`)
    }
  }

  private async emitWorkloadUpdate(workloadId: string): Promise<void> {
    try {
      const workload = await this.workloadStore!.findById(workloadId) as any
      if (!workload) return

      // Transform flat logs array into grouped stages for the SSE event
      const stages = this.transformLogsToStages(workload.logs || [])

      workloadEvents.emitWorkloadUpdate({
        workloadId: workload.id,
        deploymentId: workload.deploymentId,
        projectId: workload.projectId,
        currentStage: workload.currentStage || workload.stage,
        status: workload.status || 'running',
        stages,
        updatedAt: new Date().toISOString(),
      })
    } catch (err) {
      console.error(`Failed to emit workload update: ${err}`)
    }
  }

  private transformLogsToStages(logs: Array<{ timestamp: Date; stage: WorkloadStage; message: string; level: string }>): Array<{
    stage: string
    status: string
    startedAt?: string
    completedAt?: string
    duration?: number
    logs: string[]
    error?: string
  }> {
    const stageMap = new Map<string, {
      stage: string
      status: string
      logs: string[]
      startedAt?: string
      completedAt?: string
      error?: string
    }>()

    for (const log of logs) {
      const stage = log.stage
      if (!stageMap.has(stage)) {
        stageMap.set(stage, {
          stage,
          status: 'pending',
          logs: [],
          startedAt: log.timestamp.toISOString(),
        })
      }

      const stageResult = stageMap.get(stage)!
      stageResult.logs.push(log.message)

      // Update status based on log level
      if (log.level === 'error') {
        stageResult.status = 'failed'
        if (!stageResult.error) {
          stageResult.error = log.message
        }
      }

      // Track latest timestamp
      const logTime = log.timestamp.toISOString()
      if (!stageResult.completedAt || logTime > stageResult.completedAt) {
        stageResult.completedAt = logTime
      }
    }

    // Calculate durations and finalize statuses
    const stages = Array.from(stageMap.values())
    for (const stage of stages) {
      if (stage.startedAt && stage.completedAt) {
        const start = new Date(stage.startedAt).getTime()
        const end = new Date(stage.completedAt).getTime()
        stage.duration = end - start
      }

      // If no error was set and stage has logs, mark as success
      if (stage.status === 'pending' && stage.logs.length > 0) {
        stage.status = 'success'
      }
    }

    return stages
  }

  async start(workloadId: string, repoUrl: string): Promise<void> {
    let workDir: string | null = null

    try {
      // Get workload from database
      const workload = await this.workloadStore!.findById(workloadId)
      if (!workload) {
        throw new Error(`Workload ${workloadId} not found`)
      }

      // Stage 1: Starting Container (prepare environment)
      await this.updateStage(workloadId, 'starting-container')
      await this.addLog(workloadId, 'starting-container', 'Preparing container environment')

      // Prepare work directory for building container
      workDir = join(tmpdir(), 'workloads', workloadId)
      await this.addLog(workloadId, 'starting-container', `Preparing work directory: ${workDir}`)
      await this.updateStage(workloadId, 'starting-container', 'success')

      // Stage 2: Cloning Repository
      await this.updateStage(workloadId, 'cloning-repo', 'running')
      await this.addLog(workloadId, 'cloning-repo', `Cloning repository from ${repoUrl}`)

      try {
        await exec(`git clone ${repoUrl} ${workDir}`)
        await this.addLog(workloadId, 'cloning-repo', 'Repository cloned successfully')
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        throw new Error(`Failed to clone repository: ${message}`)
      }

      // Validate service exists
      const servicePath = join(workDir, workload.servicePath)
      if (!existsSync(servicePath)) {
        throw new Error(`Service path does not exist: ${servicePath}`)
      }

      const serviceJsonPath = join(servicePath, 'service.json')
      if (!existsSync(serviceJsonPath)) {
        throw new Error(`service.json not found at: ${serviceJsonPath}`)
      }

      await this.addLog(workloadId, 'cloning-repo', 'Service configuration validated')
      await this.updateStage(workloadId, 'cloning-repo', 'success')

      // Stage 3: Starting Service
      await this.updateStage(workloadId, 'starting-service', 'running')
      await this.addLog(workloadId, 'starting-service', 'Preparing runtime environment')

      const port = this.portPool.assign()
      if (!port) {
        throw new Error('No available ports')
      }

      await this.addLog(workloadId, 'starting-service', `Assigned port ${port}`)

      // Update workload with port
      await this.workloadStore!.update(workloadId, { port })

      // Read service.json to get entry point
      const serviceConfig = JSON.parse(await readFile(serviceJsonPath, 'utf-8'))
      const entryFile = serviceConfig.entry || 'index.js'

      // Build container using ExpressServiceBuilder
      await this.addLog(workloadId, 'starting-service', 'Building Docker image')
      const imageId = await this.expressBuilder.buildContainer(servicePath, {
        workloadId,
        entryFile,
        port: 3000,
        resourcePath: workload.servicePath,
      })
      await this.addLog(workloadId, 'starting-service', 'Docker image built successfully')

      // Create and start container
      await this.addLog(workloadId, 'starting-service', 'Starting Docker container')
      const containerName = `workload-${workloadId}`
      const imageName = `workload-${workloadId}`

      let containerId: string | null = null
      try {
        containerId = await this.containerLifecycle.create({
          name: containerName,
          image: imageName,
          ports: [{ container: 3000, host: port }],
        })
        await this.addLog(workloadId, 'starting-service', `Container created: ${containerId.substring(0, 12)}`)

        await this.containerLifecycle.start(containerId)
        await this.addLog(workloadId, 'starting-service', `Container started: ${containerId.substring(0, 12)}`)
      } catch (error) {
        // Clean up container if start failed
        if (containerId) {
          try {
            await this.containerLifecycle.cleanup(containerId)
          } catch (cleanupError) {
            // Ignore cleanup errors
          }
        }
        throw error
      }

      // Capture container logs for debugging
      try {
        const logs = await this.dockerClient.getContainerLogs(containerId)
        if (logs) {
          await this.addLog(workloadId, 'starting-service', `Container logs: ${logs}`)
        }
      } catch (err) {
        // Ignore log errors
      }

      // Wait for container to be ready
      await new Promise(resolve => setTimeout(resolve, 2000))

      await this.updateStage(workloadId, 'starting-service', 'success')

      // Stage 4: Running
      await this.updateStage(workloadId, 'running', 'running')
      await this.addLog(workloadId, 'running', `Service running on port ${port} (Container: ${containerId.substring(0, 12)})`)

      // Store running workload info
      this.runningWorkloads.set(workloadId, {
        workloadId,
        containerId,
        port,
        logs: [],
        workDir,
      })

      // Track resources
      this.resources.track(workloadId, {
        id: workloadId,
        type: 'container',
        containerId,
        imageId,
        port,
        workDir,
        metadata: { workloadId, repoUrl },
      })

      // Update workload with container ID
      await this.workloadStore!.update(workloadId, {
        containerId,
      })

      await this.addLog(workloadId, 'running', `Service started on port ${port}`)

      // Monitor container in background
      this.monitorContainer(workloadId, containerId, port, workDir)

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      await this.addLog(workloadId, 'failed', `Failed to start workload: ${errorMessage}`, 'error')
      await this.updateStage(workloadId, 'failed', 'failed', errorMessage)

      // Release port if it was assigned
      const running = this.runningWorkloads.get(workloadId)
      if (running?.port) {
        this.portPool.release(running.port)
      }

      if (workDir) {
        await this.cleanupWorkDir(workloadId, workDir)
      }
      throw error
    }
  }

  private async cleanupWorkDir(workloadId: string, workDir: string): Promise<void> {
    try {
      await this.addLog(workloadId, 'stopped', `Cleaning up work directory: ${workDir}`)
      await rm(workDir, { recursive: true, force: true })
      await this.addLog(workloadId, 'stopped', 'Work directory cleaned up')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      await this.addLog(workloadId, 'stopped', `Failed to cleanup work directory: ${message}`, 'warn')
    }
  }

  private monitorContainer(workloadId: string, containerId: string, port: number, workDir: string): void {
    let lastRunningState: boolean | null = null

    // Use dockerClient to monitor container state
    this.dockerClient.monitorContainer(containerId, async (state) => {
      // Only process if state changed from running to not running
      if (lastRunningState === true && !state.running) {
        const exitCode = state.exitCode || 0

        await this.addLog(
          workloadId,
          'stopped',
          `Container exited with code ${exitCode}`,
          exitCode === 0 ? 'info' : 'error'
        )
        await this.updateStage(
          workloadId,
          exitCode === 0 ? 'stopped' : 'failed',
          exitCode === 0 ? 'success' : 'failed',
          exitCode !== 0 ? `Container exited with code ${exitCode}` : undefined
        )
        this.portPool.release(port)
        this.runningWorkloads.delete(workloadId)
        this.resources.untrack(workloadId)
        await this.cleanupContainer(workloadId, containerId, workDir)
      }

      // Track last state
      lastRunningState = state.running
    }).catch(err => {
      console.error(`Failed to monitor container ${containerId}:`, err)
    })
  }

  private async cleanupContainer(workloadId: string, containerId: string, workDir: string): Promise<void> {
    try {
      await this.addLog(workloadId, 'stopped', 'Removing container')
      await this.containerLifecycle.cleanup(containerId)
      await this.addLog(workloadId, 'stopped', 'Container removed')

      // Remove image
      const imageName = `workload-${workloadId}`
      try {
        await this.imageBuilder.removeImage(imageName, true)
      } catch (error) {
        // Ignore errors if image doesn't exist
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      await this.addLog(workloadId, 'stopped', `Failed to cleanup container: ${message}`, 'warn')
    }

    // Cleanup work directory
    await this.cleanupWorkDir(workloadId, workDir)
  }

  async stop(workloadId: string): Promise<void> {
    const running = this.runningWorkloads.get(workloadId)
    if (!running) {
      throw new Error(`Workload ${workloadId} is not running`)
    }

    // Stage: Graceful Shutdown
    await this.updateStage(workloadId, 'graceful-shutdown', 'running')
    await this.addLog(workloadId, 'graceful-shutdown', 'Initiating graceful shutdown')

    // Stop Docker container gracefully
    await this.containerLifecycle.stop(running.containerId, true)
    await this.addLog(workloadId, 'graceful-shutdown', 'Container stopped')
    await this.updateStage(workloadId, 'graceful-shutdown', 'success')

    // Cleanup
    await this.cleanupContainer(workloadId, running.containerId, running.workDir)
    this.portPool.release(running.port)
    this.runningWorkloads.delete(workloadId)
    this.resources.untrack(workloadId)

    // Stage: Stopped
    await this.updateStage(workloadId, 'stopped', 'success')
    await this.addLog(workloadId, 'stopped', 'Service stopped')
  }

  async getStatus(workloadId: string): Promise<{ running: boolean; port?: number; containerId?: string }> {
    const running = this.runningWorkloads.get(workloadId)
    if (!running) {
      return { running: false }
    }

    return {
      running: true,
      port: running.port,
      containerId: running.containerId,
    }
  }

  async getLogs(workloadId: string): Promise<LogEntry[]> {
    const running = this.runningWorkloads.get(workloadId)
    if (running) {
      return running.logs
    }

    // Get logs from database if not running
    try {
      const workload = await this.workloadStore!.findById(workloadId)
      return workload?.logs || []
    } catch (error) {
      return []
    }
  }
}

// Singleton instance
export const orchestrator = new WorkloadOrchestrator()
