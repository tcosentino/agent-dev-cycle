import { CircleIcon } from '@agentforge/ui-components'
import type { AgentConfig } from './types'
import { AgentDetailView } from './AgentDetailView'
import { getAgentIcon } from './utils'
import styles from './AgentBrowser.module.css'

export interface AgentBrowserProps {
  projectId: string
  agents: AgentConfig[]
  selectedAgent: string | null
  onAgentSelect: (agentId: string) => void
  onRunAgent: (agentId: string) => void
  onSessionSelect: (sessionId: string) => void
  files: Record<string, string>
}

export function AgentBrowser({
  projectId,
  agents,
  selectedAgent,
  onAgentSelect,
  onRunAgent,
  onSessionSelect,
  files,
}: AgentBrowserProps) {
  const selectedAgentConfig = agents.find(a => a.id === selectedAgent)

  // Try both old and new structure for prompt files
  const promptContent = selectedAgentConfig
    ? files[`.agentforge/prompts/${selectedAgentConfig.id}.md`] ||
      files[`prompts/${selectedAgentConfig.id}.md`]
    : undefined

  return (
    <div className={styles.agentBrowser}>
      <div className={styles.agentList}>
        {agents.map(agent => (
          <button
            key={agent.id}
            className={`${styles.agentItem} ${selectedAgent === agent.id ? styles.agentItemActive : ''}`}
            onClick={() => onAgentSelect(agent.id)}
          >
            <span className={styles.agentItemIcon}>{getAgentIcon(agent.id)}</span>
            <span className={styles.agentItemLabel}>{agent.displayName}</span>
          </button>
        ))}

        <button className={styles.addAgentButton} disabled title='Coming soon'>
          <CircleIcon width={16} height={16} />
          <span>Add Agent</span>
        </button>
      </div>

      <div className={styles.agentContent}>
        {selectedAgentConfig ? (
          <AgentDetailView
            agent={selectedAgentConfig}
            projectId={projectId}
            promptContent={promptContent}
            onRunAgent={() => onRunAgent(selectedAgentConfig.id)}
            onSessionSelect={onSessionSelect}
          />
        ) : (
          <div className={styles.emptySelection}>
            <span>Select an agent to view sessions and configuration</span>
          </div>
        )}
      </div>
    </div>
  )
}
