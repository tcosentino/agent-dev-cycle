import { useMemo } from 'react'
import { ServerIcon } from '@agentforge/ui-components'
import type { Workload } from '../types'
import { WorkloadStages } from './WorkloadStages'
import styles from '../ProjectViewer.module.css'

export interface WorkloadCardProps {
  workload: Workload
  onClick: () => void
}

export function WorkloadCard({ workload, onClick }: WorkloadCardProps) {
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
