import { useState, useEffect, useRef } from 'react'
import type { AgentConfig } from './types'
import { api, type ApiAgentSession } from '../../api'
import { Badge, Spinner, PlayIcon } from '@agentforge/ui-components'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { PanelLayout } from '../PanelLayout'
import { SectionCard } from '../SectionCard'
import styles from './AgentPanel.module.css'

export interface AgentPanelProps {
  agent: AgentConfig
  projectId: string
  promptContent?: string
  onRunAgent: (agentId: string) => void
  onSessionSelect: (sessionId: string) => void
  initialTab?: AgentTab
  onTabChange?: (tab: AgentTab) => void
}

type AgentTab = 'overview' | 'sessions' | 'prompt'

const AGENT_TABS = [
  { id: 'overview' as AgentTab, label: 'Overview' },
  { id: 'sessions' as AgentTab, label: 'Sessions' },
  { id: 'prompt' as AgentTab, label: 'Prompt' },
]

function formatDuration(ms: number): string {
  if (ms < 60_000) return `${Math.round(ms / 1000)}s`
  const mins = Math.floor(ms / 60_000)
  const secs = Math.round((ms % 60_000) / 1000)
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function DurationWidget({ session }: { session: ApiAgentSession }) {
  const [visible, setVisible] = useState(false)
  const [above, setAbove] = useState(false)
  const [elapsed, setElapsed] = useState<number | null>(null)

  const start = session.startedAt
  const end = session.completedAt
  const isLive = !!start && !end && !['completed', 'failed', 'cancelled'].includes(session.stage)

  useEffect(() => {
    if (start && end) {
      setElapsed(new Date(end).getTime() - new Date(start).getTime())
      return
    }
    if (!start || !isLive) return
    const tick = () => setElapsed(Date.now() - new Date(start!).getTime())
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [start, end, isLive])

  if (!start) return <span className={styles.durationWidget}>—</span>

  const handleMouseEnter = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setAbove(rect.bottom > window.innerHeight * 0.6)
    setVisible(true)
  }

  return (
    <span
      className={`${styles.durationWidget}${isLive ? ` ${styles.durationLive}` : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setVisible(false)}
    >
      {elapsed !== null ? formatDuration(elapsed) : '…'}
      {visible && (
        <span className={`${styles.durationTooltip}${above ? ` ${styles.durationTooltipAbove}` : ''}`}>
          <span className={styles.durationTooltipRow}>
            <span>Started</span>
            <span>{formatDateTime(start)}</span>
          </span>
          {end && (
            <span className={styles.durationTooltipRow}>
              <span>Ended</span>
              <span>{formatDateTime(end)}</span>
            </span>
          )}
        </span>
      )}
    </span>
  )
}

export function AgentPanel({
  agent,
  projectId,
  promptContent,
  onRunAgent,
  onSessionSelect,
  initialTab,
  onTabChange,
}: AgentPanelProps) {
  const [activeTab, setActiveTab] = useState<AgentTab>(initialTab ?? 'overview')

  const handleTabChange = (tab: AgentTab) => {
    setActiveTab(tab)
    onTabChange?.(tab)
  }

  const [sessions, setSessions] = useState<ApiAgentSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadSessions = async () => {
      try {
        setLoading(true)
        const allSessions = await api.agentSessions.list(projectId)
        const filtered = allSessions.filter(s => s.agent === agent.id)
        setSessions(filtered)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load sessions')
      } finally {
        setLoading(false)
      }
    }

    loadSessions()
    const interval = setInterval(loadSessions, 5000)
    return () => clearInterval(interval)
  }, [projectId, agent.id])

  const runButton = (
    <button
      className={styles.runAgentButton}
      onClick={() => onRunAgent(agent.id)}
    >
      <PlayIcon />
      Run {agent.displayName}
    </button>
  )

  const renderContent = () => {
    if (activeTab === 'overview') {
      return (
        <div className={styles.overviewContent}>
          <SectionCard title="Configuration">
            <div className={styles.configGrid}>
              <div className={styles.configItem}>
                <span className={styles.configLabel}>Model</span>
                <Badge variant="blue" size="sm">{agent.model}</Badge>
              </div>
              <div className={styles.configItem}>
                <span className={styles.configLabel}>Max Tokens</span>
                <span className={styles.configValue}>{agent.maxTokens.toLocaleString()}</span>
              </div>
              {agent.orchestrator && (
                <div className={styles.configItem}>
                  <span className={styles.configLabel}>Role</span>
                  <Badge variant="pink" size="sm">Orchestrator</Badge>
                </div>
              )}
            </div>
          </SectionCard>

          <SectionCard title="Recent Activity">
            <div className={styles.statsList}>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Total Sessions</span>
                <span className={styles.statValue}>{sessions.length}</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Completed</span>
                <span className={styles.statValue}>
                  {sessions.filter(s => s.stage === 'completed').length}
                </span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Failed</span>
                <span className={styles.statValue}>
                  {sessions.filter(s => s.stage === 'failed').length}
                </span>
              </div>
            </div>
          </SectionCard>
        </div>
      )
    }

    if (activeTab === 'sessions') {
      if (loading) {
        return (
          <div className={styles.loadingState}>
            <Spinner />
            <span>Loading sessions...</span>
          </div>
        )
      }

      if (error) {
        return <div className={styles.errorState}>{error}</div>
      }

      if (sessions.length === 0) {
        return (
          <div className={styles.emptyState}>
            <span>No sessions yet</span>
          </div>
        )
      }

      return (
        <div className={styles.sessionsList}>
          {sessions.map(session => (
            <button
              key={session.id}
              className={styles.sessionItem}
              onClick={() => onSessionSelect(session.id)}
            >
              <div className={styles.sessionHeader}>
                <span className={styles.sessionId}>{session.id.slice(0, 8)}</span>
                <Badge
                  variant={
                    session.stage === 'completed' ? 'green' :
                    session.stage === 'failed' ? 'red' : 'orange'
                  }
                  size="sm"
                >
                  {session.stage}
                </Badge>
              </div>
              <div className={styles.sessionMeta}>
                <span>{new Date(session.createdAt).toLocaleString()}</span>
                <span className={styles.separator}>·</span>
                <DurationWidget session={session} />
              </div>
            </button>
          ))}
        </div>
      )
    }

    if (activeTab === 'prompt') {
      if (!promptContent) {
        return (
          <div className={styles.emptyState}>
            <span>No prompt file found</span>
          </div>
        )
      }

      return (
        <div className={styles.promptContent}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {promptContent}
          </ReactMarkdown>
        </div>
      )
    }

    return null
  }

  return (
    <PanelLayout
      title={agent.displayName}
      headerActions={runButton}
      tabs={AGENT_TABS}
      activeTab={activeTab}
      onTabChange={handleTabChange}
    >
      {renderContent()}
    </PanelLayout>
  )
}
