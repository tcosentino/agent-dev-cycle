import {
  ListPanel,
  type SidebarItem,
  StatusIndicator,
  FileDocumentIcon,
  GlobeIcon,
  LayersIcon,
  BlockIcon,
  LinkIcon,
  BookOpenIcon
} from '@agentforge/ui-components'
import type { KnowledgeBaseProps, KnowledgeCategory, KnowledgeEntry } from './types'
import type { AgentRole } from '../task-board/types'
import styles from './KnowledgeBase.module.css'

const AGENT_LABELS: Record<string, string> = {
  pm: 'PM',
  engineer: 'Engineer',
  qa: 'QA',
  lead: 'Tech Lead'
}

const CATEGORY_LABELS: Record<KnowledgeCategory, string> = {
  codebase: 'Codebase',
  external: 'External Docs',
  decision: 'Decisions',
  blocker: 'Blockers'
}

const CATEGORY_ICONS: Record<KnowledgeCategory, typeof FileDocumentIcon> = {
  codebase: FileDocumentIcon,
  external: GlobeIcon,
  decision: LayersIcon,
  blocker: BlockIcon
}

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

function EntryCard({ entry, onClick }: { entry: KnowledgeEntry; onClick?: () => void }) {
  const CategoryIcon = CATEGORY_ICONS[entry.category]

  return (
    <div className={styles.entryCard} onClick={onClick}>
      <div className={styles.entryHeader}>
        <span className={`${styles.entryCategoryBadge} ${styles[entry.category]}`}>
          <CategoryIcon className={styles.categoryIcon} />
          {CATEGORY_LABELS[entry.category]}
        </span>
        <span className={styles.entryTitle}>{entry.title}</span>
      </div>
      <p className={styles.entrySummary}>{entry.summary}</p>
      <div className={styles.entryMeta}>
        <span className={styles.entryAgent}>
          <StatusIndicator role={entry.recordedBy as AgentRole} size="xs" />
          {AGENT_LABELS[entry.recordedBy]}
        </span>
        <span>{formatTimestamp(entry.timestamp)}</span>
        {entry.source && (
          <span className={styles.entrySource}>
            <LinkIcon className={styles.entrySourceIcon} />
            source
          </span>
        )}
        {entry.tags && entry.tags.length > 0 && (
          <div className={styles.entryTags}>
            {entry.tags.slice(0, 3).map(tag => (
              <span key={tag} className={styles.entryTag}>{tag}</span>
            ))}
          </div>
        )}
      </div>
      {entry.relatedTasks && entry.relatedTasks.length > 0 && (
        <div className={styles.entryRelatedTasks}>
          {entry.relatedTasks.map(taskKey => (
            <span key={taskKey} className={styles.taskLink}>{taskKey}</span>
          ))}
        </div>
      )}
    </div>
  )
}

function SearchInput({
  value,
  onChange,
  placeholder
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <input
      type="text"
      className={styles.searchInput}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

export function KnowledgeBase({
  state,
  onCategorySelect,
  onSearch,
  onEntryClick
}: KnowledgeBaseProps) {
  const { entries, activeCategory, searchQuery } = state

  // Count entries per category
  const categoryCounts: Record<KnowledgeCategory, number> = {
    codebase: entries.filter(e => e.category === 'codebase').length,
    external: entries.filter(e => e.category === 'external').length,
    decision: entries.filter(e => e.category === 'decision').length,
    blocker: entries.filter(e => e.category === 'blocker').length
  }

  // Filter entries
  const filteredEntries = entries.filter(entry => {
    if (activeCategory && entry.category !== activeCategory) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return (
        entry.title.toLowerCase().includes(q) ||
        entry.summary.toLowerCase().includes(q) ||
        entry.tags?.some(t => t.toLowerCase().includes(q))
      )
    }
    return true
  })

  const categories: KnowledgeCategory[] = ['codebase', 'external', 'decision', 'blocker']

  const sidebarItems: SidebarItem<KnowledgeCategory>[] = categories.map(category => {
    const Icon = CATEGORY_ICONS[category]
    return {
      id: category,
      label: CATEGORY_LABELS[category],
      icon: <Icon className={`${styles.categoryIcon} ${styles[category]}`} />,
      count: categoryCounts[category]
    }
  })

  return (
    <ListPanel<KnowledgeCategory>
      sidebarTitle="Categories"
      sidebarItems={sidebarItems}
      activeItemId={activeCategory}
      onItemSelect={onCategorySelect}
      showAllOption
      allOptionLabel="All"
      allOptionCount={entries.length}
      headerTitle={activeCategory ? CATEGORY_LABELS[activeCategory] : 'All Research'}
      headerContent={
        <SearchInput
          value={searchQuery || ''}
          onChange={(value) => onSearch?.(value)}
          placeholder="Search knowledge base..."
        />
      }
      emptyState={
        <div className={styles.emptyState}>
          <BookOpenIcon className={styles.emptyIcon} />
          <span>No research recorded yet</span>
        </div>
      }
    >
      {filteredEntries.map(entry => (
        <EntryCard
          key={entry.id}
          entry={entry}
          onClick={() => onEntryClick?.(entry)}
        />
      ))}
    </ListPanel>
  )
}
