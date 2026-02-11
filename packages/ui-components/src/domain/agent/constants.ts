import type { AgentRole } from '../../types'
import { CodeIcon, PenIcon, CheckCircleIcon, SettingsIcon } from '../../icons/icons'

/**
 * Agent domain constants
 *
 * These constants define agent roles and their visual representation.
 * Extracted from AssigneeBadge and AgentStatusBadge.
 */

// Agent role to icon mapping
export const AGENT_ROLE_ICONS: Record<AgentRole, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  pm: PenIcon,
  engineer: CodeIcon,
  qa: CheckCircleIcon,
  lead: SettingsIcon
}

// Agent role display names
export const AGENT_ROLE_LABELS: Record<AgentRole, string> = {
  pm: 'PM',
  engineer: 'Engineer',
  qa: 'QA',
  lead: 'Lead'
}
