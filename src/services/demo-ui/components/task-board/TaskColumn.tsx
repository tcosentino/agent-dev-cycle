import type { Task, TaskStatus } from './types'
import { TaskCard } from './TaskCard'
import styles from './TaskColumn.module.css'

interface TaskColumnProps {
  status: TaskStatus
  tasks: Task[]
  animate?: boolean
  selectedTaskKey?: string | null
  onTaskClick?: (taskKey: string) => void
}

const statusLabels: Record<TaskStatus, string> = {
  'todo': 'To Do',
  'in-progress': 'In Progress',
  'done': 'Done'
}

export function TaskColumn({ status, tasks, animate = false, selectedTaskKey, onTaskClick }: TaskColumnProps) {
  return (
    <div className={styles.column}>
      <div className={styles.header}>
        {statusLabels[status]}
        <span className={styles.count}>{tasks.length}</span>
      </div>
      <div className={styles.tasks}>
        {tasks.map((task, index) => (
          <TaskCard
            key={task.key}
            task={task}
            animate={animate}
            animationDelay={0.3 + index * 0.3}
            selected={selectedTaskKey === task.key}
            onClick={onTaskClick}
          />
        ))}
      </div>
    </div>
  )
}
