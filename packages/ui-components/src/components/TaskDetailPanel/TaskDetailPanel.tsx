import { useState } from 'react'
import type { Task } from '../../types'
import { TaskForm, type TaskFormData } from '../TaskForm/TaskForm'
import { PriorityBadge } from '../badges/PriorityBadge'
import { TypeBadge } from '../badges/TypeBadge'
import { AssigneeBadge } from '../badges/AssigneeBadge'
import { XIcon } from '../../icons/icons'
import styles from './TaskDetailPanel.module.css'

export interface TaskDetailPanelProps {
  task: Task | null
  onClose: () => void
  onUpdate?: (taskId: string, updates: Partial<Task>) => void
  onDelete?: (task: Task) => void
  isUpdating?: boolean
}

export function TaskDetailPanel({ task, onClose, onUpdate, onDelete, isUpdating = false }: TaskDetailPanelProps) {
  const [isEditing, setIsEditing] = useState(false)

  if (!task) {
    return null
  }

  const handleUpdate = (formData: TaskFormData) => {
    onUpdate?.(task.id, formData)
    setIsEditing(false)
  }

  const handleDelete = () => {
    if (confirm(`Delete task ${task.key}?\n\nThis action cannot be undone.`)) {
      onDelete?.(task)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date)
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h2 className={styles.key}>{task.key}</h2>
            {!isEditing && (
              <button
                className={styles.editButton}
                onClick={() => setIsEditing(true)}
                aria-label="Edit task"
              >
                Edit
              </button>
            )}
          </div>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close panel"
          >
            <XIcon width={20} height={20} />
          </button>
        </div>

        <div className={styles.content}>
          {isEditing ? (
            <TaskForm
              initialData={{
                title: task.title,
                description: task.description,
                type: task.type,
                priority: task.priority,
                assignee: task.assignee,
              }}
              onSubmit={handleUpdate}
              onCancel={() => setIsEditing(false)}
              submitLabel="Save Changes"
              isLoading={isUpdating}
            />
          ) : (
            <>
              <h1 className={styles.title}>{task.title}</h1>

              {task.description && (
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>Description</h3>
                  <p className={styles.description}>{task.description}</p>
                </div>
              )}

              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Details</h3>
                <div className={styles.detailsGrid}>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Status</span>
                    <span className={styles.detailValue}>
                      {task.status.replace('-', ' ').charAt(0).toUpperCase() + task.status.slice(1)}
                    </span>
                  </div>
                  
                  {task.priority && (
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Priority</span>
                      <span className={styles.detailValue}>
                        <PriorityBadge priority={task.priority} />
                      </span>
                    </div>
                  )}

                  {task.type && (
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Type</span>
                      <span className={styles.detailValue}>
                        <TypeBadge type={task.type} />
                      </span>
                    </div>
                  )}

                  {task.assignee && (
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Assignee</span>
                      <span className={styles.detailValue}>
                        <AssigneeBadge assignee={task.assignee} />
                      </span>
                    </div>
                  )}

                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Created</span>
                    <span className={styles.detailValue}>
                      {formatDate(task.createdAt)}
                    </span>
                  </div>

                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Updated</span>
                    <span className={styles.detailValue}>
                      {formatDate(task.updatedAt)}
                    </span>
                  </div>
                </div>
              </div>

              {onDelete && (
                <div className={styles.dangerZone}>
                  <button
                    className={styles.deleteButton}
                    onClick={handleDelete}
                  >
                    Delete Task
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
