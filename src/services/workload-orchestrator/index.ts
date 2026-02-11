import { spawn, ChildProcess } from 'child_process'
import { existsSync } from 'fs'
import { join } from 'path'
import type { ResourceStore } from '@agentforge/dataobject'

type WorkloadStage = 'pending' | 'validate' | 'build' | 'deploy' | 'running' | 'failed' | 'stopped'

interface LogEntry {
  timestamp: Date
  stage: WorkloadStage
  message: string
  level: 'info' | 'warn' | 'error'
}

interface RunningWorkload {
  workloadId: string
  process: ChildProcess
  port: number
  logs: LogEntry[]
}

export class WorkloadOrchestrator {
  private workloadStore?: ResourceStore<any>
  private runningWorkloads: Map<string, RunningWorkload> = new Map()
  private availablePorts: Set<number> = new Set()
  private portRange = { min: 3100, max: 3200 }

  constructor() {
    // Initialize available ports
    for (let port = this.portRange.min; port <= this.portRange.max; port++) {
      this.availablePorts.add(port)
    }
  }

  setWorkloadStore(store: ResourceStore<any>) {
    this.workloadStore = store
  }

  private assignPort(): number | null {
    const port = Array.from(this.availablePorts)[0]
    if (port) {
      this.availablePorts.delete(port)
      return port
    }
    return null
  }

  private releasePort(port: number): void {
    this.availablePorts.add(port)
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

    // Update workload in database
    try {
      const workload = await this.workloadStore!.findById(workloadId)
      if (workload) {
        const updatedLogs = [
          ...(workload.logs || []),
          {
            timestamp: new Date(),
            stage,
            message,
            level,
          },
        ]
        await this.workloadStore!.update(workloadId, { logs: updatedLogs })
      }
    } catch (error) {
      console.error(`Failed to update workload logs: ${error}`)
    }
  }

  private async updateStage(workloadId: string, stage: WorkloadStage, error?: string): Promise<void> {
    try {
      await this.workloadStore!.update(workloadId, {
        stage,
        error,
      })
    } catch (err) {
      console.error(`Failed to update workload stage: ${err}`)
    }
  }

  async start(workloadId: string, projectPath: string): Promise<void> {
    try {
      // Get workload from database
      const workload = await this.workloadStore!.findById(workloadId)
      if (!workload) {
        throw new Error(`Workload ${workloadId} not found`)
      }

      // Stage 1: Validate
      await this.updateStage(workloadId, 'validate')
      await this.addLog(workloadId, 'validate', 'Validating service configuration')

      const servicePath = join(projectPath, workload.servicePath)
      if (!existsSync(servicePath)) {
        throw new Error(`Service path does not exist: ${servicePath}`)
      }

      const serviceJsonPath = join(servicePath, 'service.json')
      if (!existsSync(serviceJsonPath)) {
        throw new Error(`service.json not found at: ${serviceJsonPath}`)
      }

      await this.addLog(workloadId, 'validate', 'Service configuration is valid')

      // Stage 2: Build (skip for MVP - no dependency installation)
      await this.updateStage(workloadId, 'build')
      await this.addLog(workloadId, 'build', 'Skipping build (dependencies assumed installed)')

      // Stage 3: Deploy
      await this.updateStage(workloadId, 'deploy')
      await this.addLog(workloadId, 'deploy', 'Preparing runtime environment')

      const port = this.assignPort()
      if (!port) {
        throw new Error('No available ports')
      }

      await this.addLog(workloadId, 'deploy', `Assigned port ${port}`)

      // Update workload with port
      await this.workloadStore!.update(workloadId, { port })

      // Stage 4: Running - Start the service
      await this.updateStage(workloadId, 'running')
      await this.addLog(workloadId, 'running', 'Starting service')

      // For dataobjects, we need to start a temporary API server
      const serverProcess = await this.startDataobjectServer(servicePath, port, workloadId)

      // Store running workload info
      this.runningWorkloads.set(workloadId, {
        workloadId,
        process: serverProcess,
        port,
        logs: [],
      })

      // Update workload with container ID (process ID)
      await this.workloadStore!.update(workloadId, {
        containerId: serverProcess.pid?.toString(),
      })

      await this.addLog(workloadId, 'running', `Service started on port ${port} (PID: ${serverProcess.pid})`)

      // Set up process monitoring
      serverProcess.on('exit', async (code) => {
        await this.addLog(workloadId, 'stopped', `Process exited with code ${code}`, code === 0 ? 'info' : 'error')
        await this.updateStage(workloadId, code === 0 ? 'stopped' : 'failed', code !== 0 ? `Process exited with code ${code}` : undefined)
        this.releasePort(port)
        this.runningWorkloads.delete(workloadId)
      })

      serverProcess.on('error', async (err) => {
        await this.addLog(workloadId, 'failed', `Process error: ${err.message}`, 'error')
        await this.updateStage(workloadId, 'failed', err.message)
        this.releasePort(port)
        this.runningWorkloads.delete(workloadId)
      })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      await this.addLog(workloadId, 'failed', `Failed to start workload: ${errorMessage}`, 'error')
      await this.updateStage(workloadId, 'failed', errorMessage)
      throw error
    }
  }

