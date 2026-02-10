import { useDroppable } from '@dnd-kit/core'
import { useDraggable } from '@dnd-kit/core'
import type { Task, TaskStatus } from '../../types'
import { TaskCard } from '../TaskCard/TaskCard'
import styles from './TaskBoard.module.css'

interface TaskColumnProps {
  status: TaskStatus
  label: string
  tasks: Task[]
  onTaskClick?: (task: Task) => void
  onTaskDelete?: (task: Task) => void
}

interface DraggableTaskCardProps {
  task: Task
  onTaskClick?: (task: Task) => void
  onTaskDelete?: (task: Task) => void
}

function DraggableTaskCard({ task, onTaskClick, onTaskDelete }: DraggableTaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  })

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.5 : 1,
      }
    : undefined

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} onClick={onTaskClick} onDelete={onTaskDelete} />
    </div>
  )
}

export function TaskColumn({ status, label, tasks, onTaskClick, onTaskDelete }: TaskColumnProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: status,
  })

  return (
    <div className={styles.column}>
      <div className={styles.columnHeader}>
        <h2 className={styles.columnTitle}>{label}</h2>
        <span className={styles.taskCount}>{tasks.length}</span>
      </div>

      <div
        ref={setNodeRef}
        className={`${styles.columnContent} ${isOver ? styles.columnContentOver : ''}`}
      >
        {tasks.length === 0 ? (
          <div className={styles.emptyState}>No tasks</div>
        ) : (
          <div className={styles.taskList}>
            {tasks.map(task => (
              <DraggableTaskCard
                key={task.id}
                task={task}
                onTaskClick={onTaskClick}
                onTaskDelete={onTaskDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
