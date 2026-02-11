import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { useState } from 'react'
import type { Task, TaskStatus } from '../../types'
import { TASK_BOARD_COLUMNS } from '../../domain/task/constants'
import { TaskCard } from '../TaskCard/TaskCard'
import { TaskColumn } from './TaskColumn'
import styles from './TaskBoard.module.css'

export interface TaskBoardProps {
  tasks: Task[]
  onTaskClick?: (task: Task) => void
  onTaskMove?: (taskId: string, newStatus: TaskStatus) => void
  onTaskDelete?: (task: Task) => void
}

export function TaskBoard({ tasks, onTaskClick, onTaskMove, onTaskDelete }: TaskBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [announcement, setAnnouncement] = useState<string>('')

  // Configure sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required to start drag (prevents accidental drags)
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

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
    setAnnouncement(`Picked up task ${task?.key}. Use arrow keys to move between TASK_BOARD_COLUMNS, Space to drop.`)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event
    if (over && activeTask) {
      const columnLabel = TASK_BOARD_COLUMNS.find(c => c.status === over.id)?.label
      setAnnouncement(`Task ${activeTask.key} is over ${columnLabel} column.`)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    const task = activeTask
    setActiveTask(null)

    if (!over) {
      setAnnouncement(`Task ${task?.key} dropped. No changes made.`)
      return
    }

    const taskId = active.id as string
    const newStatus = over.id as TaskStatus

    const movedTask = tasks.find(t => t.id === taskId)
    if (movedTask && movedTask.status !== newStatus) {
      const columnLabel = TASK_BOARD_COLUMNS.find(c => c.status === newStatus)?.label
      setAnnouncement(`Task ${movedTask.key} moved to ${columnLabel}.`)
      onTaskMove?.(taskId, newStatus)
    } else {
      setAnnouncement(`Task ${movedTask?.key} dropped in same column.`)
    }
  }

  return (
    <DndContext 
      sensors={sensors}
      onDragStart={handleDragStart} 
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      {/* Screen reader announcements */}
      <div 
        role="status" 
        aria-live="assertive" 
        aria-atomic="true"
        className={styles.srOnly}
      >
        {announcement}
      </div>

      <div className={styles.board}>
        {TASK_BOARD_COLUMNS.map(({ status, label }) => {
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
