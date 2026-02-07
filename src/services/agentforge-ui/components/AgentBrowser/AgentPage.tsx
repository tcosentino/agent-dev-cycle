import { useState, useEffect } from 'react'
import type { AgentConfig } from './types'
import { api, type ApiAgentSession } from '../../api'
import { Badge, Spinner, PlayIcon } from '@agentforge/ui-components'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import styles from './AgentPage.module.css'

export interface AgentPageProps {
  agent: AgentConfig
  projectId: string
  promptContent?: string
  onRunAgent: (agentId: string) => void
  onSessionSelect: (sessionId: string) => void
}

type AgentSection = 'overview' | 'sessions' | 'prompt'

interface AgentSectionItem {
  key: AgentSection
  label: string
}

const sections: AgentSectionItem[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'sessions', label: 'Sessions' },
  { key: 'prompt', label: 'Prompt' },
]

export function AgentPage({
  agent,
  projectId,
  promptContent,
  onRunAgent,
  onSessionSelect,
}: AgentPageProps) {
  const [activeSection, setActiveSection] = useState<AgentSection>('overview')
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
    if (activeSection === 'overview') {
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

    if (activeSection === 'sessions') {
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

    if (activeSection === 'prompt') {
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
    <div className={styles.agentPage}>
      <div className={styles.pageLayout}>
        {/* Left sidebar with section navigation */}
        <div className={styles.sectionList}>
          <div className={styles.agentInfo}>
            <h2 className={styles.agentName}>{agent.displayName}</h2>
            <span className={styles.agentId}>{agent.id}</span>
          </div>
          {sections.map(section => (
            <button
              key={section.key}
              className={`${styles.sectionItem} ${activeSection === section.key ? styles.sectionItemActive : ''}`}
              onClick={() => setActiveSection(section.key)}
            >
              {section.label}
            </button>
          ))}
        </div>

        {/* Main content area */}
        <div className={styles.pageMain}>
          {renderContent()}
        </div>
      </div>
    </div>
  )
}
