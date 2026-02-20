import type { ReactNode } from 'react'
import type { DbTableName, ServiceMetadata } from '../types'

export type TabType = 'file' | 'table' | 'record' | 'service' | 'agentSession' | 'agent'
export type PaneId = 'left' | 'right'
export type ViewMode = 'table' | 'view'
export type RecordViewMode = 'view' | 'raw'

export interface OpenTab {
  id: string
  type: TabType
  path: string // file path, table name, record id (table:key), service path, or agent id
  label: string
  icon?: ReactNode
  pane: PaneId
  // For record tabs, store the record data
  record?: Record<string, unknown>
  tableName?: DbTableName
  // For service tabs
  serviceMetadata?: ServiceMetadata
  serviceReadme?: string
  // For agent tabs and agentSession tabs (to construct session URLs)
  agentId?: string
  // Initial sub-tab to show when panel is first opened via URL deep link
  initialPanelTab?: string
}

export const TABLE_NAMES: DbTableName[] = ['tasks', 'channels', 'messages', 'agentStatus', 'sessions', 'deployments', 'workloads']

export const TABLE_LABELS: Record<DbTableName, string> = {
  projects: 'Projects',
  tasks: 'Tasks',
  channels: 'Channels',
  messages: 'Messages',
  agentStatus: 'Agent Status',
  sessions: 'Sessions',
  deployments: 'Deployments',
  workloads: 'Workloads',
}

// Tables that have a rich view mode
export const TABLES_WITH_VIEW: DbTableName[] = ['tasks', 'channels', 'deployments']

// Tables that have a nice detail view
export const TABLES_WITH_DETAIL_VIEW: DbTableName[] = ['tasks', 'workloads']
