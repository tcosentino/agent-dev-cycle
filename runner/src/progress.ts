import { apiRequest } from './cli/api.js'

export type ProgressStage =
  | 'pending'
  | 'cloning'
  | 'loading'
  | 'executing'
  | 'capturing'
  | 'committing'
  | 'completed'
  | 'failed'

export interface TokenUsage {
  inputTokens: number
  outputTokens: number
  cacheReadTokens: number
  cacheWriteTokens: number
  totalTokens: number
  totalCostUsd?: number
}

export interface ProgressUpdate {
  stage?: ProgressStage
  progress?: number
  currentStep?: string
  summary?: string
  commitSha?: string
  error?: string
  tokenUsage?: TokenUsage
}

export interface LogEntry {
  level: 'info' | 'warn' | 'error'
  message: string
}

// Get session ID from environment
function getSessionId(): string | undefined {
  return process.env.AGENTFORGE_SESSION_ID
}

// Report progress to the server
export async function reportProgress(update: ProgressUpdate): Promise<void> {
  const sessionId = getSessionId()
  if (!sessionId) {
    // Session ID not set, silently skip (running without UI integration)
    return
  }

  try {
    await apiRequest('PATCH', `/api/agentSessions/${sessionId}/progress`, update)
  } catch (err) {
    // Non-fatal - log and continue
    console.warn('Failed to report progress:', err instanceof Error ? err.message : err)
  }
}

// Append a log entry to the session
export async function reportLog(entry: LogEntry, stage?: ProgressStage): Promise<void> {
  const sessionId = getSessionId()
  if (!sessionId) {
    return
  }

  try {
    await apiRequest('POST', `/api/agentSessions/${sessionId}/logs`, { ...entry, stage })
  } catch (err) {
    console.warn('Failed to report log:', err instanceof Error ? err.message : err)
  }
}

// Track current stage start time
let currentStageStartTime: number | undefined

// Convenience functions for common progress updates
export async function reportStageStart(stage: ProgressStage, progress: number, step: string): Promise<void> {
  currentStageStartTime = Date.now()
  await reportProgress({ stage, progress, currentStep: step })
  await reportLog({ level: 'info', message: step }, stage)
}

export async function reportStageComplete(stage: ProgressStage): Promise<void> {
  const sessionId = getSessionId()
  if (!sessionId || !currentStageStartTime) {
    return
  }

  const duration = Date.now() - currentStageStartTime
  currentStageStartTime = undefined

  try {
    await apiRequest('POST', `/api/agentSessions/${sessionId}/stages/${stage}/complete`, { duration })
  } catch (err) {
    console.warn('Failed to report stage completion:', err instanceof Error ? err.message : err)
  }
}

export async function reportComplete(summary: string, commitSha?: string, tokenUsage?: TokenUsage): Promise<void> {
  await reportProgress({
    stage: 'completed',
    progress: 100,
    currentStep: 'Done',
    summary,
    commitSha,
    tokenUsage,
  })
}

export async function reportFailure(error: string): Promise<void> {
  await reportProgress({
    stage: 'failed',
    error,
  })
  await reportLog({ level: 'error', message: error })
}

// Report git command output with appropriate formatting
export async function reportGitOutput(
  stdout: string,
  stderr: string,
  stage: ProgressStage
): Promise<void> {
  // Log stdout if present
  if (stdout.trim()) {
    await reportLog({ level: 'info', message: stdout.trim() }, stage)
  }

  // Log stderr as warning if present
  if (stderr.trim()) {
    await reportLog({ level: 'warn', message: stderr.trim() }, stage)
  }
}

// Stream Claude output line-by-line
export async function reportClaudeOutput(line: string): Promise<void> {
  await reportLog({ level: 'info', message: line }, 'executing')
}

// Report context files metadata
export async function reportContextFiles(files: string[]): Promise<void> {
  const message = `Context files (${files.length}):\n${files.map(f => `  - ${f}`).join('\n')}`
  await reportLog({ level: 'info', message }, 'loading')
}

// Report a container resource metric snapshot
export async function reportResourceMetric(cpuPercent: number, memoryMb: number, memoryPercent: number): Promise<void> {
  const sessionId = getSessionId()
  if (!sessionId) {
    return
  }

  try {
    await apiRequest('POST', `/api/agentSessions/${sessionId}/resourceMetrics`, {
      cpuPercent,
      memoryMb,
      memoryPercent,
    })
  } catch (err) {
    console.warn('Failed to report resource metric:', err instanceof Error ? err.message : err)
  }
}
