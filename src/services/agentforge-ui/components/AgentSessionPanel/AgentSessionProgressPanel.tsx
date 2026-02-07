import { useEffect, useRef, useState } from 'react'
import { useAgentSessionProgress, useAgentSession } from '../../hooks'
import { api, type ApiAgentSessionLogEntry } from '../../api'
import { Badge, Spinner, GitBranchIcon, ClipboardIcon } from '@agentforge/ui-components'
import styles from './AgentSessionPanel.module.css'

export interface AgentSessionProgressPanelProps {
  sessionId: string
  onClose?: () => void
  onRetry?: (newSessionId: string) => void
}

const stages = [
  { key: 'cloning', label: 'Clone' },
  { key: 'loading', label: 'Load' },
  { key: 'executing', label: 'Execute' },
  { key: 'capturing', label: 'Capture' },
  { key: 'committing', label: 'Commit' },
] as const

const stageIndex: Record<string, number> = {
  pending: -1,
  cloning: 0,
  loading: 1,
  executing: 2,
  capturing: 3,
  committing: 4,
  completed: 5,
  failed: -2,
}

function VerticalStageList({
  currentStage,
  selectedStage,
  onStageClick,
  stageOutputs,
}: {
  currentStage: string
  selectedStage: string | null
  onStageClick: (stageKey: string) => void
  stageOutputs: Record<string, { logs: any[]; duration?: number; completedAt?: Date }>
}) {
  const current = stageIndex[currentStage] ?? -1
  const isComplete = currentStage === 'completed'
  const isFailed = currentStage === 'failed'

  return (
    <div className={styles.verticalStageList}>
      {stages.map((stage, idx) => {
        let status: 'pending' | 'active' | 'complete' | 'failed' = 'pending'
        if (isFailed && idx === current) {
          status = 'failed'
        } else if (isComplete || idx < current) {
          status = 'complete'
        } else if (idx === current) {
          status = 'active'
        }

        const hasLogs = stageOutputs[stage.key]?.logs?.length > 0
        const isSelected = selectedStage === stage.key
        const duration = stageOutputs[stage.key]?.duration

        return (
          <button
            key={stage.key}
            className={`${styles.verticalStageItem} ${styles[status]} ${isSelected ? styles.selected : ''} ${hasLogs ? styles.clickable : ''}`}
            onClick={() => hasLogs && onStageClick(stage.key)}
            disabled={!hasLogs}
          >
            <span className={styles.verticalStageLabel}>{stage.label}</span>
            {duration && (
              <span className={styles.stageDuration}>{(duration / 1000).toFixed(1)}s</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

function LogEntry({ log }: { log: ApiAgentSessionLogEntry }) {
  const time = new Date(log.timestamp).toLocaleTimeString()
  return (
    <div className={`${styles.logEntry} ${styles[log.level]}`}>
      <span className={styles.logTime}>{time}</span>
      <span className={styles.logLevel}>[{log.level.toUpperCase()}]</span>
      <span className={styles.logMessage}>{log.message}</span>
    </div>
  )
}


export function AgentSessionProgressPanel({
  sessionId,
  onRetry,
}: AgentSessionProgressPanelProps) {
  const { progress, isLoading, error } = useAgentSessionProgress(sessionId)
  const { session: initialSession } = useAgentSession(sessionId)
  const logsEndRef = useRef<HTMLDivElement>(null)
  const [autoScroll, setAutoScroll] = useState(true)
  const [isRetrying, setIsRetrying] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)
  const [selectedStage, setSelectedStage] = useState<string | null>(null)

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [progress?.logs.length, autoScroll])

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50
    setAutoScroll(isAtBottom)
  }

  const handleRetry = async () => {
    if (!sessionId || !onRetry) return
    setIsRetrying(true)
    try {
      const newSession = await api.agentSessions.retry(sessionId)
      // Navigate to new session immediately, then start it
      onRetry(newSession.id)
      // Start the session after navigation (fire and forget)
      api.agentSessions.start(newSession.id).catch(err => {
        console.error('Failed to start retry session:', err)
      })
    } catch (err) {
      console.error('Failed to create retry session:', err)
      setIsRetrying(false)
    }
  }

  const handleCopyLogs = async () => {
    const logText = displayLogs
      .map((log: ApiAgentSessionLogEntry) => {
        const time = new Date(log.timestamp).toISOString()
        return `[${time}] [${log.level.toUpperCase()}] ${log.message}`
      })
      .join('\n')

    try {
      await navigator.clipboard.writeText(logText)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      console.error('Failed to copy logs:', err)
    }
  }

  // Use progress from SSE if connected, otherwise use initial session data
  const session = progress || initialSession

  const handleStageClick = (stageKey: string) => {
    setSelectedStage(stageKey === selectedStage ? null : stageKey)
  }

  if (isLoading && !session) {
    return (
      <div className={styles.panel}>
        <div className={styles.loadingState}>
          <Spinner />
        </div>
      </div>
    )
  }

  if (error && !session) {
    return (
      <div className={styles.panel}>
        <div className={styles.errorState}>
          {error}
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className={styles.panel}>
        <div className={styles.errorState}>
          Session not found
        </div>
      </div>
    )
  }

  const stageOutputs: Record<string, { logs: any[]; duration?: number; completedAt?: Date }> =
    ('stageOutputs' in session ? session.stageOutputs : {}) as Record<string, { logs: any[]; duration?: number; completedAt?: Date }>
  const displayLogs = selectedStage && stageOutputs[selectedStage]
    ? stageOutputs[selectedStage].logs
    : ('logs' in session ? session.logs : [])

  return (
    <div className={styles.panel}>
      <div className={styles.panelLayout}>
        {/* Left sidebar with vertical stage list */}
        <VerticalStageList
          currentStage={session.stage}
          selectedStage={selectedStage}
          onStageClick={handleStageClick}
          stageOutputs={stageOutputs}
        />

        {/* Main content area */}
        <div className={styles.panelMain}>
          {/* Header with status badge and error/retry */}
          <div className={styles.panelHeader}>
            <Badge
              variant={session.stage === 'completed' ? 'green' : session.stage === 'failed' ? 'red' : 'orange'}
              size="sm"
            >
              {session.stage === 'failed' ? 'Failed' : session.stage}
            </Badge>
            {session.stage === 'failed' && (
              <div className={styles.headerActions}>
                {session.error && (
                  <span className={styles.headerError}>{session.error}</span>
                )}
                <button
                  className={styles.retryButton}
                  onClick={handleRetry}
                  disabled={isRetrying}
                >
                  {isRetrying ? 'Retrying...' : 'Retry'}
                </button>
              </div>
            )}
          </div>

          {/* Logs area */}
          <div className={styles.logsContainer} onScroll={handleScroll}>
            {selectedStage && (
              <div className={styles.stageFilter}>
                Showing logs for: <strong>{selectedStage}</strong>
                <button onClick={() => setSelectedStage(null)} className={styles.clearFilter}>
                  Show all
                </button>
              </div>
            )}
            {displayLogs.length === 0 ? (
              <div className={styles.noLogs}>No logs yet...</div>
            ) : (
              displayLogs.map((log: ApiAgentSessionLogEntry, idx: number) => <LogEntry key={idx} log={log} />)
            )}
            <div ref={logsEndRef} />
          </div>

          {/* Result card for completed */}
          {session.stage === 'completed' && (
            <div className={styles.resultCard}>
              {session.summary && (
                <p className={styles.resultSummary}>{session.summary}</p>
              )}
              {session.commitSha && (
                <div className={styles.commitInfo}>
                  <GitBranchIcon width={14} height={14} />
                  <code>{session.commitSha.slice(0, 7)}</code>
                </div>
              )}
            </div>
          )}

          {/* Footer with copy button */}
          <div className={styles.panelFooter}>
            <button
              className={styles.copyLogsButton}
              onClick={handleCopyLogs}
              title="Copy logs to clipboard"
            >
              <ClipboardIcon width={14} height={14} />
              {copySuccess ? 'Copied!' : 'Copy Logs'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
