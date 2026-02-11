import { useState } from 'react'
import {
  PriorityBadge,
  TypeBadge,
  AssigneeBadge,
  CommentThread,
  TaskForm,
} from '@agentforge/ui-components'
import type { Comment, TaskFormData } from '@agentforge/ui-components'
import type { TaskStatus, TaskPriority, TaskType, AgentRole } from '../../demo-ui/components/task-board/types'
import { useTask, useUpdateTask, useDeleteTask } from '../../../services/task-dataobject/hooks'
import {
  useTaskComments,
  useCreateTaskComment,
  useUpdateTaskComment,
  useDeleteTaskComment,
} from '../../../services/task-comment-dataobject/hooks'
import styles from '../ProjectViewer.module.css'

export function TaskDetailViewWithHooks({
  taskId,
  currentUserId,
  onUpdate,
  onDelete,
}: {
  taskId: string
  currentUserId?: string
  onUpdate?: (updates: Record<string, unknown>) => void
  onDelete?: () => void
}) {
  const [isEditing, setIsEditing] = useState(false)

  // Use generated hooks!
  const { data: record, isLoading: isLoadingTask } = useTask(taskId)
  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()

  const { data: apiComments = [], isLoading: isLoadingComments } = useTaskComments({
    where: { taskId },
  })
  const createComment = useCreateTaskComment()
  const updateComment = useUpdateTaskComment()
  const deleteComment = useDeleteTaskComment()

  if (isLoadingTask) {
    return (
      <div className={styles.emptyState}>
        <div>Loading task...</div>
      </div>
    )
  }

  if (!record) {
    return <div className={styles.emptyState}>Task not found</div>
  }

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

  const comments: Comment[] = apiComments.map(c => ({
    id: c.id,
    content: c.content,
    authorName: c.authorName,
    authorEmail: c.authorEmail,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    userId: c.userId,
  }))

  const handleUpdate = async (formData: TaskFormData) => {
    try {
      await updateTask.mutateAsync({ id: taskId, ...formData })
      onUpdate?.(formData)
      setIsEditing(false)
    } catch (err) {
      console.error('Failed to update task:', err)
      alert('Failed to update task. Please try again.')
    }
  }

  const handleDelete = async () => {
    if (confirm(`Delete task ${task.key}?\n\nThis action cannot be undone.`)) {
      try {
        await deleteTask.mutateAsync(taskId)
        onDelete?.()
      } catch (err) {
        console.error('Failed to delete task:', err)
        alert('Failed to delete task. Please try again.')
      }
    }
  }

  const handleAddComment = async (content: string) => {
    if (!currentUserId) {
      alert('You must be logged in to comment')
      throw new Error('User not authenticated')
    }

    await createComment.mutateAsync({
      taskId,
      userId: currentUserId,
      content,
    })
    // React Query automatically refetches comments!
  }

  const handleEditComment = async (id: string, content: string) => {
    await updateComment.mutateAsync({ id, content })
    // React Query automatically updates the cache!
  }

  const handleDeleteComment = async (id: string) => {
    await deleteComment.mutateAsync(id)
    // React Query automatically removes from cache!
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
            isLoading={updateTask.isLoading}
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
