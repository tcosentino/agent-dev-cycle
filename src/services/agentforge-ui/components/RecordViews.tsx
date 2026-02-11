import { useState, useEffect } from 'react'
import {
  PriorityBadge,
  TypeBadge,
  AssigneeBadge,
  CommentThread,
  TaskForm,
  Modal,
  XIcon
} from '@agentforge/ui-components'
import type { Comment, TaskFormData } from '@agentforge/ui-components'
import type { TaskStatus, TaskPriority, TaskType, AgentRole } from '../../demo-ui/components/task-board/types'
import type { DbTableName, Workload } from '../types'
import { TABLE_LABELS, TABLES_WITH_DETAIL_VIEW } from './constants'
import type { RecordViewMode } from './constants'
import { WorkloadDetailView } from './DeploymentViews'
import { api } from '../api'
import styles from '../ProjectViewer.module.css'

// --- Nice Task Detail View ---

export function TaskDetailView({
  record,
  currentUserId,
  onUpdate,
  onDelete,
}: {
  record: Record<string, unknown>
  currentUserId?: string
  onUpdate?: (updates: Record<string, unknown>) => void
  onDelete?: () => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoadingComments, setIsLoadingComments] = useState(true)

  const taskId = String(record.id || '')

  const task = {
    id: taskId,
    key: String(record.key || ''),
    title: String(record.title || ''),
    description: String(record.description || ''),
    type: (record.type as TaskType) || 'backend',
    priority: (record.priority as TaskPriority) || 'medium',
    status: (record.status as TaskStatus) || 'todo',
    assignee: record.assignee as AgentRole | undefined,
    createdAt: record.createdAt ? String(record.createdAt) : undefined,
    updatedAt: record.updatedAt ? String(record.updatedAt) : undefined,
  }

  const statusLabels: Record<TaskStatus, string> = {
    'todo': 'To Do',
    'in-progress': 'In Progress',
    'done': 'Done',
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null
    try {
      return new Date(dateStr).toLocaleString()
    } catch {
      return dateStr
    }
  }

  // Load comments
  useEffect(() => {
    const loadComments = async () => {
      try {
        setIsLoadingComments(true)
        const apiComments = await api.taskComments.list(taskId)
        setComments(apiComments.map(c => ({
          id: c.id,
          content: c.content,
          authorName: c.authorName,
          authorEmail: c.authorEmail,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
          userId: c.userId,
        })))
      } catch (err) {
        console.error('Failed to load comments:', err)
      } finally {
        setIsLoadingComments(false)
      }
    }

    if (taskId) {
      loadComments()
    }
  }, [taskId])

  const handleUpdate = async (formData: TaskFormData) => {
    try {
      setIsUpdating(true)
      const updated = await api.tasks.update(taskId, formData)
      onUpdate?.(updated)
      setIsEditing(false)
    } catch (err) {
      console.error('Failed to update task:', err)
      alert('Failed to update task. Please try again.')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = () => {
    if (confirm(`Delete task ${task.key}?\n\nThis action cannot be undone.`)) {
      onDelete?.()
    }
  }

  const handleAddComment = async (content: string) => {
    if (!currentUserId) {
      alert('You must be logged in to comment')
      throw new Error('User not authenticated')
    }

    try {
      const newComment = await api.taskComments.create({
        taskId,
        userId: currentUserId,
        content
      })
      setComments(prev => [...prev, {
        id: newComment.id,
        content: newComment.content,
        authorName: newComment.authorName,
        authorEmail: newComment.authorEmail,
        createdAt: newComment.createdAt,
        updatedAt: newComment.updatedAt,
        userId: newComment.userId,
      }])
    } catch (err) {
      console.error('Failed to add comment:', err)
      throw err // Re-throw so CommentThread can handle it
    }
  }

  const handleEditComment = async (id: string, content: string) => {
    try {
      const updated = await api.taskComments.update(id, { content })
      setComments(prev => prev.map(c => c.id === id ? {
        ...c,
        content: updated.content,
        updatedAt: updated.updatedAt,
      } : c))
    } catch (err) {
      console.error('Failed to edit comment:', err)
      throw err
    }
  }

  const handleDeleteComment = async (id: string) => {
    try {
      await api.taskComments.delete(id)
      setComments(prev => prev.filter(c => c.id !== id))
    } catch (err) {
      console.error('Failed to delete comment:', err)
      throw err
    }
  }

  return (
    <div className={styles.taskDetailView}>
      <div className={styles.taskDetailHeader}>
        <div className={styles.taskDetailHeaderLeft}>
          <span className={styles.taskDetailKey}>{task.key}</span>
          {!isEditing && (
            <button
              className={styles.editButton}
              onClick={() => setIsEditing(true)}
            >
              Edit
            </button>
          )}
        </div>
        <span className={styles.taskDetailStatus}>{statusLabels[task.status]}</span>
      </div>

      {isEditing ? (
        <div className={styles.editFormContainer}>
          <TaskForm
            initialData={{
              title: task.title,
              description: task.description,
              type: task.type,
              priority: task.priority,
              status: task.status,
              assignee: task.assignee,
            }}
            onSubmit={handleUpdate}
            onCancel={() => setIsEditing(false)}
            submitLabel="Save Changes"
            isLoading={isUpdating}
          />
        </div>
      ) : (
        <>
          <h2 className={styles.taskDetailTitle}>{task.title}</h2>
          {task.description && (
            <p className={styles.taskDetailDescription}>{task.description}</p>
          )}
          <div className={styles.taskDetailMeta}>
            <div className={styles.taskDetailMetaItem}>
              <span className={styles.taskDetailMetaLabel}>Type</span>
              <TypeBadge type={task.type} />
            </div>
            <div className={styles.taskDetailMetaItem}>
              <span className={styles.taskDetailMetaLabel}>Priority</span>
              <PriorityBadge priority={task.priority} />
            </div>
            {task.assignee && (
              <div className={styles.taskDetailMetaItem}>
                <span className={styles.taskDetailMetaLabel}>Assignee</span>
                <AssigneeBadge role={task.assignee} />
              </div>
            )}
          </div>
          {(task.createdAt || task.updatedAt) && (
            <div className={styles.taskDetailTimestamps}>
              {task.createdAt && (
                <div className={styles.taskDetailTimestamp}>
                  <span className={styles.taskDetailMetaLabel}>Created</span>
                  <span>{formatDate(task.createdAt)}</span>
                </div>
              )}
              {task.updatedAt && (
                <div className={styles.taskDetailTimestamp}>
                  <span className={styles.taskDetailMetaLabel}>Updated</span>
                  <span>{formatDate(task.updatedAt)}</span>
                </div>
              )}
            </div>
          )}

          <CommentThread
            comments={comments}
            currentUserId={currentUserId}
            onAddComment={handleAddComment}
            onEditComment={handleEditComment}
            onDeleteComment={handleDeleteComment}
            isLoading={isLoadingComments}
          />

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
  )
}

// --- Raw Record View ---

export function RawRecordView({ record, tableName }: { record: Record<string, unknown>; tableName: string }) {
  const formatValue = (value: unknown): string => {
    if (value === null) return 'null'
    if (value === undefined) return 'undefined'
    if (typeof value === 'object') return JSON.stringify(value, null, 2)
    return String(value)
  }

  return (
    <div className={styles.recordView}>
      <div className={styles.recordHeader}>{tableName} Record</div>
      <div className={styles.recordFields}>
        {Object.entries(record).map(([key, value]) => (
          <div key={key} className={styles.detailField}>
            <div className={styles.detailLabel}>{key}</div>
            <div className={styles.detailValue}>
              {typeof value === 'object' && value !== null ? (
                <pre className={styles.detailValueCode}>{formatValue(value)}</pre>
              ) : (
                formatValue(value)
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// --- Record Detail View with Toggle ---

export function RecordDetailView({
  record,
  tableName,
  viewMode,
  currentUserId,
  onUpdate,
  onDelete,
}: {
  record: Record<string, unknown>
  tableName: DbTableName | string
  viewMode: RecordViewMode
  currentUserId?: string
  onUpdate?: (updates: Record<string, unknown>) => void
  onDelete?: () => void
}) {
  const tableNameStr = typeof tableName === 'string' && tableName in TABLE_LABELS
    ? TABLE_LABELS[tableName as DbTableName]
    : String(tableName)

  const hasNiceView = typeof tableName === 'string' && TABLES_WITH_DETAIL_VIEW.includes(tableName as DbTableName)

  // If no nice view available, just show raw
  if (!hasNiceView) {
    return <RawRecordView record={record} tableName={tableNameStr} />
  }

  if (viewMode === 'view' && tableName === 'tasks') {
    return (
      <TaskDetailView
        record={record}
        currentUserId={currentUserId}
        onUpdate={onUpdate}
        onDelete={onDelete}
      />
    )
  }

  if (viewMode === 'view' && tableName === 'workloads') {
    return <WorkloadDetailView workload={record as unknown as Workload} />
  }

  return <RawRecordView record={record} tableName={tableNameStr} />
}
