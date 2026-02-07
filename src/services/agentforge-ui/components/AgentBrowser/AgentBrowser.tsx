import type { AgentConfig } from './types'
import styles from './AgentBrowser.module.css'

export interface AgentBrowserProps {
  agents: AgentConfig[]
  selectedAgent: string | null
  onAgentSelect: (agentId: string) => void
}

export function AgentBrowser({
  agents,
  selectedAgent,
  onAgentSelect,
}: AgentBrowserProps) {
  return (
    <div className={styles.agentList}>
      {agents.map(agent => (
        <button
          key={agent.id}
          className={`${styles.agentItem} ${selectedAgent === agent.id ? styles.agentItemActive : ''}`}
          onClick={() => onAgentSelect(agent.id)}
        >
          <span className={styles.agentName}>{agent.displayName}</span>
        </button>
      ))}
    </div>
  )
}
