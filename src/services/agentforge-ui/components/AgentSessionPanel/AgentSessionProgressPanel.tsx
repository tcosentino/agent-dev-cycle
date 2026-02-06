import { useEffect, useRef, useState } from 'react'
import { useAgentSessionProgress, useAgentSession } from '../../hooks'
import { api, type ApiAgentSessionLogEntry } from '../../api'
import { Badge } from '../shared/Badge/Badge'
import { Spinner } from '../shared/Spinner/Spinner'
import {
  CheckCircleIcon,
  AlertTriangleIcon,
  ClockIcon,
  PlayIcon,
  XIcon,
  GitBranchIcon,
} from '../shared/icons'
import styles from './AgentSessionPanel.module.css'

export interface AgentSessionProgressPanelProps {
  sessionId: string
  onClose?: () => void
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

function StageIndicator({ currentStage }: { currentStage: string }) {
  const current = stageIndex[currentStage] ?? -1
  const isComplete = currentStage === 'completed'
  const isFailed = currentStage === 'failed'

  return (
    <div className={styles.stageIndicator}>
      {stages.map((stage, idx) => {
        let status: 'pending' | 'active' | 'complete' | 'failed' = 'pending'
        if (isFailed && current === idx) {
          status = 'failed'
        } else if (isComplete || idx < current) {
          status = 'complete'
        } else if (idx === current) {
          status = 'active'
        }

        return (
          <div key={stage.key} className={styles.stageStep}>
            <div className={`${styles.stageNode} ${styles[status]}`}>
              {status === 'complete' && <CheckCircleIcon width={12} height={12} />}
              {status === 'active' && <PlayIcon width={10} height={10} />}
              {status === 'failed' && <AlertTriangleIcon width={12} height={12} />}
              {status === 'pending' && <span className={styles.stageDot} />}
            </div>
            <span className={`${styles.stageLabel} ${styles[status]}`}>
              {stage.label}
            </span>
            {idx < stages.length - 1 && (
              <div className={`${styles.stageLine} ${idx < current ? styles.complete : ''}`} />
            )}
          </div>
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

function ElapsedTime({ startedAt }: { startedAt?: string }) {
  const [elapsed, setElapsed] = useState('')

  useEffect(() => {
    if (!startedAt) return

    const startTime = new Date(startedAt).getTime()

    const update = () => {
      const diff = Date.now() - startTime
      const mins = Math.floor(diff / 60000)
      const secs = Math.floor((diff % 60000) / 1000)
      setElapsed(`${mins}:${secs.toString().padStart(2, '0')}`)
    }

    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [startedAt])

  if (!startedAt || !elapsed) return null

  return (
    <span className={styles.elapsedTime}>
      <ClockIcon width={14} height={14} />
      {elapsed}
    </span>
  )
}

export function AgentSessionProgressPanel({
  sessionId,
  onClose,
}: AgentSessionProgressPanelProps) {
  const { progress, isLoading, error } = useAgentSessionProgress(sessionId)
  const { session: initialSession } = useAgentSession(sessionId)
  const logsEndRef = useRef<HTMLDivElement>(null)
  const [autoScroll, setAutoScroll] = useState(true)
  const [isCancelling, setIsCancelling] = useState(false)
  const [isRetrying, setIsRetrying] = useState(false)

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

  const handleCancel = async () => {
    if (!sessionId) return
    setIsCancelling(true)
    try {
      await api.agentSessions.cancel(sessionId)
    } catch (err) {
      console.error('Failed to cancel session:', err)
    }
    setIsCancelling(false)
  }

  const handleRetry = async () => {
    if (!sessionId) return
    setIsRetrying(true)
    try {
      await api.agentSessions.retry(sessionId)
      // After retry resets the session, start it again
      await api.agentSessions.start(sessionId)
    } catch (err) {
      console.error('Failed to retry session:', err)
    }
    setIsRetrying(false)
  }

  // Use progress from SSE if connected, otherwise use initial session data
  const session = progress || initialSession
  const isRunning = session && !['completed', 'failed', 'pending'].includes(session.stage)

  if (isLoading && !session) {
    return (
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <h3 className={styles.panelTitle}>Loading...</h3>
          {onClose && (
            <button className={styles.closeButton} onClick={onClose}>
              <XIcon width={18} height={18} />
            </button>
          )}
        </div>
        <div className={styles.loadingState}>
          <Spinner />
        </div>
      </div>
    )
  }

  if (error && !session) {
    return (
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <h3 className={styles.panelTitle}>Error</h3>
          {onClose && (
            <button className={styles.closeButton} onClick={onClose}>
              <XIcon width={18} height={18} />
            </button>
          )}
        </div>
        <div className={styles.errorState}>
          {error}
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <h3 className={styles.panelTitle}>Session not found</h3>
          {onClose && (
            <button className={styles.closeButton} onClick={onClose}>
              <XIcon width={18} height={18} />
            </button>
          )}
        </div>
      </div>
    )
  }

  const logs = 'logs' in session ? session.logs : []
  const startedAt = 'startedAt' in session ? session.startedAt : undefined

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <div className={styles.panelTitleRow}>
          <h3 className={styles.panelTitle}>
            {session.sessionId}
          </h3>
          <Badge
            variant={session.stage === 'completed' ? 'green' : session.stage === 'failed' ? 'red' : 'orange'}
            size="sm"
          >
            {session.stage}
          </Badge>
        </div>
        <div className={styles.panelMeta}>
          <span>{session.agent.toUpperCase()}</span>
          <span className={styles.separator}>-</span>
          <span>{session.phase}</span>
          {startedAt && (
            <>
              <span className={styles.separator}>-</span>
              <ElapsedTime startedAt={startedAt} />
            </>
          )}
        </div>
        {onClose && (
          <button className={styles.closeButton} onClick={onClose}>
            <XIcon width={18} height={18} />
          </button>
        )}
      </div>

      <StageIndicator currentStage={session.stage} />

      {session.currentStep && (
        <div className={styles.currentStep}>
          {session.currentStep}
        </div>
      )}

      <div className={styles.progressBar}>
        <div
          className={styles.progressFill}
          style={{ width: `${session.progress}%` }}
        />
      </div>

      <div className={styles.logsContainer} onScroll={handleScroll}>
        {logs.length === 0 ? (
          <div className={styles.noLogs}>No logs yet...</div>
        ) : (
          logs.map((log, idx) => <LogEntry key={idx} log={log} />)
        )}
        <div ref={logsEndRef} />
      </div>

      {(session.stage === 'completed' || session.stage === 'failed') && (
        <div className={styles.resultCard}>
          {session.stage === 'completed' ? (
            <>
              <div className={styles.resultHeader}>
                <CheckCircleIcon width={20} height={20} className={styles.successIcon} />
                <span>Completed</span>
              </div>
              {session.summary && (
                <p className={styles.resultSummary}>{session.summary}</p>
              )}
              {session.commitSha && (
                <div className={styles.commitInfo}>
                  <GitBranchIcon width={14} height={14} />
                  <code>{session.commitSha.slice(0, 7)}</code>
                </div>
              )}
            </>
          ) : (
            <>
              <div className={styles.resultHeader}>
                <AlertTriangleIcon width={20} height={20} className={styles.errorIcon} />
                <span>Failed</span>
              </div>
              {session.error && (
                <p className={styles.resultError}>{session.error}</p>
              )}
              <button
                className={styles.retryButton}
                onClick={handleRetry}
                disabled={isRetrying}
              >
                {isRetrying ? 'Retrying...' : 'Retry Session'}
              </button>
            </>
          )}
        </div>
      )}

      {isRunning && (
        <div className={styles.actionBar}>
          <button
            className={styles.cancelButton}
            onClick={handleCancel}
            disabled={isCancelling}
          >
            {isCancelling ? 'Cancelling...' : 'Cancel Session'}
          </button>
        </div>
      )}
    </div>
  )
}
