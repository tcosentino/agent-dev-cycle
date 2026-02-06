import type { AgentRole } from '../../../../../components/task-board/types'
import { CodeIcon, PenIcon, CheckCircleIcon, SettingsIcon } from '../icons'
import styles from './AssigneeBadge.module.css'

interface AssigneeBadgeProps {
  role: AgentRole
}

const roleIcons: Record<AgentRole, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  pm: PenIcon,
  engineer: CodeIcon,
  qa: CheckCircleIcon,
  lead: SettingsIcon
}

export function AssigneeBadge({ role }: AssigneeBadgeProps) {
  const Icon = roleIcons[role]

  return (
    <div className={`${styles.badge} ${styles[role]}`}>
      <Icon className={styles.icon} />
    </div>
  )
}
