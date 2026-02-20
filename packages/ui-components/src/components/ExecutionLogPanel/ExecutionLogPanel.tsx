import { useEffect, useRef } from 'react'
import styles from './ExecutionLogPanel.module.css'

export interface LogEntry {
  timestamp: string
  level: 'info' | 'warn' | 'error'
  message: string
}

export interface StageOutput {
  stage: string
  status: 'pending' | 'running' | 'success' | 'failed'
  startedAt?: string
  completedAt?: string
  duration?: number
  logs: LogEntry[]
  error?: string
}

export interface ExecutionLogPanelProps {
  stageOutputs: StageOutput[]
  expandedStages: Set<string>
  onToggleStage: (stage: string) => void
  autoScroll?: boolean
}

function StageRow({
  stageOutput,
  isExpanded,
  onToggle,
}: {
  stageOutput: StageOutput
  isExpanded: boolean
  onToggle: () => void
}) {
  const hasLogs = stageOutput.logs.length > 0

  return (
    <div className={styles.stageRow}>
      <button
        className={`${styles.stageHeader} ${styles[stageOutput.status]} ${isExpanded ? styles.expanded : ''} ${hasLogs ? styles.clickable : ''}`}
        onClick={hasLogs ? onToggle : undefined}
        disabled={!hasLogs}
      >
        <div className={styles.stageLabel}>
          <span className={styles.statusIndicator} />
          <span className={styles.stageName}>{stageOutput.stage}</span>
          {stageOutput.duration && (
            <span className={styles.stageDuration}>
              {(stageOutput.duration / 1000).toFixed(1)}s
            </span>
          )}
        </div>
        {hasLogs && (
          <span className={styles.expandIcon}>
            {isExpanded ? '−' : '+'}
          </span>
        )}
      </button>

      {isExpanded && hasLogs && (
        <div className={styles.logsContent}>
          {stageOutput.logs.map((log, idx) => (
            <LogEntryRow key={idx} log={log} />
          ))}
          {stageOutput.error && (
            <div className={styles.errorMessage}>{stageOutput.error}</div>
          )}
        </div>
      )}
    </div>
  )
}

function LogEntryRow({ log }: { log: LogEntry }) {
  const time = new Date(log.timestamp).toLocaleTimeString()
  return (
    <div className={`${styles.logEntry} ${styles[log.level]}`}>
      <span className={styles.logTime}>{time}</span>
      <span className={styles.logLevel}>[{log.level.toUpperCase()}]</span>
      <span className={styles.logMessage}>{log.message}</span>
    </div>
  )
}

export function ExecutionLogPanel({
  stageOutputs,
  expandedStages,
  onToggleStage,
  autoScroll = true,
}: ExecutionLogPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (autoScroll && endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [stageOutputs, expandedStages, autoScroll])

  if (stageOutputs.length === 0) {
    return (
      <div className={styles.panel}>
        <div className={styles.emptyState}>No stages to display</div>
      </div>
    )
  }

  return (
    <div className={styles.panel} ref={containerRef}>
      <div className={styles.stageList}>
        {stageOutputs.map((stageOutput) => (
          <StageRow
            key={stageOutput.stage}
            stageOutput={stageOutput}
            isExpanded={expandedStages.has(stageOutput.stage)}
            onToggle={() => onToggleStage(stageOutput.stage)}
          />
        ))}
        <div ref={endRef} />
      </div>
    </div>
  )
}
