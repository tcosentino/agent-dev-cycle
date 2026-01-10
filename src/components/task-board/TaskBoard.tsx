import type { Task, TaskBoardProps, TaskStatus } from './types'
import { TaskBoardHeader } from './TaskBoardHeader'
import { TaskColumn } from './TaskColumn'
import styles from './TaskBoard.module.css'

const statusOrder: TaskStatus[] = ['todo', 'in-progress', 'done']

export function TaskBoard({ projectName, projectKey, phase, tasks, animate = false, minHeight }: TaskBoardProps) {
  const tasksByStatus = statusOrder.reduce((acc, status) => {
    acc[status] = tasks.filter(task => task.status === status)
    return acc
  }, {} as Record<TaskStatus, Task[]>)

  const style = minHeight ? { minHeight: typeof minHeight === 'number' ? `${minHeight}px` : minHeight } : undefined

  return (
    <div className={styles.container} style={style}>
      <TaskBoardHeader
        projectName={projectName}
        projectKey={projectKey}
        phase={phase}
      />
      <div className={styles.columns}>
        {statusOrder.map(status => (
          <TaskColumn
            key={status}
            status={status}
            tasks={tasksByStatus[status]}
            animate={animate}
          />
        ))}
      </div>
    </div>
  )
}
