import type { Task } from './types'
import { PriorityBadge, TypeBadge, AssigneeBadge } from '../shared/badges'
import styles from './TaskCard.module.css'

interface TaskCardProps {
  task: Task
  animate?: boolean
  animationDelay?: number
}

export function TaskCard({ task, animate = false, animationDelay = 0 }: TaskCardProps) {
  const style = animate ? { animationDelay: `${animationDelay}s` } : undefined

  return (
    <div
      className={`${styles.card} ${animate ? styles.animate : ''}`}
      style={style}
    >
      <div className={styles.key}>{task.key}</div>
      <div className={styles.title}>{task.title}</div>
      <div className={styles.meta}>
        <TypeBadge type={task.type} />
        <PriorityBadge priority={task.priority} />
        {task.assignee && <AssigneeBadge role={task.assignee} />}
      </div>
    </div>
  )
}