  private async startDataobjectServer(servicePath: string, port: number, workloadId: string): Promise<ChildProcess> {
    // For now, we'll create a simple Express server that loads the dataobject
    // In a real implementation, this would be a more robust server generator

    const serverCode = `
const express = require('express');
const path = require('path');

const app = express();
app.use(express.json());

// Load the dataobject resource
const servicePath = ${JSON.stringify(servicePath)};
const resourceModule = require(path.join(servicePath, 'index.js'));

// Extract the resource definition
const resource = resourceModule.default || resourceModule.resource || resourceModule;

if (!resource) {
  console.error('Could not find resource export in service');
  process.exit(1);
}

console.log('Starting server for resource:', resource.name);

// Basic CRUD endpoints for the dataobject
app.get('/api/${workloadId}', async (req, res) => {
  try {
    const items = await resource.list(req.query);
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/${workloadId}/:id', async (req, res) => {
  try {
    const item = await resource.get(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/${workloadId}', async (req, res) => {
  try {
    const item = await resource.create(req.body);
    res.status(201).json(item);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/${workloadId}/:id', async (req, res) => {
  try {
    const item = await resource.update(req.params.id, req.body);
    res.json(item);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/${workloadId}/:id', async (req, res) => {
  try {
    await resource.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(${port}, () => {
  console.log(\`Server listening on port ${port}\`);
});
`

    // Spawn Node.js process to run the server
    const nodeProcess = spawn('node', ['-e', serverCode], {
      cwd: servicePath,
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    // Capture stdout
    nodeProcess.stdout?.on('data', async (data) => {
      const message = data.toString().trim()
      await this.addLog(workloadId, 'running', message)
    })

    // Capture stderr
    nodeProcess.stderr?.on('data', async (data) => {
      const message = data.toString().trim()
      await this.addLog(workloadId, 'running', message, 'error')
    })

    return nodeProcess
  }

  async stop(workloadId: string): Promise<void> {
    const running = this.runningWorkloads.get(workloadId)
    if (!running) {
      throw new Error(`Workload ${workloadId} is not running`)
    }

    await this.addLog(workloadId, 'stopped', 'Stopping service')

    // Kill the process
    running.process.kill('SIGTERM')

    // Give it time to shut down gracefully, then force kill if needed
    setTimeout(() => {
      if (!running.process.killed) {
        running.process.kill('SIGKILL')
      }
    }, 5000)

    await this.updateStage(workloadId, 'stopped')
  }

  async getStatus(workloadId: string): Promise<{ running: boolean; port?: number; pid?: number }> {
    const running = this.runningWorkloads.get(workloadId)
    if (!running) {
      return { running: false }
    }

    return {
      running: true,
      port: running.port,
      pid: running.process.pid,
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
