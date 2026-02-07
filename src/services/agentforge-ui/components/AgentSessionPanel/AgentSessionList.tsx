import { useState, useEffect } from 'react'
import { api, type ApiAgentSession } from '../../api'
import { Badge, Spinner, PlayIcon, CheckCircleIcon, AlertTriangleIcon, ClockIcon } from '@agentforge/ui-components'
import styles from './AgentSessionPanel.module.css'

export interface AgentSessionListProps {
  projectId: string
  onSessionSelect: (sessionId: string) => void
  onNewSession?: () => void
  selectedSessionId?: string
}

const agentLabels: Record<string, string> = {
  pm: 'PM',
  engineer: 'Engineer',
  qa: 'QA',
  lead: 'Lead',
}

const stageColors: Record<string, 'green' | 'orange' | 'red' | 'blue' | 'muted'> = {
  pending: 'muted',
  cloning: 'blue',
  loading: 'blue',
  executing: 'orange',
  capturing: 'orange',
  committing: 'orange',
  completed: 'green',
  failed: 'red',
}

function getRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${diffDays}d ago`
}

function StageIcon({ stage }: { stage: string }) {
  switch (stage) {
    case 'completed':
      return <CheckCircleIcon width={14} height={14} />
    case 'failed':
      return <AlertTriangleIcon width={14} height={14} />
    case 'pending':
      return <ClockIcon width={14} height={14} />
    default:
      return <PlayIcon width={14} height={14} />
  }
}

export function AgentSessionList({
  projectId,
  onSessionSelect,
  onNewSession,
  selectedSessionId,
}: AgentSessionListProps) {
  const [sessions, setSessions] = useState<ApiAgentSession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!projectId) return

    setIsLoading(true)
    api.agentSessions.list(projectId)
      .then(data => {
        // Sort by createdAt descending (newest first)
        const sorted = [...data].sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        setSessions(sorted)
        setIsLoading(false)
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : 'Failed to load sessions')
        setIsLoading(false)
      })
  }, [projectId])

  if (isLoading) {
    return (
      <div className={styles.listLoading}>
        <Spinner size="sm" />
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.listError}>
        {error}
      </div>
    )
  }

  return (
    <div className={styles.sessionList}>
      {onNewSession && (
        <button
          className={styles.newSessionButton}
          onClick={onNewSession}
        >
          + New Session
        </button>
      )}

      {sessions.length === 0 ? (
        <div className={styles.emptyState}>
          No sessions yet
        </div>
      ) : (
        sessions.map(session => (
          <button
            key={session.id}
            className={`${styles.sessionItem} ${selectedSessionId === session.id ? styles.selected : ''}`}
            onClick={() => onSessionSelect(session.id)}
          >
            <div className={styles.sessionHeader}>
              <span className={styles.sessionId}>{session.sessionId}</span>
              <Badge
                variant={stageColors[session.stage] || 'muted'}
                size="xs"
              >
                <StageIcon stage={session.stage} />
              </Badge>
            </div>
            <div className={styles.sessionMeta}>
              <span className={styles.agent}>{agentLabels[session.agent] || session.agent}</span>
              <span className={styles.separator}>-</span>
              <span className={styles.time}>{getRelativeTime(session.createdAt)}</span>
            </div>
          </button>
        ))
      )}
    </div>
  )
}
