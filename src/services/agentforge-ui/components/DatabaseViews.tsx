import { useState, useEffect, useMemo } from 'react'
import { MessageSquareIcon, TaskBoard, TaskForm, Modal } from '@agentforge/ui-components'
import type { Task, TaskStatus, TaskPriority, TaskType, AgentRole, TaskFormData } from '@agentforge/ui-components'
import { ChatMessageComponent } from '../../demo-ui/components/chat'
import type { ChatMessage, ActionStatus, ActionType } from '../../demo-ui/components/chat'
import type { DbSnapshot, DbTableName, Workload } from '../types'
import type { ViewMode } from './constants'
import { DeploymentListView } from './DeploymentViews'
import { api } from '../api'
import styles from '../ProjectViewer.module.css'

// --- Task Board View (for rich task display) ---

export function TaskBoardView({
  projectId,
  onTaskClick,
  onDataChange,
}: {
  projectId: string
  onTaskClick: (taskKey: string) => void
  onDataChange?: () => void
}) {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch tasks from API
  useEffect(() => {
    loadTasks()
  }, [projectId])

  const loadTasks = async () => {
    try {
      setLoading(true)
      const apiTasks = await api.tasks.list(projectId)
      const convertedTasks: Task[] = apiTasks.map(t => ({
        id: t.id,
        projectId: t.projectId,
        key: t.key,
        title: t.title,
        description: t.description,
        type: t.type as TaskType,
        priority: t.priority as TaskPriority,
        status: t.status as TaskStatus,
        assignee: t.assignee,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      }))
      setTasks(convertedTasks)
    } catch (err) {
      console.error('Failed to load tasks:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleTaskMove = async (taskId: string, newStatus: TaskStatus) => {
    // Optimistic update
    const previousTasks = [...tasks]
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t))

    try {
      await api.tasks.update(taskId, { status: newStatus })
      // Reload tasks after successful update to ensure consistency
      await loadTasks()
      // Trigger snapshot refresh so detail panels update
      onDataChange?.()
    } catch (err) {
      console.error('Failed to update task status:', err)
      alert('Failed to update task status. Please try again.')
      // Revert on error
      setTasks(previousTasks)
    }
  }

  const handleTaskClickInternal = (task: Task) => {
    onTaskClick(task.key)
  }

  const handleTaskDelete = async (task: Task) => {
    // Optimistic delete
    const previousTasks = [...tasks]
    setTasks(prev => prev.filter(t => t.id !== task.id))

    try {
      await api.tasks.delete(task.id)
    } catch (err) {
      console.error('Failed to delete task:', err)
      alert('Failed to delete task. Please try again.')
      // Revert on error
      setTasks(previousTasks)
    }
  }

  const handleCreateTask = async (formData: TaskFormData) => {
    try {
      setIsCreating(true)
      const createData = {
        projectId,
        title: formData.title,
        description: formData.description,
        type: formData.type,
        priority: formData.priority || 'medium',
        status: formData.status || 'todo',
        assignee: formData.assignee,
      }
      console.log('Creating task with data:', createData)
      const newTask = await api.tasks.create(createData)

      // Add to tasks for immediate UI update
      const task: Task = {
        id: newTask.id,
        projectId: newTask.projectId,
        key: newTask.key,
        title: newTask.title,
        description: newTask.description,
        type: newTask.type as TaskType,
        priority: newTask.priority as TaskPriority,
        status: newTask.status as TaskStatus,
        assignee: newTask.assignee,
        createdAt: newTask.createdAt,
        updatedAt: newTask.updatedAt,
      }
      setTasks(prev => [...prev, task])

      setShowCreateModal(false)
      console.log('Task created successfully')
    } catch (err) {
      console.error('Failed to create task:', err)
      alert('Failed to create task. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  if (loading) {
    return <div className={styles.emptyState}>Loading tasks...</div>
  }

  return (
    <div className={styles.taskBoardContainer}>
      <div className={styles.taskBoardHeader}>
        <button
          className={styles.newTaskButton}
          onClick={() => setShowCreateModal(true)}
        >
          + New Task
        </button>
      </div>
      <TaskBoard
        tasks={tasks}
        onTaskClick={handleTaskClickInternal}
        onTaskMove={handleTaskMove}
        onTaskDelete={handleTaskDelete}
      />

      {showCreateModal && (
        <Modal title="Create New Task" onClose={() => setShowCreateModal(false)}>
          <TaskForm
            onSubmit={handleCreateTask}
            onCancel={() => setShowCreateModal(false)}
            submitLabel="Create Task"
            isLoading={isCreating}
          />
        </Modal>
      )}
    </div>
  )
}

// --- Channel Messages View (for rich channel display) ---

export function ChannelMessagesView({
  snapshot,
  onChannelClick,
}: {
  snapshot: DbSnapshot
  onChannelClick: (channelId: string) => void
}) {
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null)

  const channels = snapshot.channels || []
  const messages = snapshot.messages || []

  // Default to first channel if none selected
  const activeChannelId = selectedChannelId || (channels.length > 0 ? String(channels[0].id) : null)

  const channelMessages = useMemo(() => {
    if (!activeChannelId) return []
    return messages
      .filter(msg => String(msg.channelId) === activeChannelId)
      .sort((a, b) => {
        const aTime = new Date(String(a.createdAt)).getTime()
        const bTime = new Date(String(b.createdAt)).getTime()
        return aTime - bTime
      })
      .map(msg => ({
        id: String(msg.id),
        type: (msg.type as ChatMessage['type']) || 'system',
        sender: msg.sender as AgentRole | undefined,
        senderName: msg.senderName ? String(msg.senderName) : undefined,
        content: String(msg.content || ''),
        timestamp: new Date(String(msg.createdAt)).getTime(),
        action: msg.actionType ? {
          type: msg.actionType as ActionType,
          status: (msg.actionStatus as ActionStatus) || 'success',
          label: String(msg.actionLabel || ''),
          subject: msg.actionSubject ? String(msg.actionSubject) : undefined,
        } : undefined,
      }))
  }, [activeChannelId, messages])

  const activeChannel = channels.find(ch => String(ch.id) === activeChannelId)

  return (
    <div className={styles.channelViewContainer}>
      <div className={styles.channelSidebar}>
        <div className={styles.channelSidebarHeader}>Channels</div>
        {channels.map(channel => (
          <button
            key={String(channel.id)}
            className={`${styles.channelItem} ${String(channel.id) === activeChannelId ? styles.channelItemActive : ''}`}
            onClick={() => {
              setSelectedChannelId(String(channel.id))
              onChannelClick(String(channel.id))
            }}
          >
            <MessageSquareIcon className={styles.channelIcon} />
            <span>{String(channel.name)}</span>
          </button>
        ))}
      </div>
      <div className={styles.channelMessages}>
        <div className={styles.channelHeader}>
          <span className={styles.channelHash}>#</span>
          <span className={styles.channelTitle}>{activeChannel ? String(activeChannel.name) : 'Select a channel'}</span>
        </div>
        <div className={styles.messagesContainer}>
          {channelMessages.length === 0 ? (
            <div className={styles.emptyState}>No messages in this channel</div>
          ) : (
            channelMessages.map(msg => (
              <ChatMessageComponent key={msg.id} message={msg} />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

// --- Database Table View ---

export function DatabaseTableView({
  projectId,
  snapshot,
  tableName,
  viewMode,
  onRowClick,
  onWorkloadClick,
  onDataChange,
}: {
  projectId: string
  snapshot: DbSnapshot
  tableName: DbTableName
  viewMode: ViewMode
  onRowClick: (record: Record<string, unknown>, key: string) => void
  onWorkloadClick?: (workload: Workload) => void
  onDataChange?: () => void
}) {
  const [deleteConfirmRow, setDeleteConfirmRow] = useState<Record<string, unknown> | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Cast rows to Record<string, unknown>[] for generic table handling
  const rawRows = snapshot[tableName] || []
  const rows = rawRows as Record<string, unknown>[]

  const columns = useMemo(() => {
    if (rows.length === 0) return []
    return Object.keys(rows[0])
  }, [rows])

  const formatCell = (value: unknown): string => {
    if (value === null || value === undefined) return ''
    if (typeof value === 'string') {
      return value.length > 50 ? value.slice(0, 50) + '...' : value
    }
    return String(value)
  }

  // Get a unique key for a row (use 'key', 'id', or index)
  const getRowKey = (row: Record<string, unknown>, index: number): string => {
    if (row.key !== undefined) return String(row.key)
    if (row.id !== undefined) return String(row.id)
    return String(index)
  }

  // Show rich view for tasks when in 'view' mode
  if (viewMode === 'view' && tableName === 'tasks') {
    const handleTaskClick = (taskKey: string) => {
      // Find task in the snapshot to get its record
      const row = rows.find(r => String(r.key) === taskKey)
      if (row) onRowClick(row, taskKey)
    }

    return (
      <TaskBoardView
        projectId={projectId}
        onTaskClick={handleTaskClick}
        onDataChange={onDataChange}
      />
    )
  }

  // Show rich view for channels when in 'view' mode
  if (viewMode === 'view' && tableName === 'channels') {
    return (
      <ChannelMessagesView
        snapshot={snapshot}
        onChannelClick={() => {}}
      />
    )
  }

  // Show rich view for deployments when in 'view' mode
  if (viewMode === 'view' && tableName === 'deployments') {
    const handleWorkloadClick = (workload: Workload) => {
      if (onWorkloadClick) {
        onWorkloadClick(workload)
      } else {
        onRowClick(workload as unknown as Record<string, unknown>, workload.id)
      }
    }

    return (
      <DeploymentListView
        snapshot={snapshot}
        onWorkloadClick={handleWorkloadClick}
      />
    )
  }

  const handleDeleteClick = (e: React.MouseEvent, row: Record<string, unknown>) => {
    e.stopPropagation() // Prevent row click
    setDeleteConfirmRow(row)
  }

  const handleConfirmDelete = async () => {
    if (!deleteConfirmRow) return

    const rowId = deleteConfirmRow.id ? String(deleteConfirmRow.id) : deleteConfirmRow.key ? String(deleteConfirmRow.key) : null
    if (!rowId) {
      alert('Cannot delete: no ID found')
      setDeleteConfirmRow(null)
      return
    }

    try {
      setIsDeleting(true)
      // Call API to delete based on table name
      if (tableName === 'tasks') {
        await api.tasks.delete(rowId)
      }
      // TODO: Add delete handlers for other table types as needed

      setDeleteConfirmRow(null)
      // Notify parent to refresh data
      if (onDataChange) {
        onDataChange()
      }
    } catch (err) {
      console.error('Failed to delete:', err)
      alert('Failed to delete item. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className={styles.dbViewContainer}>
      <div className={styles.dbTablePane}>
        {rows.length > 0 ? (
          <div className={styles.dataGrid}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  {columns.map(col => (
                    <th key={col}>{col}</th>
                  ))}
                  <th className={styles.actionsColumn}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => {
                  const rowKey = getRowKey(row, i)
                  return (
                    <tr
                      key={rowKey}
                      onClick={() => onRowClick(row, rowKey)}
                    >
                      {columns.map(col => (
                        <td key={col}>{formatCell(row[col])}</td>
                      ))}
                      <td className={styles.actionsCell}>
                        <button
                          className={styles.deleteButton}
                          onClick={(e) => handleDeleteClick(e, row)}
                          title="Delete"
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={styles.emptyState}>No rows in this table</div>
        )}
      </div>

      {deleteConfirmRow && (
        <Modal title="Confirm Delete" onClose={() => setDeleteConfirmRow(null)}>
          <div
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isDeleting) {
                handleConfirmDelete()
              }
            }}
          >
            <p className={styles.deleteConfirmMessage}>
              Are you sure you want to delete "
              {deleteConfirmRow.title
                ? String(deleteConfirmRow.title)
                : deleteConfirmRow.name
                ? String(deleteConfirmRow.name)
                : deleteConfirmRow.key
                ? String(deleteConfirmRow.key)
                : 'this item'}"?
            </p>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={() => setDeleteConfirmRow(null)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.deleteConfirmButton}
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                autoFocus
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
