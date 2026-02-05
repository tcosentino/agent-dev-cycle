export type FileCategory =
  | 'config'
  | 'briefing'
  | 'prompt'
  | 'memory'
  | 'session'
  | 'state'
  | 'source'
  | 'other'

export interface FileNode {
  name: string
  path: string
  type: 'file' | 'folder'
  category: FileCategory
  children?: FileNode[]
  extension?: string
}

export type ProjectData = Record<string, Record<string, string>>

export interface DbSnapshot {
  projects: Record<string, unknown>[]
  tasks: Record<string, unknown>[]
  channels: Record<string, unknown>[]
  messages: Record<string, unknown>[]
  agentStatus: Record<string, unknown>[]
  sessions: Record<string, unknown>[]
}

export type ProjectDbData = Record<string, DbSnapshot>

export type DbTableName = keyof DbSnapshot
