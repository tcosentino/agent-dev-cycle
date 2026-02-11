import { useMemo } from 'react'
import { ServerIcon, FileDocumentIcon } from '@agentforge/ui-components'
import type { Workload } from '../types'
import { WorkloadStages } from './WorkloadStages'
import styles from '../ProjectViewer.module.css'

interface WorkloadLogEntry {
  timestamp: string
  stage: string
  message: string
  level: 'info' | 'warn' | 'error'
}

export interface WorkloadCardProps {
  workload: Workload
  onClick: () => void
  onViewLogs: (workload: Workload) => void
}

export function WorkloadCard({ workload, onClick, onViewLogs }: WorkloadCardProps) {
  const statusColors: Record<Workload['status'], string> = {
    pending: 'var(--text-tertiary)',
    running: 'var(--accent-primary)',
    success: 'var(--success)',
    failed: 'var(--error)',
    rolledback: 'var(--warning)',
    stopped: 'var(--text-tertiary)',
  }

  const duration = useMemo(() => {
    if (!workload.completedAt) return null
    const start = new Date(workload.createdAt).getTime()
    const end = new Date(workload.completedAt).getTime()
    const seconds = Math.round((end - start) / 1000)
    if (seconds < 60) return `${seconds}s`
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
  }, [workload])

  const hasLogs = useMemo(() => {
    // Check if workload has stages with logs
    if (workload.stages && workload.stages.length > 0) {
      return workload.stages.some(stage => stage.logs && stage.logs.length > 0)
    }
    // Check if workload has raw logs array
    const rawLogs = (workload as any).logs as WorkloadLogEntry[] | undefined
    return rawLogs && rawLogs.length > 0
  }, [workload])

  const workloadName = workload.moduleName || (workload as any).servicePath || 'Unnamed workload'

  return (
    <button className={styles.workloadCard} onClick={onClick}>
      <div className={styles.workloadHeader}>
        <ServerIcon className={styles.workloadIcon} />
        <span className={styles.workloadName}>{workloadName}</span>
        <span
          className={styles.workloadStatus}
          style={{ color: statusColors[workload.status] }}
        >
          {workload.status}
        </span>
        {hasLogs && (
          <div
            className={styles.viewLogsButton}
            onClick={(e) => {
              e.stopPropagation()
              onViewLogs(workload)
            }}
            title="View Logs"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                e.stopPropagation()
                onViewLogs(workload)
              }
            }}
          >
            <FileDocumentIcon />
            <span>Logs</span>
          </div>
        )}
      </div>
      <WorkloadStages workload={workload} />
      <div className={styles.workloadMeta}>
        <span className={styles.workloadType}>{workload.moduleType}</span>
        {workload.artifacts?.url && (
          <a
            href={workload.artifacts.url}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.workloadUrl}
            onClick={(e) => e.stopPropagation()}
          >
            {workload.artifacts.url}
          </a>
        )}
        {duration && <span className={styles.workloadDuration}>{duration}</span>}
      </div>
    </button>
  )
}
