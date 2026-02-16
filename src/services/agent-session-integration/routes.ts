import type { OpenAPIHono } from '@hono/zod-openapi'
import type { ResourceStore } from '@agentforge/dataobject'
import { streamSSE } from 'hono/streaming'
import { spawn } from 'node:child_process'
import { writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { getClaudeCredentialsForSession } from '../claude-auth-integration'

interface LogEntry {
  timestamp: Date
  level: string
  message: string
}

interface StageOutput {
  logs: LogEntry[]
  startedAt?: Date
  completedAt?: Date
  duration?: number
}

interface AgentSession {
  id: string
  projectId: string
  sessionId: string
  agent: string
  phase: string
  taskPrompt: string
  stage: 'pending' | 'cloning' | 'loading' | 'executing' | 'capturing' | 'committing' | 'completed' | 'failed' | 'cancelling' | 'cancelled' | 'paused' | 'resuming'
  progress: number
  currentStep?: string
  logs: LogEntry[]
  stageOutputs: {
    cloning?: StageOutput
    loading?: StageOutput
    executing?: StageOutput
    capturing?: StageOutput
    committing?: StageOutput
  }
  summary?: string
  commitSha?: string
  error?: string
  retriedFromId?: string
  retryCount: number
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

// Track active SSE streams for cleanup
const activeStreams = new Set<AbortController>()

// Cleanup function for graceful shutdown
function cleanup() {
  console.log('Cleaning up agent session resources...')

  // Kill all running processes
  for (const [id, running] of runningContainers.entries()) {
    if (running.process) {
      console.log(`Killing runner process for session ${id}`)
      running.process.kill('SIGTERM')
    }
    if (running.containerId) {
      spawn('docker', ['stop', running.containerId], { stdio: 'ignore' })
    }
  }
  runningContainers.clear()

  // Abort all active SSE streams
  for (const controller of activeStreams) {
    controller.abort()
  }
  activeStreams.clear()
}

// Register cleanup on process signals
process.on('SIGTERM', cleanup)
process.on('SIGINT', cleanup)
process.on('beforeExit', cleanup)

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
      stageOutputs: {},
    })

    return c.json(session, 201)
  })

  // Start executing an agent session
  app.post('/api/agentSessions/:id/start', async (c) => {
    const { id } = c.req.param()

    console.log('[agent-session] Starting session:', id)

    const session = await agentSessionStore.findById(id) as AgentSession | null
    if (!session) {
      console.error('[agent-session] Session not found:', id)
      return c.json({ error: 'Agent session not found' }, 404)
    }

    if (session.stage !== 'pending') {
      console.error('[agent-session] Session already started:', id, 'current stage:', session.stage)
      return c.json({ error: 'Session already started', currentStage: session.stage }, 400)
    }

    // Get project for repo URL and userId
    let project: Project | null = null
    if (projectStore) {
      project = await projectStore.findById(session.projectId) as Project | null
    }

    if (!project?.repoUrl) {
      console.error('[agent-session] Project has no repo URL:', session.projectId)
      return c.json({ error: 'Project has no repository URL configured' }, 400)
    }

    // Get user store for Claude auth
    const userStore = ctx.stores.get('user')
    if (!userStore) {
      console.error('[agent-session] User store not available')
      return c.json({ error: 'User store not available' }, 500)
    }

    // Get userId from project
    const projectWithUser = project as Project & { userId?: string }
    if (!projectWithUser.userId) {
      console.error('[agent-session] Project has no user associated:', session.projectId)
      return c.json({ error: 'Project has no user associated' }, 400)
    }

    console.log('[agent-session] Getting Claude credentials for user:', projectWithUser.userId)

    // Get Claude credentials (refreshes OAuth token if needed)
    const credentialsResult = await getClaudeCredentialsForSession(userStore, projectWithUser.userId)
    if (!credentialsResult.success) {
      console.error('[agent-session] Failed to get Claude credentials:', credentialsResult.error)
      return c.json({
        error: 'CLAUDE_AUTH_ERROR',
        message: credentialsResult.error,
        action: { type: 'link', href: '/settings', label: 'Go to Settings' }
      }, 400)
    }

    console.log('[agent-session] Successfully obtained Claude credentials')

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
    // Navigate from packages/server to project root for .data directory
    const projectRoot = join(process.cwd(), '..', '..')
    const runnerConfigDir = join(projectRoot, '.data', 'runner-configs')
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
    const runnerPath = join(projectRoot, 'runner')

    try {
      let proc: ReturnType<typeof spawn>

      if (useDocker) {
        // Docker execution - pass Claude credentials as env vars
        const claudeEnvArgs = Object.entries(credentialsResult.envVars || {}).flatMap(
          ([key, value]) => ['-e', `${key}=${value}`]
        )

        const dockerArgs = [
          'run',
          '--rm',
          '-v', `${configPath}:/config/session.json:ro`,
          ...claudeEnvArgs,
          '-e', `SESSION_CONFIG_PATH=/config/session.json`,
          '-e', `AGENTFORGE_SERVER_URL=${sessionConfig.serverUrl}`,
          '-e', `AGENTFORGE_SESSION_ID=${id}`,
          'agentforge-runner:latest',
        ]

        proc = spawn('docker', dockerArgs, {
          stdio: ['ignore', 'pipe', 'pipe'],
        })
      } else {
        // Local execution (for development)
        // Use the tsx binary directly from runner's node_modules
        const tsxBinPath = join(runnerPath, 'node_modules', '.bin', 'tsx')

        if (existsSync(tsxBinPath)) {
          // Create a local workspace directory for this session
          const localWorkspace = join(projectRoot, '.data', 'workspaces', id)
          if (!existsSync(localWorkspace)) {
            mkdirSync(localWorkspace, { recursive: true })
          }

          // Execute tsx binary directly with Claude credentials
          proc = spawn(tsxBinPath, ['src/index.ts'], {
            cwd: runnerPath,
            env: {
              ...process.env,
              ...credentialsResult.envVars,
              SESSION_CONFIG_PATH: configPath,
              AGENTFORGE_SERVER_URL: sessionConfig.serverUrl,
              AGENTFORGE_SESSION_ID: id,
              AGENTFORGE_PROJECT_ID: session.projectId,
              AGENTFORGE_RUN_ID: session.sessionId,
              WORKSPACE_PATH: localWorkspace,
            },
            stdio: ['ignore', 'pipe', 'pipe'],
          })
        } else {
          throw new Error(`tsx not found at ${tsxBinPath}. Run 'yarn install' in the runner directory.`)
        }
      }

      // Handle spawn errors to prevent server crash
      proc.on('error', async (err) => {
        console.error(`Failed to spawn runner process: ${err.message}`)
        runningContainers.delete(id)
        await agentSessionStore.update(id, {
          stage: 'failed',
          completedAt: new Date(),
          error: `Failed to start runner: ${err.message}`,
          logs: [
            ...session.logs,
            { timestamp: new Date(), level: 'error', message: `Spawn error: ${err.message}` },
          ],
        })
      })

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

      console.log('[agent-session] Session started successfully:', id)
      return c.json({ ok: true, message: 'Session started' })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      console.error('[agent-session] Failed to start session:', id, errorMessage, err)
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
      // Create abort controller for this stream
      const abortController = new AbortController()
      activeStreams.add(abortController)

      let lastLogIndex = 0
      let lastStage = ''
      let lastProgress = -1
      const lastStageLogCounts: Record<string, number> = {}

      try {
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
            stageOutputs: session.stageOutputs,
          }),
        })

        // Poll for updates
        while (!abortController.signal.aborted) {
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

          // Send stage-specific updates
          for (const stageKey of ['cloning', 'loading', 'executing', 'capturing', 'committing'] as const) {
            const stageOutput = current.stageOutputs?.[stageKey]
            if (stageOutput) {
              const lastCount = lastStageLogCounts[stageKey] || 0
              if (stageOutput.logs.length > lastCount) {
                const newLogs = stageOutput.logs.slice(lastCount)
                for (const log of newLogs) {
                  await stream.writeSSE({
                    event: 'stage-log',
                    data: JSON.stringify({ stage: stageKey, log }),
                  })
                }
                lastStageLogCounts[stageKey] = stageOutput.logs.length
              }

              // Send stage completion event
              if (stageOutput.completedAt && !lastStageLogCounts[`${stageKey}-completed`]) {
                await stream.writeSSE({
                  event: 'stage-complete',
                  data: JSON.stringify({
                    stage: stageKey,
                    duration: stageOutput.duration,
                    completedAt: stageOutput.completedAt,
                  }),
                })
                lastStageLogCounts[`${stageKey}-completed`] = 1
              }
            }
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
      } finally {
        // Clean up this stream
        activeStreams.delete(abortController)
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

    if (session.stage === 'completed' || session.stage === 'failed' || session.stage === 'cancelled') {
      return c.json({ error: 'Session already finished' }, 400)
    }

    if (session.stage === 'cancelling') {
      return c.json({ error: 'Session is already being cancelled' }, 400)
    }

    // Update to cancelling state
    await agentSessionStore.update(id, {
      stage: 'cancelling',
      logs: [
        ...session.logs,
        { timestamp: new Date(), level: 'warn', message: 'Cancelling session...' },
      ],
    })

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

    // Update to cancelled state
    const updatedSession = await agentSessionStore.update(id, {
      stage: 'cancelled',
      completedAt: new Date(),
      error: 'Cancelled by user',
      logs: [
        ...(await agentSessionStore.findById(id) as AgentSession).logs,
        { timestamp: new Date(), level: 'warn', message: 'Session cancelled by user' },
      ],
    })

    return c.json(updatedSession, 200)
  })

  // Retry a failed session by creating a new session
  app.post('/api/agentSessions/:id/retry', async (c) => {
    const { id } = c.req.param()

    const session = await agentSessionStore.findById(id) as AgentSession | null
    if (!session) {
      return c.json({ error: 'Agent session not found' }, 404)
    }

    if (session.stage !== 'failed' && session.stage !== 'cancelled') {
      return c.json({ error: 'Can only retry failed or cancelled sessions' }, 400)
    }

    // Calculate retry count by following retriedFrom chain
    let retryCount = 0
    let currentSession = session
    const visited = new Set<string>([session.id])

    // Follow the chain backwards to count retries and detect cycles
    while (currentSession.retriedFromId) {
      if (visited.has(currentSession.retriedFromId)) {
        // Circular reference detected
        return c.json({ error: 'Circular retry reference detected' }, 400)
      }
      visited.add(currentSession.retriedFromId)
      retryCount++

      const parentSession = await agentSessionStore.findById(currentSession.retriedFromId) as AgentSession | null
      if (!parentSession) break
      currentSession = parentSession
    }

    // Enforce max 3 retries (4 total attempts)
    if (retryCount >= 3) {
      return c.json({ error: 'Maximum retry limit reached (3 retries)' }, 400)
    }

    // Generate a new sessionId for the retry
    const newSessionId = await generateSessionId(agentSessionStore, session.projectId, session.agent)

    // Create a new session with the same parameters, linked to the failed one
    const newSession = await agentSessionStore.create({
      projectId: session.projectId,
      sessionId: newSessionId,
      agent: session.agent,
      phase: session.phase,
      taskPrompt: session.taskPrompt,
      stage: 'pending',
      progress: 0,
      logs: [
        { timestamp: new Date(), level: 'info', message: `Retry ${retryCount + 1} of session ${session.sessionId}` },
      ],
      stageOutputs: {},
      retriedFromId: session.id,
      retryCount: retryCount + 1,
    })

    return c.json(newSession, 201)
  })

  // Append log entry (called by runner)
  app.post('/api/agentSessions/:id/logs', async (c) => {
    const { id } = c.req.param()
    const body = await c.req.json()
    const { level = 'info', message, stage } = body

    if (!message) {
      return c.json({ error: 'Missing message' }, 400)
    }

    const session = await agentSessionStore.findById(id) as AgentSession | null
    if (!session) {
      return c.json({ error: 'Agent session not found' }, 404)
    }

    const logEntry = { timestamp: new Date(), level, message }
    const updates: Partial<AgentSession> = {
      logs: [...session.logs, logEntry],
    }

    // If stage is specified, also add to stage-specific logs
    if (stage && ['cloning', 'loading', 'executing', 'capturing', 'committing'].includes(stage)) {
      const stageKey = stage as keyof AgentSession['stageOutputs']
      const currentStageOutput = session.stageOutputs?.[stageKey] || { logs: [] }

      updates.stageOutputs = {
        ...(session.stageOutputs || {}),
        [stageKey]: {
          ...currentStageOutput,
          logs: [...currentStageOutput.logs, logEntry],
          startedAt: currentStageOutput.startedAt || new Date(),
        },
      }
    }

    await agentSessionStore.update(id, updates)

    return c.json({ ok: true })
  })

  // Mark stage as complete with timing (called by runner)
  app.post('/api/agentSessions/:id/stages/:stage/complete', async (c) => {
    const { id, stage } = c.req.param()
    const body = await c.req.json()
    const { duration } = body

    const session = await agentSessionStore.findById(id) as AgentSession | null
    if (!session) {
      return c.json({ error: 'Agent session not found' }, 404)
    }

    if (!['cloning', 'loading', 'executing', 'capturing', 'committing'].includes(stage)) {
      return c.json({ error: 'Invalid stage' }, 400)
    }

    const stageKey = stage as keyof AgentSession['stageOutputs']
    const currentStageOutput = session.stageOutputs?.[stageKey] || { logs: [] }

    await agentSessionStore.update(id, {
      stageOutputs: {
        ...(session.stageOutputs || {}),
        [stageKey]: {
          ...currentStageOutput,
          completedAt: new Date(),
          duration,
        },
      },
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
