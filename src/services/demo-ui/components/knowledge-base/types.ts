import type { AgentRole } from '../task-board/types'

export type KnowledgeCategory = 'codebase' | 'external' | 'decision' | 'blocker'

export interface KnowledgeEntry {
  id: string
  category: KnowledgeCategory
  title: string
  summary: string
  details?: string
  source?: string // URL or file path
  recordedBy: AgentRole
  timestamp: number
  tags?: string[]
  relatedTasks?: string[] // Task keys like BAAP-1
}

export interface KnowledgeBaseState {
  entries: KnowledgeEntry[]
  activeCategory?: KnowledgeCategory
  searchQuery?: string
}

export interface KnowledgeBaseProps {
  state: KnowledgeBaseState
  onCategorySelect?: (category: KnowledgeCategory | undefined) => void
  onSearch?: (query: string) => void
  onEntryClick?: (entry: KnowledgeEntry) => void
}