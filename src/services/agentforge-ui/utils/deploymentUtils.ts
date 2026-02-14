import type { WorkloadStage, StageResult } from '../types'

interface WorkloadLogEntry {
  timestamp: string
  stage: WorkloadStage
  message: string
  level: 'info' | 'warn' | 'error'
}

export const STAGE_ORDER: WorkloadStage[] = [
  'starting-container',
  'cloning-repo',
  'starting-service',
  'running',
  'graceful-shutdown',
  'stopped'
]

export const STAGE_LABELS: Record<WorkloadStage, string> = {
  'pending': 'Pending',
  'starting-container': 'Starting Container',
  'cloning-repo': 'Cloning Repository',
  'starting-service': 'Starting Service',
  'running': 'Running',
  'graceful-shutdown': 'Graceful Shutdown',
  'stopped': 'Stopped',
  'failed': 'Failed',
}

export function formatStageName(stage: WorkloadStage): string {
  return STAGE_LABELS[stage] || stage
}

export function formatUptime(startTime: string): string {
  const start = new Date(startTime).getTime()
  const now = Date.now()
  const seconds = Math.floor((now - start) / 1000)

  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
  return `${Math.floor(seconds / 86400)}d ${Math.floor((seconds % 86400) / 3600)}h`
}

export function formatDuration(startTime: string, endTime: string): string {
  const start = new Date(startTime).getTime()
  const end = new Date(endTime).getTime()
  const seconds = Math.floor((end - start) / 1000)

  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
}

/**
 * Transform flat log array into grouped StageResult objects
 * This bridges the gap between the database schema (flat logs) and UI expectations (grouped stages)
 */
export function transformLogsToStages(logs: WorkloadLogEntry[]): StageResult[] {
  const stageMap = new Map<WorkloadStage, StageResult>()

  for (const log of logs) {
    if (!stageMap.has(log.stage)) {
      stageMap.set(log.stage, {
        stage: log.stage,
        status: 'pending',
        logs: [],
        startedAt: log.timestamp,
      })
    }

    const stageResult = stageMap.get(log.stage)!
    stageResult.logs.push(log.message)

    // Update status based on log level
    if (log.level === 'error') {
      stageResult.status = 'failed'
      if (!stageResult.error) {
        stageResult.error = log.message
      }
    }

    // Track latest timestamp
    if (!stageResult.completedAt || new Date(log.timestamp) > new Date(stageResult.completedAt)) {
      stageResult.completedAt = log.timestamp
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
