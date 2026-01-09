import type { TaskType } from '../../task-board/types'
import styles from './TypeBadge.module.css'

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
    <span className={styles.badge}>
      {typeLabels[type]}
    </span>
  )
}
