export interface AgentConfig {
  id: string // agent key from YAML (pm, engineer, etc)
  displayName: string // Friendly name (PM, Engineer, etc)
  model: string // sonnet, opus, haiku
  maxTokens: number
  orchestrator?: boolean
}

export type AgentViewMode = 'sessions' | 'config'
