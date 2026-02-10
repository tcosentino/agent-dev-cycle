import type { Task } from '../../types'
import { PriorityBadge } from '../badges/PriorityBadge'
import { TypeBadge } from '../badges/TypeBadge'
import { AssigneeBadge } from '../badges/AssigneeBadge'
import styles from './TaskCard.module.css'

export interface TaskCardProps {
  task: Task
  onClick?: (task: Task) => void
  onDelete?: (task: Task) => void
}

export function TaskCard({ task, onClick, onDelete }: TaskCardProps) {
  const handleClick = () => {
    onClick?.(task)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete?.(task)
  }

  return (
    <div 
      className={styles.card}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleClick()
        }
      }}
    >
      <div className={styles.header}>
        <span className={styles.key}>{task.key}</span>
        {onDelete && (
          <button
            className={styles.deleteButton}
            onClick={handleDelete}
            aria-label="Delete task"
            title="Delete task"
          >
            ×
          </button>
        )}
      </div>
      
      <h3 className={styles.title}>{task.title}</h3>
      
      <div className={styles.footer}>
        <div className={styles.badges}>
          {task.priority && <PriorityBadge priority={task.priority} />}
          {task.type && <TypeBadge type={task.type} />}
        </div>
        {task.assignee && (
          <div className={styles.assignee}>
            <AssigneeBadge assignee={task.assignee} />
          </div>
        )}
      </div>
      
      {task.priority && (
        <div 
          className={`${styles.priorityIndicator} ${styles[`priority-${task.priority}`]}`}
          aria-hidden="true"
        />
      )}
    </div>
  )
}
