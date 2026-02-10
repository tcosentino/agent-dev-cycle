import { useState, useEffect } from 'react'
import { 
  TaskBoard, 
  TaskDetailPanel, 
  TaskForm,
  Modal,
  Spinner,
  type Task as UITask
} from '@agentforge/ui-components'
import { api, type ApiTask } from '../../api'
import styles from './TasksPage.module.css'

interface TasksPageProps {
  projectId: string
}

export function TasksPage({ projectId }: TasksPageProps) {
  const [tasks, setTasks] = useState<UITask[]>([])
  const [selectedTask, setSelectedTask] = useState<UITask | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  // Convert API task to UI task
  const convertTask = (apiTask: ApiTask): UITask => ({
    ...apiTask,
    status: apiTask.status as any,
    priority: apiTask.priority as any,
    type: apiTask.type as any,
  })

  // Load tasks on mount
  useEffect(() => {
    loadTasks()
  }, [projectId])

  const loadTasks = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const apiTasks = await api.tasks.list(projectId)
      setTasks(apiTasks.map(convertTask))
    } catch (err) {
      console.error('Failed to load tasks:', err)
      setError('Failed to load tasks. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateTask = async (formData: any) => {
    try {
      setIsCreating(true)
      const newTask = await api.tasks.create({
        projectId,
        ...formData,
      })
      setTasks(prev => [...prev, convertTask(newTask)])
      setShowCreateModal(false)
      
      // Show success toast (you can implement toast later)
      console.log(`Task ${newTask.key} created successfully`)
    } catch (err) {
      console.error('Failed to create task:', err)
      alert('Failed to create task. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  const handleTaskMove = async (taskId: string, newStatus: any) => {
    // Optimistic update
    const prevTasks = [...tasks]
    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, status: newStatus } : t
    ))

    try {
      await api.tasks.update(taskId, { status: newStatus })
    } catch (err) {
      console.error('Failed to update task status:', err)
      // Revert on error
      setTasks(prevTasks)
      alert('Failed to update task status. Please try again.')
    }
  }

  const handleTaskUpdate = async (taskId: string, updates: Partial<UITask>) => {
    try {
      setIsUpdating(true)
      const updatedTask = await api.tasks.update(taskId, updates)
      setTasks(prev => prev.map(t => 
        t.id === taskId ? convertTask(updatedTask) : t
      ))
      setSelectedTask(convertTask(updatedTask))
    } catch (err) {
      console.error('Failed to update task:', err)
      alert('Failed to update task. Please try again.')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleTaskDelete = async (task: UITask) => {
    try {
      await api.tasks.delete(task.id)
      setTasks(prev => prev.filter(t => t.id !== task.id))
      setSelectedTask(null)
      console.log(`Task ${task.key} deleted`)
    } catch (err) {
      console.error('Failed to delete task:', err)
      alert('Failed to delete task. Please try again.')
    }
  }

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <Spinner />
        <p>Loading tasks...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.error}>
        <p>{error}</p>
        <button onClick={loadTasks} className={styles.retryButton}>
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Tasks</h1>
        <button 
          className={styles.newTaskButton}
          onClick={() => setShowCreateModal(true)}
        >
          + New Task
        </button>
      </div>

      <div className={styles.boardContainer}>
        <TaskBoard
          tasks={tasks}
          onTaskClick={setSelectedTask}
          onTaskMove={handleTaskMove}
          onTaskDelete={handleTaskDelete}
        />
      </div>

      <TaskDetailPanel
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        onUpdate={handleTaskUpdate}
        onDelete={handleTaskDelete}
        isUpdating={isUpdating}
      />

      {showCreateModal && (
        <Modal onClose={() => setShowCreateModal(false)}>
          <div className={styles.modalContent}>
            <h2 className={styles.modalTitle}>Create New Task</h2>
            <TaskForm
              onSubmit={handleCreateTask}
              onCancel={() => setShowCreateModal(false)}
              submitLabel="Create Task"
              isLoading={isCreating}
            />
          </div>
        </Modal>
      )}
    </div>
  )
}
