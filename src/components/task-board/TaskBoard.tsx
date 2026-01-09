import type { Task, TaskBoardProps, TaskStatus } from './types'
import { TaskBoardHeader } from './TaskBoardHeader'
import { TaskColumn } from './TaskColumn'
import styles from './TaskBoard.module.css'

const statusOrder: TaskStatus[] = ['todo', 'in-progress', 'done']

export function TaskBoard({ projectName, projectKey, phase, tasks, animate = false }: TaskBoardProps) {
  const tasksByStatus = statusOrder.reduce((acc, status) => {
    acc[status] = tasks.filter(task => task.status === status)
    return acc
  }, {} as Record<TaskStatus, Task[]>)

  return (
    <div className={styles.container}>
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
