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
  logFlushInterval?: NodeJS.Timeout
}

export class WorkloadOrchestrator {
  private workloadStore?: ResourceStore<any>
  private deploymentStore?: ResourceStore<any>
  private runningWorkloads: Map<string, RunningWorkload> = new Map()
  private operationLocks: Map<string, boolean> = new Map()
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

  setDeploymentStore(store: ResourceStore<any>) {
    this.deploymentStore = store
  }

  private acquireLock(workloadId: string): boolean {
    if (this.operationLocks.get(workloadId)) {
      return false
    }
    this.operationLocks.set(workloadId, true)
    return true
  }

  private releaseLock(workloadId: string): void {
    this.operationLocks.delete(workloadId)
  }

  isOperationInProgress(workloadId: string): boolean {
    return this.operationLocks.get(workloadId) === true
  }

  private isTransitioning(stage: WorkloadStage): boolean {
    return ['starting-container', 'cloning-repo', 'starting-service', 'graceful-shutdown'].includes(stage)
  }

  async validateWorkloadState(workloadId: string, operation: 'stop' | 'restart'): Promise<{ valid: boolean; error?: string; currentStage?: WorkloadStage }> {
    const workload = await this.workloadStore!.findById(workloadId) as any

    if (!workload) {
      return { valid: false, error: 'Workload not found' }
    }

    const currentStage = workload.stage as WorkloadStage

    if (operation === 'stop') {
      if (currentStage === 'stopped') {
        return { valid: false, error: 'Cannot stop workload: already stopped', currentStage }
      }
      if (this.isTransitioning(currentStage)) {
        return { valid: false, error: `Cannot stop workload: operation in progress (${currentStage})`, currentStage }
      }
    }

    if (operation === 'restart') {
      if (this.isTransitioning(currentStage)) {
        return { valid: false, error: `Cannot restart workload: operation in progress (${currentStage})`, currentStage }
      }
    }

    return { valid: true, currentStage }
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
    // when updateStage is called or when periodic flush happens
  }

  private async flushLogs(workloadId: string): Promise<void> {
    const running = this.runningWorkloads.get(workloadId)
    if (!running || running.logs.length === 0) {
      return
    }

    try {
      const workload = await this.workloadStore!.findById(workloadId)
      if (!workload) {
        console.error(`[Orchestrator] Workload ${workloadId} not found when flushing logs`)
        return
      }

      // Combine existing logs from DB with new in-memory logs
      const existingLogs = Array.isArray(workload.logs) ? workload.logs : []
      const allLogs = [...existingLogs, ...running.logs]

      // Clear in-memory logs after writing to DB
      running.logs = []

      // Update workload with all logs (keep current stage)
      await this.workloadStore!.update(workloadId, {
        logs: allLogs,
      })

      console.log(`[Orchestrator] Flushed ${allLogs.length - existingLogs.length} logs for workload ${workloadId}`)

      // Emit workload update event for real-time UI updates
      await this.emitWorkloadUpdate(workloadId)
    } catch (err) {
      console.error(`[Orchestrator] Failed to flush logs: ${err}`)
    }
  }

  private async updateStage(workloadId: string, stage: WorkloadStage, stageStatus: 'running' | 'success' | 'failed' = 'running', error?: string): Promise<void> {
    try {
      const workload = await this.workloadStore!.findById(workloadId)
      if (!workload) {
        console.error(`[Orchestrator] Workload ${workloadId} not found when updating stage`)
        return
      }

      console.log(`[Orchestrator] Updating workload ${workloadId} stage to ${stage} (${stageStatus})`)

      // Get in-memory logs for this workload
      const running = this.runningWorkloads.get(workloadId)
      const inMemoryLogs = running ? running.logs : []

      // Combine existing logs from DB with new in-memory logs
      const existingLogs = Array.isArray(workload.logs) ? workload.logs : []
      const allLogs = [...existingLogs, ...inMemoryLogs]

      // Clear in-memory logs after writing to DB
      if (running) {
        running.logs = []
      }

      // Update workload with current stage and all logs
      await this.workloadStore!.update(workloadId, {
        stage,
        logs: allLogs,
        error: error || workload.error,
      })

      console.log(`[Orchestrator] Updated workload ${workloadId}: stage=${stage}, logs=${allLogs.length} entries`)

      // Emit workload update event for real-time UI updates
      await this.emitWorkloadUpdate(workloadId)
    } catch (err) {
      console.error(`[Orchestrator] Failed to update workload stage: ${err}`)
    }
  }

