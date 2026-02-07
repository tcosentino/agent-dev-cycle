import { PriorityBadge, TypeBadge, AssigneeBadge } from '@agentforge/ui-components'
import type { TaskStatus, TaskPriority, TaskType, AgentRole } from '../../demo-ui/components/task-board/types'
import type { DbTableName, Workload } from '../types'
import { TABLE_LABELS, TABLES_WITH_DETAIL_VIEW } from './constants'
import type { RecordViewMode } from './constants'
import { WorkloadDetailView } from './DeploymentViews'
import styles from '../ProjectViewer.module.css'

// --- Nice Task Detail View ---

export function TaskDetailView({ record }: { record: Record<string, unknown> }) {
  const task = {
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

  return (
    <div className={styles.taskDetailView}>
      <div className={styles.taskDetailHeader}>
        <span className={styles.taskDetailKey}>{task.key}</span>
        <span className={styles.taskDetailStatus}>{statusLabels[task.status]}</span>
      </div>
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
}: {
  record: Record<string, unknown>
  tableName: DbTableName | string
  viewMode: RecordViewMode
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
    return <TaskDetailView record={record} />
  }

  if (viewMode === 'view' && tableName === 'workloads') {
    return <WorkloadDetailView workload={record as unknown as Workload} />
  }

  return <RawRecordView record={record} tableName={tableNameStr} />
}
