import { useState, useEffect } from 'react'
import type { AgentConfig } from './types'
import { api, type ApiAgentSession } from '../../api'
import { Badge, Spinner, PlayIcon } from '@agentforge/ui-components'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { PanelLayout } from '../PanelLayout'
import styles from './AgentPanel.module.css'

export interface AgentPanelProps {
  agent: AgentConfig
  projectId: string
  promptContent?: string
  onRunAgent: (agentId: string) => void
  onSessionSelect: (sessionId: string) => void
}

type AgentTab = 'overview' | 'sessions' | 'prompt'

const AGENT_TABS = [
  { id: 'overview' as AgentTab, label: 'Overview' },
  { id: 'sessions' as AgentTab, label: 'Sessions' },
  { id: 'prompt' as AgentTab, label: 'Prompt' },
]

export function AgentPanel({
  agent,
  projectId,
  promptContent,
  onRunAgent,
  onSessionSelect,
}: AgentPanelProps) {
  const [activeTab, setActiveTab] = useState<AgentTab>('overview')
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

  const renderContent = () => {
    if (activeTab === 'overview') {
      return (
        <div className={styles.overviewContent}>
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

          <div className={styles.statsSection}>
            <h3 className={styles.sectionTitle}>Recent Activity</h3>
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
          </div>

          <button
            className={styles.runAgentButton}
            onClick={() => onRunAgent(agent.id)}
          >
            <PlayIcon />
            Run {agent.displayName}
          </button>
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
            <button
              className={styles.runAgentButton}
              onClick={() => onRunAgent(agent.id)}
            >
              <PlayIcon />
              Run {agent.displayName}
            </button>
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
      tabs={AGENT_TABS}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {renderContent()}
    </PanelLayout>
  )
}
