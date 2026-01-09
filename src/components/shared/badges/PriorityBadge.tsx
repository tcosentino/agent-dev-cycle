import type { TaskPriority } from '../../task-board/types'
import styles from './PriorityBadge.module.css'

interface PriorityBadgeProps {
  priority: TaskPriority
}

const priorityLabels: Record<TaskPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical'
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[priority]}`}>
      {priorityLabels[priority]}
    </span>
  )
}
