import type { ReactNode } from 'react'
import { CircleIcon, CodeIcon, WrenchIcon, CheckCircleIcon } from '@agentforge/ui-components'
import YAML from 'yaml'
import type { AgentConfig } from './types'

export function parseAgentsYaml(yamlContent: string): AgentConfig[] {
  try {
    const parsed = YAML.parse(yamlContent) as Record<
      string,
      { model?: string; maxTokens?: number; orchestrator?: boolean }
    >

    return Object.entries(parsed).map(([id, config]) => ({
      id,
      displayName: getAgentDisplayName(id),
      model: config?.model || 'sonnet',
      maxTokens: config?.maxTokens || 50000,
      orchestrator: config?.orchestrator,
    }))
  } catch (error) {
    console.error('Failed to parse agents.yaml:', error)
    return []
  }
}

export function getAgentDisplayName(role: string): string {
  const displayNames: Record<string, string> = {
    pm: 'PM',
    engineer: 'Engineer',
    qa: 'QA',
    lead: 'Lead',
  }

  return displayNames[role] || role.charAt(0).toUpperCase() + role.slice(1)
}

export const AGENT_ICONS: Record<string, ReactNode> = {
  pm: <CircleIcon width={16} height={16} />,
  engineer: <CodeIcon width={16} height={16} />,
  qa: <WrenchIcon width={16} height={16} />,
  lead: <CheckCircleIcon width={16} height={16} />,
}

export function getAgentIcon(role: string): ReactNode {
  return AGENT_ICONS[role] || <CircleIcon width={16} height={16} />
}
