import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core'
import { useState } from 'react'
import type { Task, TaskStatus } from '../../types'
import { TaskCard } from '../TaskCard/TaskCard'
import { TaskColumn } from './TaskColumn'
import styles from './TaskBoard.module.css'

export interface TaskBoardProps {
  tasks: Task[]
  onTaskClick?: (task: Task) => void
  onTaskMove?: (taskId: string, newStatus: TaskStatus) => void
  onTaskDelete?: (task: Task) => void
}

const columns: Array<{ status: TaskStatus; label: string }> = [
  { status: 'todo', label: 'To Do' },
  { status: 'in-progress', label: 'In Progress' },
  { status: 'review', label: 'Review' },
  { status: 'done', label: 'Done' },
  { status: 'blocked', label: 'Blocked' },
]

export function TaskBoard({ tasks, onTaskClick, onTaskMove, onTaskDelete }: TaskBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  // Group tasks by status
  const tasksByStatus = tasks.reduce((acc, task) => {
    const status = task.status
    if (!acc[status]) {
      acc[status] = []
    }
    acc[status].push(task)
    return acc
  }, {} as Record<TaskStatus, Task[]>)

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find(t => t.id === event.active.id)
    setActiveTask(task || null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)

    if (!over) return

    const taskId = active.id as string
    const newStatus = over.id as TaskStatus

    const task = tasks.find(t => t.id === taskId)
    if (task && task.status !== newStatus) {
      onTaskMove?.(taskId, newStatus)
    }
  }

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className={styles.board}>
        {columns.map(({ status, label }) => {
          const columnTasks = tasksByStatus[status] || []
          return (
            <TaskColumn
              key={status}
              status={status}
              label={label}
              tasks={columnTasks}
              onTaskClick={onTaskClick}
              onTaskDelete={onTaskDelete}
            />
          )
        })}
      </div>
      
      <DragOverlay>
        {activeTask && (
          <div className={styles.dragOverlay}>
            <TaskCard task={activeTask} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
