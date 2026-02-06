import type { OpenAPIHono } from '@hono/zod-openapi'
import type { ResourceStore } from '@agentforge/dataobject'
import { streamSSE } from 'hono/streaming'
import { spawn } from 'node:child_process'
import { writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'

interface AgentSession {
  id: string
  projectId: string
  sessionId: string
  agent: string
  phase: string
  taskPrompt: string
  stage: string
  progress: number
  currentStep?: string
  logs: Array<{ timestamp: Date; level: string; message: string }>
  summary?: string
  commitSha?: string
  error?: string
  startedAt?: Date
  completedAt?: Date
  createdAt: Date
  updatedAt: Date
}

interface Project {
  id: string
  name: string
  key: string
  repoUrl?: string
}

// Track running containers for cancellation
const runningContainers = new Map<string, { containerId?: string; process?: ReturnType<typeof spawn> }>()

// Generate sessionId like 'pm-001', 'eng-002'
async function generateSessionId(
  agentSessionStore: ResourceStore<Record<string, unknown>>,
  projectId: string,
  agent: string
): Promise<string> {
  // Get prefix from agent
  const prefixMap: Record<string, string> = {
    pm: 'pm',
    engineer: 'eng',
    qa: 'qa',
    lead: 'lead',
  }
  const prefix = prefixMap[agent] || agent

  // Count existing sessions for this project and agent
  const existingSessions = await agentSessionStore.findAll({
    where: { projectId },
  }) as unknown as AgentSession[]

  const agentSessions = existingSessions.filter(s => s.agent === agent)
  const nextNum = agentSessions.length + 1
  const paddedNum = String(nextNum).padStart(3, '0')

  return `${prefix}-${paddedNum}`
}

export function registerAgentSessionRoutes(
  app: OpenAPIHono,
  ctx: { stores: Map<string, ResourceStore<Record<string, unknown>>> }
) {
  const agentSessionStore = ctx.stores.get('agentSession')
  const projectStore = ctx.stores.get('project')

  if (!agentSessionStore) {
    console.warn('Warning: agentSession store not found, agent session routes will not work')
    return
  }

  // Override POST to auto-generate sessionId
  app.post('/api/agentSessions', async (c) => {
    const body = await c.req.json()
    const { projectId, agent, phase, taskPrompt } = body

    if (!projectId || !agent || !phase || !taskPrompt) {
      return c.json({ error: 'Missing required fields: projectId, agent, phase, taskPrompt' }, 400)
    }

    // Generate sessionId
    const sessionId = await generateSessionId(agentSessionStore, projectId, agent)

    // Create the session
    const session = await agentSessionStore.create({
      projectId,
      sessionId,
      agent,
      phase,
      taskPrompt,
      stage: 'pending',
      progress: 0,
      logs: [],
    })

    return c.json(session, 201)
  })

  // Start executing an agent session
  app.post('/api/agentSessions/:id/start', async (c) => {
    const { id } = c.req.param()

    const session = await agentSessionStore.findById(id) as AgentSession | null
    if (!session) {
      return c.json({ error: 'Agent session not found' }, 404)
    }

    if (session.stage !== 'pending') {
      return c.json({ error: 'Session already started' }, 400)
    }

    // Get project for repo URL
    let project: Project | null = null
    if (projectStore) {
      project = await projectStore.findById(session.projectId) as Project | null
    }

    if (!project?.repoUrl) {
      return c.json({ error: 'Project has no repository URL configured' }, 400)
    }

    // Update session to cloning stage
    await agentSessionStore.update(id, {
      stage: 'cloning',
      startedAt: new Date(),
      logs: [
        ...session.logs,
        { timestamp: new Date(), level: 'info', message: 'Starting agent session...' },
      ],
    })

    // Create session config for runner
    const runnerConfigDir = join(process.cwd(), '.data', 'runner-configs')
    if (!existsSync(runnerConfigDir)) {
      mkdirSync(runnerConfigDir, { recursive: true })
    }

    const configPath = join(runnerConfigDir, `session-${id}.json`)
    const sessionConfig = {
      runId: session.sessionId,
      projectId: session.projectId,
      agent: session.agent,
      phase: session.phase,
      repoUrl: project.repoUrl,
      branch: 'main',
      taskPrompt: session.taskPrompt,
      serverUrl: process.env.AGENTFORGE_SERVER_URL || `http://localhost:${process.env.PORT || 3000}`,
    }

    writeFileSync(configPath, JSON.stringify(sessionConfig, null, 2))

    // Spawn Docker container or local runner
    const useDocker = process.env.RUNNER_MODE !== 'local'
    const runnerPath = join(process.cwd(), 'runner')

    try {
      let proc: ReturnType<typeof spawn>

      if (useDocker) {
        // Docker execution
        const dockerArgs = [
          'run',
          '--rm',
          '-v', `${configPath}:/config/session.json:ro`,
          '-v', `${process.env.HOME}/.claude:/home/agent/.claude:ro`,
          '-e', `SESSION_CONFIG_PATH=/config/session.json`,
          '-e', `AGENTFORGE_SERVER_URL=${sessionConfig.serverUrl}`,
          '-e', `AGENTFORGE_SESSION_ID=${id}`,
          'agentforge-runner:latest',
        ]

        proc = spawn('docker', dockerArgs, {
          stdio: ['ignore', 'pipe', 'pipe'],
          detached: true,
        })
      } else {
        // Local execution (for development)
        proc = spawn('npx', ['tsx', 'src/index.ts'], {
          cwd: runnerPath,
          env: {
            ...process.env,
            SESSION_CONFIG_PATH: configPath,
            AGENTFORGE_SERVER_URL: sessionConfig.serverUrl,
            AGENTFORGE_SESSION_ID: id,
          },
          stdio: ['ignore', 'pipe', 'pipe'],
          detached: true,
          shell: true,
        })
      }

      // Track the process
      runningContainers.set(id, { process: proc })

      // Handle stdout
      proc.stdout?.on('data', async (data: Buffer) => {
        const message = data.toString().trim()
        if (message) {
          const current = await agentSessionStore.findById(id) as AgentSession | null
          if (current) {
            await agentSessionStore.update(id, {
              logs: [
                ...current.logs,
                { timestamp: new Date(), level: 'info', message },
              ],
            })
          }
        }
      })

      // Handle stderr
      proc.stderr?.on('data', async (data: Buffer) => {
        const message = data.toString().trim()
        if (message) {
          const current = await agentSessionStore.findById(id) as AgentSession | null
          if (current) {
            await agentSessionStore.update(id, {
              logs: [
                ...current.logs,
                { timestamp: new Date(), level: 'warn', message },
              ],
            })
          }
        }
      })

      // Handle process exit
      proc.on('close', async (code) => {
        runningContainers.delete(id)

        const current = await agentSessionStore.findById(id) as AgentSession | null
        if (current && current.stage !== 'completed' && current.stage !== 'failed') {
          if (code === 0) {
            await agentSessionStore.update(id, {
              stage: 'completed',
              progress: 100,
              completedAt: new Date(),
              logs: [
                ...current.logs,
                { timestamp: new Date(), level: 'info', message: 'Session completed successfully' },
              ],
            })
          } else {
            await agentSessionStore.update(id, {
              stage: 'failed',
              completedAt: new Date(),
              error: `Process exited with code ${code}`,
              logs: [
                ...current.logs,
                { timestamp: new Date(), level: 'error', message: `Process exited with code ${code}` },
              ],
            })
          }
        }
      })

      return c.json({ ok: true, message: 'Session started' })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      await agentSessionStore.update(id, {
        stage: 'failed',
        completedAt: new Date(),
        error: errorMessage,
        logs: [
          ...session.logs,
          { timestamp: new Date(), level: 'error', message: `Failed to start: ${errorMessage}` },
        ],
      })
      return c.json({ error: 'Failed to start session', details: errorMessage }, 500)
    }
  })

  // SSE stream for real-time progress
  app.get('/api/agentSessions/:id/stream', async (c) => {
    const { id } = c.req.param()

    const session = await agentSessionStore.findById(id) as AgentSession | null
    if (!session) {
      return c.json({ error: 'Agent session not found' }, 404)
    }

    return streamSSE(c, async (stream) => {
      let lastLogIndex = 0
      let lastStage = ''
      let lastProgress = -1

      // Send initial state
      await stream.writeSSE({
        event: 'init',
        data: JSON.stringify({
          id: session.id,
          sessionId: session.sessionId,
          agent: session.agent,
          phase: session.phase,
          stage: session.stage,
          progress: session.progress,
          currentStep: session.currentStep,
          logsCount: session.logs.length,
        }),
      })

      // Poll for updates
      while (true) {
        const current = await agentSessionStore.findById(id) as AgentSession | null
        if (!current) break

        // Send new log entries
        if (current.logs.length > lastLogIndex) {
          const newLogs = current.logs.slice(lastLogIndex)
          for (const log of newLogs) {
            await stream.writeSSE({
              event: 'log',
              data: JSON.stringify(log),
            })
          }
          lastLogIndex = current.logs.length
        }

        // Send stage/progress updates
        if (current.stage !== lastStage || current.progress !== lastProgress) {
          await stream.writeSSE({
            event: 'progress',
            data: JSON.stringify({
              stage: current.stage,
              progress: current.progress,
              currentStep: current.currentStep,
            }),
          })
          lastStage = current.stage
          lastProgress = current.progress
        }

        // Send result if completed/failed
        if (current.stage === 'completed' || current.stage === 'failed') {
          await stream.writeSSE({
            event: 'result',
            data: JSON.stringify({
              stage: current.stage,
              summary: current.summary,
              commitSha: current.commitSha,
              error: current.error,
              completedAt: current.completedAt,
            }),
          })
          break
        }

        // Wait before next poll
        await stream.sleep(500)
      }
    })
  })

  // Cancel a running session
  app.post('/api/agentSessions/:id/cancel', async (c) => {
    const { id } = c.req.param()

    const session = await agentSessionStore.findById(id) as AgentSession | null
    if (!session) {
      return c.json({ error: 'Agent session not found' }, 404)
    }

    if (session.stage === 'completed' || session.stage === 'failed') {
      return c.json({ error: 'Session already finished' }, 400)
    }

    const running = runningContainers.get(id)
    if (running) {
      // Kill the process
      if (running.process) {
        running.process.kill('SIGTERM')
      }
      // If using Docker, stop the container
      if (running.containerId) {
        spawn('docker', ['stop', running.containerId], { stdio: 'ignore' })
      }
      runningContainers.delete(id)
    }

    await agentSessionStore.update(id, {
      stage: 'failed',
      completedAt: new Date(),
      error: 'Cancelled by user',
      logs: [
        ...session.logs,
        { timestamp: new Date(), level: 'warn', message: 'Session cancelled by user' },
      ],
    })

    return c.json({ ok: true, message: 'Session cancelled' })
  })

  // Retry a failed session
  app.post('/api/agentSessions/:id/retry', async (c) => {
    const { id } = c.req.param()

    const session = await agentSessionStore.findById(id) as AgentSession | null
    if (!session) {
      return c.json({ error: 'Agent session not found' }, 404)
    }

    if (session.stage !== 'failed') {
      return c.json({ error: 'Can only retry failed sessions' }, 400)
    }

    // Reset session state for retry
    await agentSessionStore.update(id, {
      stage: 'pending',
      progress: 0,
      currentStep: undefined,
      error: undefined,
      startedAt: undefined,
      completedAt: undefined,
      logs: [
        ...session.logs,
        { timestamp: new Date(), level: 'info', message: 'Session retry requested' },
      ],
    })

    return c.json({ ok: true, message: 'Session reset for retry' })
  })

  // Append log entry (called by runner)
  app.post('/api/agentSessions/:id/logs', async (c) => {
    const { id } = c.req.param()
    const body = await c.req.json()
    const { level = 'info', message } = body

    if (!message) {
      return c.json({ error: 'Missing message' }, 400)
    }

    const session = await agentSessionStore.findById(id) as AgentSession | null
    if (!session) {
      return c.json({ error: 'Agent session not found' }, 404)
    }

    await agentSessionStore.update(id, {
      logs: [
        ...session.logs,
        { timestamp: new Date(), level, message },
      ],
    })

    return c.json({ ok: true })
  })

  // Update progress (called by runner)
  app.patch('/api/agentSessions/:id/progress', async (c) => {
    const { id } = c.req.param()
    const body = await c.req.json()
    const { stage, progress, currentStep, summary, commitSha, error } = body

    const session = await agentSessionStore.findById(id) as AgentSession | null
    if (!session) {
      return c.json({ error: 'Agent session not found' }, 404)
    }

    const updates: Partial<AgentSession> = {}

    if (stage !== undefined) updates.stage = stage
    if (progress !== undefined) updates.progress = progress
    if (currentStep !== undefined) updates.currentStep = currentStep
    if (summary !== undefined) updates.summary = summary
    if (commitSha !== undefined) updates.commitSha = commitSha
    if (error !== undefined) updates.error = error

    if (stage === 'completed' || stage === 'failed') {
      updates.completedAt = new Date()
    }

    await agentSessionStore.update(id, updates)

    return c.json({ ok: true })
  })
}
