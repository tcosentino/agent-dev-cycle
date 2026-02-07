import { useState, useEffect } from 'react'
import { PlayIcon, Spinner, Badge, CheckCircleIcon, AlertTriangleIcon, ClockIcon } from '@agentforge/ui-components'
import { api, type ApiAgentSession } from '../../api'
import type { AgentConfig } from './types'
import { getAgentIcon } from './utils'
import styles from './AgentBrowser.module.css'
import ReactMarkdown from 'react-markdown'

interface AgentDetailViewProps {
  agent: AgentConfig
  projectId: string
  promptContent?: string
  onRunAgent: () => void
  onSessionSelect: (sessionId: string) => void
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
    default:
      return <ClockIcon width={14} height={14} />
  }
}

export function AgentDetailView({
  agent,
  projectId,
  promptContent,
  onRunAgent,
  onSessionSelect,
}: AgentDetailViewProps) {
  const [activeTab, setActiveTab] = useState<'sessions' | 'config'>('sessions')
  const [sessions, setSessions] = useState<ApiAgentSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadSessions = async () => {
      try {
        setLoading(true)
        const allSessions = await api.agentSessions.list(projectId)
        // Filter sessions for this specific agent
        const filtered = allSessions.filter(s => s.agent === agent.id)
        setSessions(filtered)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load sessions')
      } finally {
        setLoading(false)
      }
    }

    loadSessions()

    // Poll for updates every 5 seconds
    const interval = setInterval(loadSessions, 5000)
    return () => clearInterval(interval)
  }, [projectId, agent.id])

  return (
    <div className={styles.agentDetail}>
      <div className={styles.agentHeader}>
        <div className={styles.agentHeaderTitle}>
          <span className={styles.agentHeaderIcon}>{getAgentIcon(agent.id)}</span>
          <h3>{agent.displayName}</h3>
        </div>
        <button className={styles.runAgentButton} onClick={onRunAgent}>
          <PlayIcon width={16} height={16} />
          Run Agent
        </button>
      </div>

      <div className={styles.agentTabs}>
        <button
          className={`${styles.agentTab} ${activeTab === 'sessions' ? styles.agentTabActive : ''}`}
          onClick={() => setActiveTab('sessions')}
        >
          Sessions
        </button>
        <button
          className={`${styles.agentTab} ${activeTab === 'config' ? styles.agentTabActive : ''}`}
          onClick={() => setActiveTab('config')}
        >
          Config
        </button>
      </div>

      <div className={styles.agentTabContent}>
        {activeTab === 'sessions' ? (
          <div className={styles.sessionsContainer}>
            {loading ? (
              <div className={styles.loadingContainer}>
                <Spinner />
                <span>Loading sessions...</span>
              </div>
            ) : error ? (
              <div className={styles.errorContainer}>
                <AlertTriangleIcon width={20} height={20} />
                <span>{error}</span>
              </div>
            ) : sessions.length === 0 ? (
              <div className={styles.emptyState}>
                <span>No sessions yet for this agent</span>
                <button className={styles.runAgentButtonSmall} onClick={onRunAgent}>
                  <PlayIcon width={14} height={14} />
                  Run First Session
                </button>
              </div>
            ) : (
              <div className={styles.sessionList}>
                {sessions.map(session => (
                  <div
                    key={session.id}
                    className={styles.sessionItem}
                    onClick={() => onSessionSelect(session.id)}
                  >
                    <div className={styles.sessionHeader}>
                      <div className={styles.sessionTitle}>{session.taskPrompt}</div>
                      <div className={styles.sessionTime}>{getRelativeTime(session.createdAt)}</div>
                    </div>
                    <div className={styles.sessionFooter}>
                      <Badge variant={stageColors[session.stage] || 'muted'}>
                        <StageIcon stage={session.stage} />
                        {session.stage}
                      </Badge>
                      {session.phase && (
                        <Badge>
                          {session.phase}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className={styles.configContainer}>
            <div className={styles.configSection}>
              <h4 className={styles.configSectionTitle}>Model Configuration</h4>
              <div className={styles.configItem}>
                <span className={styles.configLabel}>Model:</span>
                <span className={styles.configValue}>{agent.model}</span>
              </div>
              <div className={styles.configItem}>
                <span className={styles.configLabel}>Max Tokens:</span>
                <span className={styles.configValue}>{agent.maxTokens.toLocaleString()}</span>
              </div>
              {agent.orchestrator && (
                <div className={styles.configItem}>
                  <span className={styles.configLabel}>Orchestrator:</span>
                  <span className={styles.configValue}>Yes</span>
                </div>
              )}
            </div>

            {promptContent && (
              <div className={styles.configSection}>
                <h4 className={styles.configSectionTitle}>Agent Prompt</h4>
                <div className={styles.promptContent}>
                  <ReactMarkdown>{promptContent}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

