import type { TaskPriority } from '../../types'
import { Badge, type BadgeVariant } from '../Badge/Badge'

interface PriorityBadgeProps {
  priority: TaskPriority
}

const priorityLabels: Record<TaskPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical'
}

const priorityVariants: Record<TaskPriority, BadgeVariant> = {
  low: 'green',
  medium: 'orange',
  high: 'red',
  critical: 'pink'
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  return (
    <Badge variant={priorityVariants[priority]} size="sm">
      {priorityLabels[priority]}
    </Badge>
  )
}
