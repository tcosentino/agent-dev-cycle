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