  private async emitWorkloadUpdate(workloadId: string): Promise<void> {
    try {
      const workload = await this.workloadStore!.findById(workloadId) as any
      if (!workload) {
        console.error(`[Orchestrator] Workload ${workloadId} not found when emitting update`)
        return
      }

      console.log(`[Orchestrator] Emitting workload update for ${workloadId}`)

      // Get deployment to find projectId
      let projectId = workload.projectId
      if (!projectId && this.deploymentStore) {
        const deployment = await this.deploymentStore.findById(workload.deploymentId) as any
        projectId = deployment?.projectId
      }

      // Transform flat logs array into grouped stages for the SSE event
      const stages = this.transformLogsToStages(workload.logs || [])

      // Determine status based on current stage
      let status = 'running'
      if (workload.stage === 'stopped') {
        status = 'success'
      } else if (workload.stage === 'failed' || workload.error) {
        status = 'failed'
      } else if (workload.stage === 'pending') {
        status = 'pending'
      }

      workloadEvents.emitWorkloadUpdate({
        workloadId: workload.id,
        deploymentId: workload.deploymentId,
        projectId: projectId || '',
        currentStage: workload.stage,
        status,
        stages,
        updatedAt: new Date().toISOString(),
      })

      console.log(`[Orchestrator] Emitted workload update: stage=${workload.stage}, status=${status}, stages=${stages.length}`)
    } catch (err) {
      console.error(`[Orchestrator] Failed to emit workload update: ${err}`)
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

    console.log(`[Orchestrator] Starting workload ${workloadId} with repo ${repoUrl}`)

    try {
      // Get workload from database
      const workload = await this.workloadStore!.findById(workloadId)
      if (!workload) {
        const error = `Workload ${workloadId} not found`
        console.error(`[Orchestrator] ${error}`)
        throw new Error(error)
      }

      console.log(`[Orchestrator] Found workload: deploymentId=${workload.deploymentId}, servicePath=${workload.servicePath}`)

      // Initialize running workload entry early so addLog() works
      workDir = join(tmpdir(), 'workloads', workloadId)
      this.runningWorkloads.set(workloadId, {
        workloadId,
        containerId: '',
        port: 0,
        logs: [],
        workDir,
      })

      // Stage 1: Starting Container (prepare environment)
      await this.updateStage(workloadId, 'starting-container', 'running')
      await this.addLog(workloadId, 'starting-container', 'Preparing container environment')

      console.log(`[Orchestrator] Work directory: ${workDir}`)
      await this.addLog(workloadId, 'starting-container', `Preparing work directory: ${workDir}`)
      await this.updateStage(workloadId, 'starting-container', 'success')

      // Stage 2: Cloning Repository
      await this.updateStage(workloadId, 'cloning-repo', 'running')
      await this.addLog(workloadId, 'cloning-repo', `Cloning repository from ${repoUrl}`)
      console.log(`[Orchestrator] Cloning ${repoUrl} into ${workDir}`)

      try {
        const { stdout, stderr } = await exec(`git clone ${repoUrl} ${workDir}`)
        console.log(`[Orchestrator] Git clone stdout: ${stdout}`)
        if (stderr) console.log(`[Orchestrator] Git clone stderr: ${stderr}`)
        await this.addLog(workloadId, 'cloning-repo', 'Repository cloned successfully')
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        console.error(`[Orchestrator] Failed to clone repository: ${message}`)
        throw new Error(`Failed to clone repository: ${message}`)
      }

      // Validate service exists
      const servicePath = join(workDir, workload.servicePath)
      console.log(`[Orchestrator] Validating service path: ${servicePath}`)
      if (!existsSync(servicePath)) {
        const error = `Service path does not exist: ${servicePath}`
        console.error(`[Orchestrator] ${error}`)
        throw new Error(error)
      }

      const serviceJsonPath = join(servicePath, 'service.json')
      if (!existsSync(serviceJsonPath)) {
        const error = `service.json not found at: ${serviceJsonPath}`
        console.error(`[Orchestrator] ${error}`)
        throw new Error(error)
      }

      console.log(`[Orchestrator] Service configuration validated`)
      await this.addLog(workloadId, 'cloning-repo', 'Service configuration validated')
      await this.updateStage(workloadId, 'cloning-repo', 'success')

      // Stage 3: Starting Service
      await this.updateStage(workloadId, 'starting-service', 'running')
      await this.addLog(workloadId, 'starting-service', 'Preparing runtime environment')

      const port = this.portPool.assign()
      if (!port) {
        const error = 'No available ports'
        console.error(`[Orchestrator] ${error}`)
        throw new Error(error)
      }

      console.log(`[Orchestrator] Assigned port ${port} to workload ${workloadId}`)
      await this.addLog(workloadId, 'starting-service', `Assigned port ${port}`)

      // Update workload with port
      await this.workloadStore!.update(workloadId, { port })

      // Read service.json to get entry point
      const serviceConfig = JSON.parse(await readFile(serviceJsonPath, 'utf-8'))
      const entryFile = serviceConfig.entry || 'index.js'
      console.log(`[Orchestrator] Service entry file: ${entryFile}`)

      // Build container using ExpressServiceBuilder
      await this.addLog(workloadId, 'starting-service', 'Building Docker image')
      console.log(`[Orchestrator] Building Docker image for ${servicePath}`)
      const imageId = await this.expressBuilder.buildContainer(servicePath, {
        workloadId,
        entryFile,
        port: 3000,
        resourcePath: workload.servicePath,
      })
      console.log(`[Orchestrator] Docker image built: ${imageId}`)
      await this.addLog(workloadId, 'starting-service', 'Docker image built successfully')

      // Create and start container with port retry logic
      await this.addLog(workloadId, 'starting-service', 'Starting Docker container')
      const baseContainerName = `workload-${workloadId}`
      const imageName = `workload-${workloadId}`

      let containerId: string | null = null
      let currentPort = port
      let retryCount = 0
      const maxRetries = 5

      while (retryCount < maxRetries) {
        // Use unique container name for each retry to avoid Docker name conflicts
        const containerName = retryCount === 0 ? baseContainerName : `${baseContainerName}-retry${retryCount}`

        try {
          console.log(`[Orchestrator] Attempt ${retryCount + 1}/${maxRetries}: Creating container ${containerName} on port ${currentPort}`)
          containerId = await this.containerLifecycle.create({
            name: containerName,
            image: imageName,
            ports: [{ container: 3000, host: currentPort }],
          })
          console.log(`[Orchestrator] Container created: ${containerId}`)
          await this.addLog(workloadId, 'starting-service', `Container created: ${containerId.substring(0, 12)}`)

          console.log(`[Orchestrator] Starting container ${containerId}`)
          await this.containerLifecycle.start(containerId)
          console.log(`[Orchestrator] Container started successfully on port ${currentPort}`)
          await this.addLog(workloadId, 'starting-service', `Container started on port ${currentPort}`)

          // Success - update port if it changed
          if (currentPort !== port) {
            this.portPool.release(port)
            await this.workloadStore!.update(workloadId, { port: currentPort })
            console.log(`[Orchestrator] Port updated from ${port} to ${currentPort}`)
          }

          break // Exit retry loop on success
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error'
          const isPortConflict = message.includes('port is already allocated') ||
                                message.includes('address already in use') ||
                                message.includes('Bind for')

          console.error(`[Orchestrator] Attempt ${retryCount + 1} failed: ${message}`)

          // Clean up container if it was created
          if (containerId) {
            try {
              console.log(`[Orchestrator] Cleaning up failed container ${containerId.substring(0, 12)}`)
              await this.containerLifecycle.cleanup(containerId)
              containerId = null
            } catch (cleanupError) {
              console.error(`[Orchestrator] Failed to cleanup container: ${cleanupError}`)
            }
          }

          // If port conflict, retry with new port
          if (isPortConflict && retryCount < maxRetries - 1) {
            console.log(`[Orchestrator] Port ${currentPort} conflict detected, retrying with new port...`)
            await this.addLog(workloadId, 'starting-service', `Port ${currentPort} unavailable, retrying with new port (attempt ${retryCount + 2}/${maxRetries})`)

            // Release current port and get a new one
            this.portPool.release(currentPort)
            const newPort = this.portPool.assign()
            if (!newPort) {
              throw new Error('No available ports after retry')
            }
            currentPort = newPort
            retryCount++
            continue
          }

          // Not a port conflict or max retries reached
          throw error
        }
      }

      // Capture container logs for debugging
      try {
        const logs = await this.dockerClient.getContainerLogs(containerId)
        if (logs) {
          console.log(`[Orchestrator] Container logs: ${logs}`)
          await this.addLog(workloadId, 'starting-service', `Container logs: ${logs}`)
        }
      } catch (err) {
        console.error(`[Orchestrator] Failed to get container logs: ${err}`)
      }

      // Wait for container to be ready
      console.log(`[Orchestrator] Waiting for container to be ready...`)
      await new Promise(resolve => setTimeout(resolve, 2000))

      await this.updateStage(workloadId, 'starting-service', 'success')

      // Stage 4: Running
      await this.updateStage(workloadId, 'running', 'running')
      console.log(`[Orchestrator] Workload ${workloadId} is now running on port ${currentPort}`)
      await this.addLog(workloadId, 'running', `Service running on port ${currentPort} (Container: ${containerId.substring(0, 12)})`)

      // Update running workload info with container details
      const running = this.runningWorkloads.get(workloadId)!
      running.containerId = containerId
      running.port = currentPort
      console.log(`[Orchestrator] Updated running workload info for ${workloadId}`)

      // Track resources
      this.resources.track(workloadId, {
        id: workloadId,
        type: 'container',
        containerId,
        imageId,
        port: currentPort,
        workDir,
        metadata: { workloadId, repoUrl },
      })

      // Update workload with container ID
      await this.workloadStore!.update(workloadId, {
        containerId,
      })

      await this.addLog(workloadId, 'running', `Service started on port ${currentPort}`)

      // Monitor container in background
      console.log(`[Orchestrator] Starting container monitoring for ${workloadId}`)
      this.monitorContainer(workloadId, containerId, currentPort, workDir)

      // Stream container logs in background
      console.log(`[Orchestrator] Starting log streaming for ${workloadId}`)
      this.streamContainerLogs(workloadId, containerId).catch(err => {
        console.error(`[Orchestrator] Log streaming error for ${workloadId}:`, err)
      })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error(`[Orchestrator] Failed to start workload ${workloadId}: ${errorMessage}`)
      await this.addLog(workloadId, 'failed', `Failed to start workload: ${errorMessage}`, 'error')
      await this.updateStage(workloadId, 'failed', 'failed', errorMessage)

      // Release port if it was assigned
      const running = this.runningWorkloads.get(workloadId)
      if (running?.port) {
        console.log(`[Orchestrator] Releasing port ${running.port}`)
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
      console.log(`[Orchestrator] Cleaning up work directory: ${workDir}`)
      await this.addLog(workloadId, 'stopped', `Cleaning up work directory: ${workDir}`)
      await rm(workDir, { recursive: true, force: true })
      console.log(`[Orchestrator] Work directory cleaned up`)
      await this.addLog(workloadId, 'stopped', 'Work directory cleaned up')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error(`[Orchestrator] Failed to cleanup work directory: ${message}`)
      await this.addLog(workloadId, 'stopped', `Failed to cleanup work directory: ${message}`, 'warn')
    }
  }

  private monitorContainer(workloadId: string, containerId: string, port: number, workDir: string): void {
    let lastRunningState: boolean | null = null

    console.log(`[Orchestrator] Monitoring container ${containerId} for workload ${workloadId}`)

    // Use dockerClient to monitor container state
    this.dockerClient.monitorContainer(containerId, async (state) => {
      // Only process if state changed from running to not running
      if (lastRunningState === true && !state.running) {
        const exitCode = state.exitCode || 0

        console.log(`[Orchestrator] Container ${containerId} exited with code ${exitCode}`)

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
        console.log(`[Orchestrator] Released port ${port} after container exit`)

        // Clear log flush interval before cleanup
        const running = this.runningWorkloads.get(workloadId)
        if (running?.logFlushInterval) {
          clearInterval(running.logFlushInterval)
        }

        this.runningWorkloads.delete(workloadId)
        this.resources.untrack(workloadId)
        await this.cleanupContainer(workloadId, containerId, workDir)
      }

      // Track last state
      lastRunningState = state.running
    }).catch(err => {
      console.error(`[Orchestrator] Failed to monitor container ${containerId}:`, err)
    })
  }

  private async streamContainerLogs(workloadId: string, containerId: string): Promise<void> {
    const abortController = new AbortController()
    const running = this.runningWorkloads.get(workloadId)

    if (!running) {
      console.log(`[Orchestrator] Cannot stream logs - workload ${workloadId} not found`)
      return
    }

    // Start periodic log flush (every 2 seconds)
    const flushInterval = setInterval(() => {
      this.flushLogs(workloadId).catch(err => {
        console.error(`[Orchestrator] Failed to flush logs for ${workloadId}:`, err)
      })
    }, 2000)

    // Store interval so we can clean it up later
    running.logFlushInterval = flushInterval

    // Cleanup function
    const cleanup = () => {
      abortController.abort()
      clearInterval(flushInterval)
      // Flush any remaining logs
      this.flushLogs(workloadId).catch(err => {
        console.error(`[Orchestrator] Failed to flush remaining logs for ${workloadId}:`, err)
      })
    }

    try {
      await this.dockerClient.streamContainerLogs(
        containerId,
        async (logLine) => {
          // Add each log line to the workload
          await this.addLog(workloadId, 'running', logLine)
          console.log(`[Container ${containerId.substring(0, 12)}] ${logLine}`)
        },
        abortController.signal
      )
    } catch (error) {
      if (error instanceof Error && !error.message.includes('aborted')) {
        console.error(`[Orchestrator] Log streaming failed for ${workloadId}:`, error)
      }
    } finally {
      cleanup()
    }
  }

  private async cleanupContainer(workloadId: string, containerId: string, workDir: string): Promise<void> {
    try {
      console.log(`[Orchestrator] Cleaning up container ${containerId}`)
      await this.addLog(workloadId, 'stopped', 'Removing container')
      await this.containerLifecycle.cleanup(containerId)
      console.log(`[Orchestrator] Container removed`)
      await this.addLog(workloadId, 'stopped', 'Container removed')

      // Remove image
      const imageName = `workload-${workloadId}`
      try {
        console.log(`[Orchestrator] Removing image ${imageName}`)
        await this.imageBuilder.removeImage(imageName, true)
        console.log(`[Orchestrator] Image removed`)
      } catch (error) {
        console.log(`[Orchestrator] Image ${imageName} not found or already removed`)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error(`[Orchestrator] Failed to cleanup container: ${message}`)
      await this.addLog(workloadId, 'stopped', `Failed to cleanup container: ${message}`, 'warn')
    }

    // Cleanup work directory
    await this.cleanupWorkDir(workloadId, workDir)
  }

  async stop(workloadId: string): Promise<void> {
    console.log(`[Orchestrator] Stopping workload ${workloadId}`)

    // Acquire lock to prevent concurrent operations
    if (!this.acquireLock(workloadId)) {
      const error = 'Operation already in progress'
      console.error(`[Orchestrator] ${error}`)
      throw new Error(error)
    }

    try {
      // Check workload exists and get current stage
      const workload = await this.workloadStore!.findById(workloadId) as any
      if (!workload) {
        throw new Error(`Workload ${workloadId} not found`)
      }

      // Check if already stopped
      if (workload.stage === 'stopped') {
        throw new Error('Cannot stop workload: already stopped')
      }

      const running = this.runningWorkloads.get(workloadId)
      if (!running) {
        throw new Error(`Workload ${workloadId} is not running`)
      }

      // Stage: Graceful Shutdown
      await this.updateStage(workloadId, 'graceful-shutdown', 'running')
      await this.addLog(workloadId, 'graceful-shutdown', 'Initiating graceful shutdown')

      // Stop Docker container gracefully
      console.log(`[Orchestrator] Stopping container ${running.containerId}`)
      await this.containerLifecycle.stop(running.containerId, true)
      console.log(`[Orchestrator] Container stopped`)
      await this.addLog(workloadId, 'graceful-shutdown', 'Container stopped')
      await this.updateStage(workloadId, 'graceful-shutdown', 'success')

      // Clear log flush interval
      if (running.logFlushInterval) {
        clearInterval(running.logFlushInterval)
      }

      // Cleanup
      await this.cleanupContainer(workloadId, running.containerId, running.workDir)
      this.portPool.release(running.port)
      console.log(`[Orchestrator] Released port ${running.port}`)
      this.runningWorkloads.delete(workloadId)
      this.resources.untrack(workloadId)

      // Stage: Stopped
      await this.updateStage(workloadId, 'stopped', 'success')
      await this.addLog(workloadId, 'stopped', 'Service stopped')
      console.log(`[Orchestrator] Workload ${workloadId} stopped successfully`)
    } finally {
      // Always release lock, even if operation fails
      this.releaseLock(workloadId)
    }
  }

  async restart(workloadId: string): Promise<void> {
    console.log(`[Orchestrator] Restarting workload ${workloadId}`)

    // Acquire lock to prevent concurrent operations
    if (!this.acquireLock(workloadId)) {
      const error = 'Operation already in progress'
      console.error(`[Orchestrator] ${error}`)
      throw new Error(error)
    }

    try {
      // Get workload details before stopping
      const workload = await this.workloadStore!.findById(workloadId) as any
      if (!workload) {
        const error = `Workload ${workloadId} not found`
        console.error(`[Orchestrator] ${error}`)
        throw new Error(error)
      }

      const { deploymentId, repoUrl } = workload

      // Stop if currently running (release lock temporarily for stop operation)
      const running = this.runningWorkloads.get(workloadId)
      if (running) {
        console.log(`[Orchestrator] Stopping running workload before restart`)
        this.releaseLock(workloadId)
        await this.stop(workloadId)
        // Re-acquire lock after stop
        if (!this.acquireLock(workloadId)) {
          throw new Error('Failed to re-acquire lock after stop')
        }
      } else {
        console.log(`[Orchestrator] Workload not running, proceeding to start`)
      }

      // Start with same configuration
      console.log(`[Orchestrator] Starting workload after restart`)
      await this.start(workloadId, repoUrl)

      console.log(`[Orchestrator] Workload ${workloadId} restarted successfully`)
    } finally {
      // Always release lock, even if operation fails
      this.releaseLock(workloadId)
    }
  }

  async forceCleanup(workloadId: string): Promise<void> {
    console.log(`[Orchestrator] Force cleanup workload ${workloadId}`)

    // Try to get workload from database to find container info
    const workload = await this.workloadStore?.findById(workloadId) as any

    // Clean up if in running state
    const running = this.runningWorkloads.get(workloadId)
    if (running) {
      console.log(`[Orchestrator] Cleaning up running workload`)
      try {
        await this.containerLifecycle.stop(running.containerId, false)
      } catch (error) {
        console.log(`[Orchestrator] Container already stopped or not found`)
      }
      await this.cleanupContainer(workloadId, running.containerId, running.workDir)
      this.portPool.release(running.port)
      this.runningWorkloads.delete(workloadId)
      this.resources.untrack(workloadId)
    } else if (workload?.containerId) {
      // Workload not in memory but has container ID in DB
      console.log(`[Orchestrator] Cleaning up stopped workload with container ${workload.containerId}`)
      try {
        await this.containerLifecycle.cleanup(workload.containerId)
      } catch (error) {
        console.log(`[Orchestrator] Container already removed`)
      }

      // Try to remove image
      const imageName = `workload-${workloadId}`
      try {
        await this.imageBuilder.removeImage(imageName, true)
      } catch (error) {
        console.log(`[Orchestrator] Image already removed`)
      }

      // Try to cleanup work directory
      const workDir = join(tmpdir(), 'workloads', workloadId)
      try {
        await rm(workDir, { recursive: true, force: true })
      } catch (error) {
        console.log(`[Orchestrator] Work directory already removed`)
      }

      // Release port if it was assigned
      if (workload.port) {
        this.portPool.release(workload.port)
      }
    }

    console.log(`[Orchestrator] Force cleanup completed for workload ${workloadId}`)
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
