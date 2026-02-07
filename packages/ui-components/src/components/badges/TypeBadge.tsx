import type { TaskType } from '../../types'
import { Badge } from '../Badge/Badge'

interface TypeBadgeProps {
  type: TaskType
}

const typeLabels: Record<TaskType, string> = {
  backend: 'Backend',
  frontend: 'Frontend',
  api: 'API',
  database: 'Database',
  testing: 'Testing'
}

export function TypeBadge({ type }: TypeBadgeProps) {
  return (
    <Badge variant="red" size="sm">
      {typeLabels[type]}
    </Badge>
  )
}
