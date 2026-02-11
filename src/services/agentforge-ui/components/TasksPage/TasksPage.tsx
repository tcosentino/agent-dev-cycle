import { useState, useEffect, useMemo } from 'react'
import {
  TaskBoard,
  TaskDetailPanel,
  TaskForm,
  TaskFilters,
  Modal,
  Spinner,
  type Task as UITask,
  type TaskFiltersType
} from '@agentforge/ui-components'
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from '../../../task-dataobject/hooks'
import styles from './TasksPage.module.css'

interface TasksPageProps {
  projectId: string
}

export function TasksPage({ projectId }: TasksPageProps) {
  // Use React Query hooks instead of manual state management
  const { data: tasks = [], isLoading, error: queryError } = useTasks({ where: { projectId } })
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [filters, setFilters] = useState<TaskFiltersType>({
    search: '',
    assignees: [],
    priorities: [],
    types: [],
  })

  // Derive selected task from tasks array (which is managed by React Query)
  // React Query's refetchQueries ensures this always has the latest data
  const selectedTask = useMemo(() => {
    if (!selectedTaskId) return null
    return tasks.find(t => t.id === selectedTaskId) || null
  }, [selectedTaskId, tasks])

  // Load filters from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(`taskFilters:${projectId}`)
    if (stored) {
      try {
        setFilters(JSON.parse(stored))
      } catch {
        // Ignore invalid stored data
      }
    }
  }, [projectId])

  // Save filters to localStorage
  useEffect(() => {
    localStorage.setItem(`taskFilters:${projectId}`, JSON.stringify(filters))
  }, [filters, projectId])

  // Filter tasks based on current filters
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        const matchesKey = task.key.toLowerCase().includes(searchLower)
        const matchesTitle = task.title.toLowerCase().includes(searchLower)
        const matchesDesc = task.description?.toLowerCase().includes(searchLower)
        if (!matchesKey && !matchesTitle && !matchesDesc) {
          return false
        }
      }

      // Assignee filter
      if (filters.assignees.length > 0) {
        if (!task.assignee || !filters.assignees.includes(task.assignee)) {
          return false
        }
      }

      // Priority filter
      if (filters.priorities.length > 0) {
        if (!task.priority || !filters.priorities.includes(task.priority)) {
          return false
        }
      }

      // Type filter
      if (filters.types.length > 0) {
        if (!task.type || !filters.types.includes(task.type)) {
          return false
        }
      }

      return true
    })
  }, [tasks, filters])

  const handleCreateTask = async (formData: any) => {
    try {
      const newTask = await createTask.mutateAsync({
        projectId,
        ...formData,
      })
      setShowCreateModal(false)

      // Show success toast (you can implement toast later)
      console.log(`Task ${newTask.key} created successfully`)
    } catch (err) {
      console.error('Failed to create task:', err)
      alert('Failed to create task. Please try again.')
    }
  }

  const handleTaskMove = async (taskId: string, newStatus: any) => {
    try {
      await updateTask.mutateAsync({ id: taskId, status: newStatus })
    } catch (err) {
      console.error('Failed to update task status:', err)
      alert('Failed to update task status. Please try again.')
    }
  }

  const handleTaskUpdate = async (taskId: string, updates: Partial<UITask>) => {
    try {
      await updateTask.mutateAsync({ id: taskId, ...updates })
      // No need to setSelectedTask - it will update automatically from React Query cache
    } catch (err) {
      console.error('Failed to update task:', err)
      alert('Failed to update task. Please try again.')
    }
  }

  const handleTaskDelete = async (task: UITask) => {
    try {
      await deleteTask.mutateAsync(task.id)
      setSelectedTaskId(null)
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

  if (queryError) {
    return (
      <div className={styles.error}>
        <p>Failed to load tasks. Please try again.</p>
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

      <div className={styles.filtersContainer}>
        <TaskFilters filters={filters} onChange={setFilters} />
      </div>

      <div className={styles.boardContainer}>
        <TaskBoard
          tasks={filteredTasks}
          onTaskClick={(task) => setSelectedTaskId(task.id)}
          onTaskMove={handleTaskMove}
          onTaskDelete={handleTaskDelete}
        />
      </div>

      <TaskDetailPanel
        task={selectedTask}
        onClose={() => setSelectedTaskId(null)}
        onUpdate={handleTaskUpdate}
        onDelete={handleTaskDelete}
        isUpdating={updateTask.isPending}
      />

      {showCreateModal && (
        <Modal onClose={() => setShowCreateModal(false)}>
          <div className={styles.modalContent}>
            <h2 className={styles.modalTitle}>Create New Task</h2>
            <TaskForm
              onSubmit={handleCreateTask}
              onCancel={() => setShowCreateModal(false)}
              submitLabel="Create Task"
              isLoading={createTask.isPending}
            />
          </div>
        </Modal>
      )}
    </div>
  )
}
