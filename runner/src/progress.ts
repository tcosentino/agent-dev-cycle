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

export interface ProgressUpdate {
  stage?: ProgressStage
  progress?: number
  currentStep?: string
  summary?: string
  commitSha?: string
  error?: string
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

export async function reportComplete(summary: string, commitSha?: string): Promise<void> {
  await reportProgress({
    stage: 'completed',
    progress: 100,
    currentStep: 'Done',
    summary,
    commitSha,
  })
}

export async function reportFailure(error: string): Promise<void> {
  await reportProgress({
    stage: 'failed',
    error,
  })
  await reportLog({ level: 'error', message: error })
}
