import { spawn, ChildProcess } from 'child_process'
import { existsSync } from 'fs'
import { rm, readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import { promisify } from 'util'
import { exec as execCallback } from 'child_process'
import type { ResourceStore } from '@agentforge/dataobject'

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

      // Stage 2: Cloning Repository
      await this.updateStage(workloadId, 'cloning-repo')
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

      // Stage 3: Starting Service
      await this.updateStage(workloadId, 'starting-service')
      await this.addLog(workloadId, 'starting-service', 'Preparing runtime environment')

      const port = this.assignPort()
      if (!port) {
        throw new Error('No available ports')
      }

      await this.addLog(workloadId, 'starting-service', `Assigned port ${port}`)

      // Update workload with port
      await this.workloadStore!.update(workloadId, { port })

      // Read service.json to get entry point
      const serviceConfig = JSON.parse(await readFile(serviceJsonPath, 'utf-8'))
      const entryFile = serviceConfig.entry || 'index.js'

      // Create package.json if it doesn't exist
      const packageJsonPath = join(servicePath, 'package.json')
      if (!existsSync(packageJsonPath)) {
        await this.addLog(workloadId, 'starting-service', 'Creating package.json')
        const packageJson = {
          name: 'dataobject-runtime',
          version: '1.0.0',
          private: true,
          dependencies: {
            express: '^4.18.2',
            tsx: '^4.7.0',
            zod: '^3.22.4',
          },
        }
        await writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf-8')
      }

      // Create mock @agentforge/dataobject module if it doesn't exist
      const nodeModulesPath = join(servicePath, 'node_modules')
      const agentforgeModulePath = join(nodeModulesPath, '@agentforge')
      const dataobjectModulePath = join(agentforgeModulePath, 'dataobject')

      if (!existsSync(dataobjectModulePath)) {
        await this.addLog(workloadId, 'starting-service', 'Creating mock dataobject module')
        await exec(`mkdir -p "${dataobjectModulePath}"`)

        // Create a minimal mock implementation
        const mockDataobject = `
const { z } = require('zod');

function defineResource(config) {
  return {
    name: config.name,
    schema: config.schema,
    list: async (query) => [],
    get: async (id) => null,
    create: async (data) => ({ id: 'mock-id', ...data }),
    update: async (id, data) => ({ id, ...data }),
    delete: async (id) => {},
  };
}

module.exports = {
  defineResource,
  z,
};
`
        const mockPackageJson = {
          name: '@agentforge/dataobject',
          version: '0.0.1',
          main: 'index.js',
        }

        await writeFile(join(dataobjectModulePath, 'index.js'), mockDataobject, 'utf-8')
        await writeFile(join(dataobjectModulePath, 'package.json'), JSON.stringify(mockPackageJson), 'utf-8')
      }

      // Create Dockerfile
      await this.addLog(workloadId, 'starting-service', 'Creating Dockerfile')
      await this.createDockerfile(servicePath, entryFile, workloadId)

      // Build Docker image
      await this.addLog(workloadId, 'starting-service', 'Building Docker image')
      const imageName = `workload-${workloadId}`
      try {
        await exec(`docker build -t ${imageName} .`, { cwd: servicePath })
        await this.addLog(workloadId, 'starting-service', 'Docker image built successfully')
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        throw new Error(`Failed to build Docker image: ${message}`)
      }

      // Run Docker container
      await this.addLog(workloadId, 'starting-service', 'Starting Docker container')
      const containerName = `workload-${workloadId}`
      try {
        const runResult = await exec(
          `docker run -d --name ${containerName} -p ${port}:3000 ${imageName}`
        )
        const containerId = runResult.stdout.trim()
        await this.addLog(workloadId, 'starting-service', `Container started: ${containerId.substring(0, 12)}`)

        // Capture container logs for debugging
        try {
          const logsResult = await exec(`docker logs ${containerId}`)
          if (logsResult.stdout) {
            await this.addLog(workloadId, 'starting-service', `Container stdout: ${logsResult.stdout}`)
          }
          if (logsResult.stderr) {
            await this.addLog(workloadId, 'starting-service', `Container stderr: ${logsResult.stderr}`, 'warn')
          }
        } catch (err) {
          // Ignore log errors
        }

        // Wait for container to be ready
        await new Promise(resolve => setTimeout(resolve, 2000))

        // Stage 4: Running
        await this.updateStage(workloadId, 'running')
        await this.addLog(workloadId, 'running', `Service running on port ${port} (Container: ${containerId.substring(0, 12)})`)

        // Store running workload info
        this.runningWorkloads.set(workloadId, {
          workloadId,
          containerId,
          port,
          logs: [],
          workDir,
        })

        // Update workload with container ID
        await this.workloadStore!.update(workloadId, {
          containerId,
        })

        await this.addLog(workloadId, 'running', `Service started on port ${port}`)

        // Monitor container in background
        this.monitorContainer(workloadId, containerId, port, workDir)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        throw new Error(`Failed to start Docker container: ${message}`)
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      await this.addLog(workloadId, 'failed', `Failed to start workload: ${errorMessage}`, 'error')
      await this.updateStage(workloadId, 'failed', errorMessage)
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

  private async createDockerfile(servicePath: string, entryFile: string, workloadId: string): Promise<void> {
    const isTypeScript = entryFile.endsWith('.ts')

    // For TypeScript, we need to use tsx to load the module
    // For JavaScript, we can use require directly
    const loadModule = isTypeScript
      ? `const { register } = require('tsx/cjs/api');
register();
const resourceModule = require(path.join(__dirname, '${entryFile}'));`
      : `const resourceModule = require(path.join(__dirname, '${entryFile}'));`

    // Create server.js file separately to avoid shell escaping issues
    const serverJs = `const express = require('express');
const path = require('path');

const app = express();
app.use(express.json());

// Load the dataobject resource
${loadModule}

// Extract the resource definition
const resource = resourceModule.default || resourceModule.projectResource || resourceModule;

if (!resource) {
  console.error('Could not find resource export in service');
  process.exit(1);
}

console.log('Starting server for resource:', resource.name || 'unknown');

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

const port = process.env.PORT || 3000;
app.listen(port, '0.0.0.0', () => {
  console.log(\`Server listening on port \${port}\`);
});
`

    // Write server.js to the service directory
    await writeFile(join(servicePath, 'server.js'), serverJs, 'utf-8')

    // Create Dockerfile that uses node to run server.js (tsx is loaded programmatically)
    const dockerfile = `FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json yarn.lock* package-lock.json* ./

# Install dependencies
RUN if [ -f yarn.lock ]; then yarn install --frozen-lockfile; \\
    elif [ -f package-lock.json ]; then npm ci; \\
    else npm install; fi

# Copy service files
COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
`

    await writeFile(join(servicePath, 'Dockerfile'), dockerfile, 'utf-8')
  }

  private monitorContainer(workloadId: string, containerId: string, port: number, workDir: string): void {
    // Poll container status
    const checkInterval = setInterval(async () => {
      try {
        const inspectResult = await exec(`docker inspect ${containerId}`)
        const containerInfo = JSON.parse(inspectResult.stdout)[0]

        if (!containerInfo.State.Running) {
          clearInterval(checkInterval)
          const exitCode = containerInfo.State.ExitCode

          await this.addLog(
            workloadId,
            'stopped',
            `Container exited with code ${exitCode}`,
            exitCode === 0 ? 'info' : 'error'
          )
          await this.updateStage(
            workloadId,
            exitCode === 0 ? 'stopped' : 'failed',
            exitCode !== 0 ? `Container exited with code ${exitCode}` : undefined
          )
          this.releasePort(port)
          this.runningWorkloads.delete(workloadId)
          await this.cleanupContainer(workloadId, containerId, workDir)
        }
      } catch (error) {
        clearInterval(checkInterval)
        await this.addLog(workloadId, 'failed', `Container monitoring error: ${error}`, 'error')
        this.releasePort(port)
        this.runningWorkloads.delete(workloadId)
        await this.cleanupContainer(workloadId, containerId, workDir)
      }
    }, 5000) // Check every 5 seconds
  }

  private async cleanupContainer(workloadId: string, containerId: string, workDir: string): Promise<void> {
    try {
      // Remove container
      await this.addLog(workloadId, 'stopped', 'Removing container')
      await exec(`docker rm -f ${containerId}`)
      await this.addLog(workloadId, 'stopped', 'Container removed')

      // Remove image
      const imageName = `workload-${workloadId}`
      await exec(`docker rmi -f ${imageName}`).catch(() => {
        // Ignore errors if image doesn't exist
      })
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
    await this.updateStage(workloadId, 'graceful-shutdown')
    await this.addLog(workloadId, 'graceful-shutdown', 'Initiating graceful shutdown')

    // Stop Docker container gracefully
    try {
      await exec(`docker stop ${running.containerId}`)
      await this.addLog(workloadId, 'graceful-shutdown', 'Container stopped gracefully')
    } catch (error) {
      await this.addLog(workloadId, 'graceful-shutdown', 'Failed to stop gracefully, forcing', 'warn')
      await exec(`docker kill ${running.containerId}`)
    }

    // Cleanup
    await this.cleanupContainer(workloadId, running.containerId, running.workDir)
    this.releasePort(running.port)
    this.runningWorkloads.delete(workloadId)

    // Stage: Stopped
    await this.updateStage(workloadId, 'stopped')
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
