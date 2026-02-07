import { useState, useMemo } from 'react'
import { MessageSquareIcon } from '@agentforge/ui-components'
import { TaskBoard } from '../../demo-ui/components/task-board/TaskBoard'
import type { Task, TaskStatus, TaskPriority, TaskType, AgentRole } from '../../demo-ui/components/task-board/types'
import { ChatMessageComponent } from '../../demo-ui/components/chat'
import type { ChatMessage, ActionStatus, ActionType } from '../../demo-ui/components/chat'
import type { DbSnapshot, DbTableName, Workload } from '../types'
import type { ViewMode } from './constants'
import { DeploymentListView } from './DeploymentViews'
import styles from '../ProjectViewer.module.css'

// --- Task Board View (for rich task display) ---

export function TaskBoardView({
  snapshot,
  onTaskClick,
}: {
  snapshot: DbSnapshot
  onTaskClick: (taskKey: string) => void
}) {
  const tasks = useMemo(() => {
    return (snapshot.tasks || []).map(row => ({
      key: String(row.key || ''),
      title: String(row.title || ''),
      type: (row.type as TaskType) || 'backend',
      priority: (row.priority as TaskPriority) || 'medium',
      status: (row.status as TaskStatus) || 'todo',
      assignee: row.assignee as Task['assignee'],
    }))
  }, [snapshot.tasks])

  const project = snapshot.projects?.[0]
  const projectName = project ? String(project.name || 'Project') : 'Project'
  const projectKey = project ? String(project.key || 'PRJ') : 'PRJ'

  return (
    <div className={styles.taskBoardContainer}>
      <TaskBoard
        projectName={projectName}
        projectKey={projectKey}
        phase="Building"
        tasks={tasks}
        onTaskClick={onTaskClick}
        showHeader={false}
      />
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
  snapshot,
  tableName,
  viewMode,
  onRowClick,
  onWorkloadClick,
}: {
  snapshot: DbSnapshot
  tableName: DbTableName
  viewMode: ViewMode
  onRowClick: (record: Record<string, unknown>, key: string) => void
  onWorkloadClick?: (workload: Workload) => void
}) {
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
      const row = rows.find(r => String(r.key) === taskKey)
      if (row) onRowClick(row, taskKey)
    }

    return (
      <TaskBoardView
        snapshot={snapshot}
        onTaskClick={handleTaskClick}
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
    </div>
  )
}
