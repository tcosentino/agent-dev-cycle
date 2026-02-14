import { useState, FormEvent } from 'react'
import type { TaskType, TaskPriority, TaskStatus } from '../../types'
import { TASK_TYPES, TASK_PRIORITIES, TASK_STATUSES, TASK_ASSIGNEES } from '../../domain/task/constants'
import styles from './TaskForm.module.css'

export interface TaskFormData {
  title: string
  description?: string
  type?: TaskType
  priority?: TaskPriority
  status?: TaskStatus
  assignee?: string
}

export interface TaskFormProps {
  initialData?: Partial<TaskFormData>
  onSubmit: (data: TaskFormData) => void
  onCancel: () => void
  submitLabel?: string
  isLoading?: boolean
}

export function TaskForm({ 
  initialData = {}, 
  onSubmit, 
  onCancel, 
  submitLabel = 'Create Task',
  isLoading = false 
}: TaskFormProps) {
  const [formData, setFormData] = useState<TaskFormData>({
    title: initialData.title || '',
    description: initialData.description || '',
    type: initialData.type,
    priority: initialData.priority || 'medium',
    status: initialData.status || 'todo',
    assignee: initialData.assignee,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    } else if (formData.title.length > 200) {
      newErrors.title = 'Title must be 200 characters or less'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    
    if (!validate()) {
      return
    }

    onSubmit(formData)
  }

  const handleChange = (field: keyof TaskFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.field}>
        <label htmlFor="title" className={styles.label}>
          Title <span className={styles.required}>*</span>
        </label>
        <input
          id="title"
          type="text"
          className={`${styles.input} ${errors.title ? styles.inputError : ''}`}
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
          placeholder="Enter task title..."
          maxLength={200}
          disabled={isLoading}
          autoFocus
        />
        {errors.title && <div className={styles.error}>{errors.title}</div>}
        <div className={styles.charCount}>
          {formData.title.length}/200
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor="description" className={styles.label}>
          Description
        </label>
        <textarea
          id="description"
          className={styles.textarea}
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Add a description..."
          rows={4}
          disabled={isLoading}
        />
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label htmlFor="type" className={styles.label}>
            Type
          </label>
          <select
            id="type"
            className={styles.select}
            value={formData.type || ''}
            onChange={(e) => handleChange('type', e.target.value)}
            disabled={isLoading}
          >
            <option value="">None</option>
            {TASK_TYPES.map(type => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="priority" className={styles.label}>
            Priority
          </label>
          <select
            id="priority"
            className={styles.select}
            value={formData.priority || 'medium'}
            onChange={(e) => handleChange('priority', e.target.value)}
            disabled={isLoading}
          >
            {TASK_PRIORITIES.map(priority => (
              <option key={priority} value={priority}>
                {priority.charAt(0).toUpperCase() + priority.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label htmlFor="status" className={styles.label}>
            Status
          </label>
          <select
            id="status"
            className={styles.select}
            value={formData.status || 'todo'}
            onChange={(e) => handleChange('status', e.target.value)}
            disabled={isLoading}
          >
            {TASK_STATUSES.map(status => (
              <option key={status} value={status}>
                {status === 'in-progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="assignee" className={styles.label}>
            Assignee
          </label>
          <select
            id="assignee"
            className={styles.select}
            value={formData.assignee || ''}
            onChange={(e) => handleChange('assignee', e.target.value)}
            disabled={isLoading}
          >
            <option value="">Unassigned</option>
            {TASK_ASSIGNEES.map(assignee => (
              <option key={assignee} value={assignee}>
                {assignee.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.cancelButton}
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className={styles.submitButton}
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  )
}
