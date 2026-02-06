import { useState, useMemo, useCallback, useRef } from 'react'
import type { ReactNode } from 'react'
import {
  ChevronRightIcon,
  ChevronDownIcon,
  FolderIcon,
  FolderOpenIcon,
  FileDocumentIcon,
  SettingsIcon,
  BookOpenIcon,
  ClockIcon,
  CodeIcon,
  DatabaseIcon,
  TableIcon,
  KanbanIcon,
} from '../shared/icons'
import { TaskBoard } from '../task-board/TaskBoard'
import type { Task, TaskStatus, TaskPriority, TaskType, AgentRole } from '../task-board/types'
import { PriorityBadge, TypeBadge, AssigneeBadge } from '../shared/badges'
import { TabbedPane, type Tab } from '../shared/TabbedPane'
import type { FileNode, FileCategory, ProjectData, ProjectDbData, DbSnapshot, DbTableName } from './types'
import styles from './ProjectViewer.module.css'

// --- Utilities ---

function categorizeFile(path: string): FileCategory {
  if (path.startsWith('.agentforge/')) return 'config'
  if (path === 'PROJECT.md' || path === 'ARCHITECTURE.md') return 'briefing'
  if (path.startsWith('prompts/')) return 'prompt'
  if (path.startsWith('memory/')) return 'memory'
  if (path.startsWith('sessions/')) return 'session'
  if (path.startsWith('state/')) return 'state'
  if (path.startsWith('src/')) return 'source'
  return 'other'
}

function buildFileTree(files: Record<string, string>): FileNode[] {
  const root: FileNode[] = []

  for (const filePath of Object.keys(files).sort()) {
    const parts = filePath.split('/')
    let current = root
    let builtPath = ''

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      builtPath = builtPath ? `${builtPath}/${part}` : part
      const isFile = i === parts.length - 1

      let existing = current.find(n => n.name === part)
      if (!existing) {
        existing = {
          name: part,
          path: builtPath,
          type: isFile ? 'file' : 'folder',
          category: categorizeFile(builtPath),
          ...(isFile
            ? { extension: part.includes('.') ? part.split('.').pop() : undefined }
            : { children: [] }),
        }
        current.push(existing)
      }
      if (!isFile && existing.children) {
        current = existing.children
      }
    }
  }

  const sortNodes = (nodes: FileNode[]) => {
    nodes.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1
      return a.name.localeCompare(b.name)
    })
    nodes.forEach(n => {
      if (n.children) sortNodes(n.children)
    })
  }
  sortNodes(root)
  return root
}

function getDefaultExpanded(tree: FileNode[]): Set<string> {
  return new Set(tree.filter(n => n.type === 'folder').map(n => n.path))
}

const categoryClass: Record<FileCategory, string> = {
  config: styles.catConfig,
  briefing: styles.catBriefing,
  prompt: styles.catPrompt,
  memory: styles.catMemory,
  session: styles.catSession,
  state: styles.catState,
  source: styles.catSource,
  other: styles.catOther,
}

// --- Simple Markdown to HTML ---

function markdownToHtml(md: string): string {
  // Strip YAML frontmatter blocks
  let text = md.replace(/^---\n[\s\S]*?\n---\n?/gm, '<hr />\n')

  // Fenced code blocks (must come before inline processing)
  text = text.replace(/```[\w]*\n([\s\S]*?)```/g, '<pre><code>$1</code></pre>')

  // Headings
  text = text.replace(/^### (.+)$/gm, '<h3>$1</h3>')
  text = text.replace(/^## (.+)$/gm, '<h2>$1</h2>')
  text = text.replace(/^# (.+)$/gm, '<h1>$1</h1>')

  // Horizontal rules (standalone ---)
  text = text.replace(/^---$/gm, '<hr />')

  // Bold and italic
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  text = text.replace(/\*(.+?)\*/g, '<em>$1</em>')

  // Inline code
  text = text.replace(/`([^`]+)`/g, '<code>$1</code>')

  // Unordered lists
  text = text.replace(/^- (.+)$/gm, '<li>$1</li>')
  text = text.replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>')

  // Paragraphs for remaining non-tag lines
  text = text.replace(/^(?!<[hluop]|<hr|<pre|<code|$)(.+)$/gm, '<p>$1</p>')

  // Clean up extra whitespace
  text = text.replace(/\n{3,}/g, '\n\n')

  return text
}

// --- Sub-components ---

function FileIcon({ category, extension }: { category: FileCategory; extension?: string }) {
  const cls = `${styles.nodeIcon} ${categoryClass[category]}`

  if (category === 'config') return <SettingsIcon className={cls} />
  if (category === 'briefing') return <BookOpenIcon className={cls} />
  if (category === 'session' && extension === 'jsonl') return <ClockIcon className={cls} />
  if (category === 'source') return <CodeIcon className={cls} />
  return <FileDocumentIcon className={cls} />
}

function FileTreeNode({
  node,
  depth,
  expandedFolders,
  selectedFile,
  onToggle,
  onSelect,
}: {
  node: FileNode
  depth: number
  expandedFolders: Set<string>
  selectedFile: string | null
  onToggle: (path: string) => void
  onSelect: (path: string) => void
}) {
  const isExpanded = expandedFolders.has(node.path)
  const isSelected = node.path === selectedFile

  const className = [
    styles.treeNode,
    node.type === 'folder' ? styles.treeNodeFolder : '',
    isSelected ? styles.treeNodeSelected : '',
  ].filter(Boolean).join(' ')

  return (
    <>
      <button
        className={className}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => node.type === 'folder' ? onToggle(node.path) : onSelect(node.path)}
      >
        {node.type === 'folder' ? (
          <>
            {isExpanded
              ? <ChevronDownIcon className={styles.nodeChevron} />
              : <ChevronRightIcon className={styles.nodeChevron} />
            }
            {isExpanded
              ? <FolderOpenIcon className={`${styles.nodeIcon} ${categoryClass[node.category]}`} />
              : <FolderIcon className={`${styles.nodeIcon} ${categoryClass[node.category]}`} />
            }
          </>
        ) : (
          <>
            <span className={styles.nodeChevron} />
            <FileIcon category={node.category} extension={node.extension} />
          </>
        )}
        <span className={styles.nodeName}>{node.name}</span>
      </button>
      {node.type === 'folder' && isExpanded && node.children?.map(child => (
        <FileTreeNode
          key={child.path}
          node={child}
          depth={depth + 1}
          expandedFolders={expandedFolders}
          selectedFile={selectedFile}
          onToggle={onToggle}
          onSelect={onSelect}
        />
      ))}
    </>
  )
}

function MarkdownPreview({ content }: { content: string }) {
  const html = useMemo(() => markdownToHtml(content), [content])
  return <div className={styles.markdownContent} dangerouslySetInnerHTML={{ __html: html }} />
}

function YamlPreview({ content }: { content: string }) {
  const html = useMemo(() => {
    return content
      .split('\n')
      .map(line =>
        line
          .replace(/^(\s*)([\w-]+)(:)/g, `$1<span class="${styles.yamlKey}">$2</span>$3`)
          .replace(/'([^']+)'/g, `<span class="${styles.yamlString}">'$1'</span>`)
      )
      .join('\n')
  }, [content])

  return <pre className={styles.yamlContent} dangerouslySetInnerHTML={{ __html: html }} />
}

interface TranscriptEntry {
  type?: string
  content?: string
  output?: string
  input?: unknown
  tool?: string
  timestamp?: string
  summary?: string
  [key: string]: unknown
}

function JsonlTimeline({ content }: { content: string }) {
  const entries = useMemo<TranscriptEntry[]>(() => {
    return content
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        try { return JSON.parse(line) as TranscriptEntry }
        catch { return null }
      })
      .filter((e): e is TranscriptEntry => e !== null)
  }, [content])

  const typeClass = (type?: string) => {
    switch (type) {
      case 'system': return styles.typeSystem
      case 'assistant': return styles.typeAssistant
      case 'tool_call': return styles.typeToolCall
      case 'tool_result': return styles.typeToolResult
      default: return styles.typeSystem
    }
  }

  return (
    <div className={styles.timeline}>
      {entries.map((entry, i) => {
        const body = entry.content
          || entry.output
          || entry.summary
          || (typeof entry.input === 'string' ? entry.input : null)
        const codeBody = typeof entry.input === 'object' && entry.input !== null
          ? JSON.stringify(entry.input, null, 2)
          : null

        return (
          <div key={i} className={`${styles.timelineEntry} ${typeClass(entry.type)}`}>
            <div className={styles.timelineMarker} />
            <div className={styles.timelineContent}>
              <div className={styles.timelineHeader}>
                <span className={`${styles.timelineType} ${typeClass(entry.type)}`}>
                  {entry.type || 'unknown'}
                </span>
                {entry.tool && <span className={styles.timelineTool}>{entry.tool}</span>}
                {entry.timestamp && (
                  <span className={styles.timelineTime}>
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </span>
                )}
              </div>
              {body && <div className={styles.timelineBody}>{body}</div>}
              {codeBody && <code className={styles.timelineBodyCode}>{codeBody}</code>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function JsonPreview({ content }: { content: string }) {
  const html = useMemo(() => {
    try {
      const formatted = JSON.stringify(JSON.parse(content), null, 2)
      return formatted
        .replace(/("(?:\\.|[^"\\])*")\s*:/g, `<span class="${styles.yamlKey}">$1</span>:`)
        .replace(/:\s*("(?:\\.|[^"\\])*")/g, `: <span class="${styles.yamlString}">$1</span>`)
    } catch {
      return content
    }
  }, [content])

  return <pre className={styles.yamlContent} dangerouslySetInnerHTML={{ __html: html }} />
}

function RawTextPreview({ content }: { content: string }) {
  return <pre className={styles.rawContent}>{content}</pre>
}

function ContentPreview({ path, content }: { path: string; content: string }) {
  const ext = path.split('.').pop()?.toLowerCase()

  switch (ext) {
    case 'md':
      return <MarkdownPreview content={content} />
    case 'yaml':
    case 'yml':
      return <YamlPreview content={content} />
    case 'json':
      return <JsonPreview content={content} />
    case 'jsonl':
      return <JsonlTimeline content={content} />
    default:
      return <RawTextPreview content={content} />
  }
}

type TabType = 'file' | 'table' | 'record'
type PaneId = 'left' | 'right'

interface OpenTab {
  id: string
  type: TabType
  path: string // file path, table name, or record id (table:key)
  label: string
  icon?: ReactNode
  pane: PaneId
  // For record tabs, store the record data
  record?: Record<string, unknown>
  tableName?: DbTableName
}

const TABLE_NAMES: DbTableName[] = ['projects', 'tasks', 'channels', 'messages', 'agentStatus', 'sessions']

const TABLE_LABELS: Record<DbTableName, string> = {
  projects: 'Projects',
  tasks: 'Tasks',
  channels: 'Channels',
  messages: 'Messages',
  agentStatus: 'Agent Status',
  sessions: 'Sessions',
}

type ViewMode = 'table' | 'view'

// Tables that have a rich view mode
const TABLES_WITH_VIEW: DbTableName[] = ['tasks']

type RecordViewMode = 'view' | 'raw'

// --- Task Board View (for rich task display) ---

function TaskBoardView({
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
      />
    </div>
  )
}

// --- Nice Task Detail View ---

function TaskDetailView({ record }: { record: Record<string, unknown> }) {
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

function RawRecordView({ record, tableName }: { record: Record<string, unknown>; tableName: string }) {
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

// Tables that have a nice detail view
const TABLES_WITH_DETAIL_VIEW: DbTableName[] = ['tasks']

function RecordDetailView({
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

  return <RawRecordView record={record} tableName={tableNameStr} />
}

function DatabaseTableView({
  snapshot,
  tableName,
  viewMode,
  onRowClick,
}: {
  snapshot: DbSnapshot
  tableName: DbTableName
  viewMode: ViewMode
  onRowClick: (record: Record<string, unknown>, key: string) => void
}) {
  const rows = snapshot[tableName] || []
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

// --- Helper to get file icon for tabs ---

function getFileIcon(path: string, category: FileCategory): ReactNode {
  const extension = path.split('.').pop()
  if (category === 'config') return <SettingsIcon />
  if (category === 'briefing') return <BookOpenIcon />
  if (category === 'session' && extension === 'jsonl') return <ClockIcon />
  if (category === 'source') return <CodeIcon />
  return <FileDocumentIcon />
}

// --- Main Component ---

interface ProjectViewerProps {
  projects: ProjectData
  dbData: ProjectDbData
}

export function ProjectViewer({ projects, dbData }: ProjectViewerProps) {
  const projectNames = useMemo(() => Object.keys(projects).sort(), [projects])
  const [activeProject, setActiveProject] = useState(projectNames[0] || '')
  const [openTabs, setOpenTabs] = useState<OpenTab[]>([])
  const [activeTabIds, setActiveTabIds] = useState<Record<PaneId, string | null>>({ left: null, right: null })
  const [activePane, setActivePane] = useState<PaneId>('left')
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(() => new Set())
  const [viewModes, setViewModes] = useState<Record<DbTableName, ViewMode>>({} as Record<DbTableName, ViewMode>)
  const [recordViewModes, setRecordViewModes] = useState<Record<string, RecordViewMode>>({})

  const getRecordViewMode = useCallback((tabId: string): RecordViewMode => {
    return recordViewModes[tabId] || 'view'
  }, [recordViewModes])

  const setRecordViewMode = useCallback((tabId: string, mode: RecordViewMode) => {
    setRecordViewModes(prev => ({ ...prev, [tabId]: mode }))
  }, [])
  const [isDragging, setIsDragging] = useState(false)
  const [isOverDropZone, setIsOverDropZone] = useState(false)
  const [leftPaneWidth, setLeftPaneWidth] = useState(50) // percentage
  const isResizing = useRef(false)
  const editorAreaRef = useRef<HTMLDivElement>(null)

  const files = projects[activeProject] || {}
  const snapshot = dbData[activeProject]
  const tree = useMemo(() => buildFileTree(files), [files])

  // Split tabs by pane
  const leftTabs = useMemo(() => openTabs.filter(t => t.pane === 'left'), [openTabs])
  const rightTabs = useMemo(() => openTabs.filter(t => t.pane === 'right'), [openTabs])
  const hasRightPane = rightTabs.length > 0

  // Set default expanded folders when tree changes
  useMemo(() => {
    setExpandedFolders(getDefaultExpanded(tree))
  }, [tree])

  const toggleFolder = useCallback((path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }, [])

  const openInPane = useCallback((type: TabType, path: string, targetPane: PaneId) => {
    const tabId = `${type}:${path}`

    // Check if tab already exists in any pane
    const existingTab = openTabs.find(t => t.id === tabId)
    if (existingTab) {
      // Just activate it
      setActiveTabIds(prev => ({ ...prev, [existingTab.pane]: tabId }))
      setActivePane(existingTab.pane)
      return
    }

    // Create new tab
    const label = type === 'file'
      ? (path.split('/').pop() || path)
      : TABLE_LABELS[path as DbTableName]
    const icon = type === 'file'
      ? getFileIcon(path, categorizeFile(path))
      : <DatabaseIcon />

    setOpenTabs(prev => [...prev, {
      id: tabId,
      type,
      path,
      label,
      icon,
      pane: targetPane,
    }])
    setActiveTabIds(prev => ({ ...prev, [targetPane]: tabId }))
    setActivePane(targetPane)
  }, [openTabs])

  const openFile = useCallback((path: string) => {
    openInPane('file', path, activePane)
  }, [openInPane, activePane])

  const openTable = useCallback((tableName: DbTableName) => {
    openInPane('table', tableName, activePane)
  }, [openInPane, activePane])

  const openRecord = useCallback((tableName: DbTableName, record: Record<string, unknown>, key: string) => {
    const tabId = `record:${tableName}:${key}`

    // Check if tab already exists
    const existingTab = openTabs.find(t => t.id === tabId)
    if (existingTab) {
      setActiveTabIds(prev => ({ ...prev, [existingTab.pane]: tabId }))
      setActivePane(existingTab.pane)
      return
    }

    // Open in the opposite pane (detail view pattern)
    // If right pane doesn't exist yet, create it
    const targetPane: PaneId = 'right'

    // Create label from key or title field
    const label = record.title ? String(record.title).slice(0, 30) : `${TABLE_LABELS[tableName]} ${key}`

    setOpenTabs(prev => [...prev, {
      id: tabId,
      type: 'record',
      path: `${tableName}:${key}`,
      label,
      icon: <DatabaseIcon />,
      pane: targetPane,
      record,
      tableName,
    }])
    setActiveTabIds(prev => ({ ...prev, [targetPane]: tabId }))
  }, [openTabs, activePane])

  const splitToRight = useCallback((tabId: string) => {
    setOpenTabs(prev => prev.map(t =>
      t.id === tabId ? { ...t, pane: 'right' as PaneId } : t
    ))
    setActiveTabIds(prev => ({ ...prev, right: tabId }))
    setActivePane('right')
  }, [])

  const closeTab = useCallback((tabId: string, pane: PaneId) => {
    setOpenTabs(prev => {
      const paneTabs = prev.filter(t => t.pane === pane)
      const idx = paneTabs.findIndex(t => t.id === tabId)
      const newTabs = prev.filter(t => t.id !== tabId)
      const newPaneTabs = newTabs.filter(t => t.pane === pane)

      if (activeTabIds[pane] === tabId) {
        if (newPaneTabs.length > 0) {
          const newIdx = Math.min(idx, newPaneTabs.length - 1)
          setActiveTabIds(p => ({ ...p, [pane]: newPaneTabs[newIdx].id }))
        } else {
          setActiveTabIds(p => ({ ...p, [pane]: null }))
          // If closing right pane's last tab, switch focus to left
          if (pane === 'right') {
            setActivePane('left')
          }
        }
      }
      return newTabs
    })
  }, [activeTabIds])

  const handleProjectChange = useCallback((name: string) => {
    setActiveProject(name)
    setOpenTabs([])
    setActiveTabIds({ left: null, right: null })
    setActivePane('left')
  }, [])

  const selectTab = useCallback((tabId: string, pane: PaneId) => {
    setActiveTabIds(prev => ({ ...prev, [pane]: tabId }))
    setActivePane(pane)
  }, [])

  // Reorder tab within the same pane
  const reorderTab = useCallback((pane: PaneId, tabId: string, targetIndex: number) => {
    setOpenTabs(prev => {
      const paneTabs = prev.filter(t => t.pane === pane)
      const otherTabs = prev.filter(t => t.pane !== pane)
      const tabToMove = paneTabs.find(t => t.id === tabId)
      if (!tabToMove) return prev

      const filteredPaneTabs = paneTabs.filter(t => t.id !== tabId)
      const newPaneTabs = [
        ...filteredPaneTabs.slice(0, targetIndex),
        tabToMove,
        ...filteredPaneTabs.slice(targetIndex),
      ]
      return [...otherTabs, ...newPaneTabs]
    })
  }, [])

  // Move tab from one pane to another
  const moveTabToPane = useCallback((tabId: string, sourcePane: string, targetPane: PaneId, targetIndex: number) => {
    setOpenTabs(prev => {
      const tab = prev.find(t => t.id === tabId)
      if (!tab) return prev

      // Remove from source, add to target at index
      const withoutTab = prev.filter(t => t.id !== tabId)
      const targetPaneTabs = withoutTab.filter(t => t.pane === targetPane)
      const otherTabs = withoutTab.filter(t => t.pane !== targetPane)

      const updatedTab = { ...tab, pane: targetPane }
      const newTargetTabs = [
        ...targetPaneTabs.slice(0, targetIndex),
        updatedTab,
        ...targetPaneTabs.slice(targetIndex),
      ]

      // Update active tab for source pane if needed
      if (sourcePane === 'left' || sourcePane === 'right') {
        const sourcePaneTabs = withoutTab.filter(t => t.pane === sourcePane)
        if (activeTabIds[sourcePane as PaneId] === tabId) {
          if (sourcePaneTabs.length > 0) {
            setActiveTabIds(p => ({ ...p, [sourcePane]: sourcePaneTabs[0].id }))
          } else {
            setActiveTabIds(p => ({ ...p, [sourcePane]: null }))
            if (sourcePane === 'right') {
              setActivePane('left')
            }
          }
        }
      }

      // Set active tab in target pane
      setActiveTabIds(p => ({ ...p, [targetPane]: tabId }))
      setActivePane(targetPane)

      return [...otherTabs, ...newTargetTabs]
    })
  }, [activeTabIds])

  // Handle splitter resize
  const handleSplitterMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    isResizing.current = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isResizing.current || !editorAreaRef.current) return
      const rect = editorAreaRef.current.getBoundingClientRect()
      const newWidth = ((moveEvent.clientX - rect.left) / rect.width) * 100
      // Clamp between 20% and 80%
      setLeftPaneWidth(Math.min(80, Math.max(20, newWidth)))
    }

    const handleMouseUp = () => {
      isResizing.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [])

  // Handle drop zone for creating right pane
  const handleDropZoneDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setIsOverDropZone(true)
  }, [])

  const handleDropZoneDragLeave = useCallback(() => {
    setIsOverDropZone(false)
  }, [])

  const handleDropZoneDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsOverDropZone(false)
    setIsDragging(false)

    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'))
      if (data.tabId) {
        // Move to right pane at index 0
        moveTabToPane(data.tabId, data.sourcePane || 'left', 'right', 0)
      }
    } catch {
      // Invalid data
    }
  }, [moveTabToPane])

  // Get active tabs for each pane
  const activeLeftTab = leftTabs.find(t => t.id === activeTabIds.left)
  const activeRightTab = rightTabs.find(t => t.id === activeTabIds.right)

  // Selected file is from the currently focused pane
  const focusedTab = activePane === 'left' ? activeLeftTab : activeRightTab
  const selectedFilePath = focusedTab?.type === 'file' ? focusedTab.path : null

  // Convert to Tab[] for TabbedPane
  const toTabs = (tabs: OpenTab[]): Tab[] => tabs.map(t => {
    // Add menu content for tabs with view options
    let menuContent: ReactNode = undefined

    // Table tabs with rich view support
    if (t.type === 'table' && TABLES_WITH_VIEW.includes(t.path as DbTableName)) {
      const tableName = t.path as DbTableName
      const currentMode = viewModes[tableName] || 'table'
      menuContent = (
        <div className={styles.tabMenuContent}>
          <div className={styles.tabMenuLabel}>View</div>
          <button
            className={`${styles.tabMenuOption} ${currentMode === 'table' ? styles.tabMenuOptionActive : ''}`}
            onClick={() => setViewModes(prev => ({ ...prev, [tableName]: 'table' }))}
          >
            <TableIcon className={styles.tabMenuOptionIcon} />
            <span>Table</span>
          </button>
          <button
            className={`${styles.tabMenuOption} ${currentMode === 'view' ? styles.tabMenuOptionActive : ''}`}
            onClick={() => setViewModes(prev => ({ ...prev, [tableName]: 'view' }))}
          >
            <KanbanIcon className={styles.tabMenuOptionIcon} />
            <span>Board</span>
          </button>
        </div>
      )
    }

    // Record tabs with nice view support
    if (t.type === 'record' && t.tableName && TABLES_WITH_DETAIL_VIEW.includes(t.tableName)) {
      const currentMode = getRecordViewMode(t.id)
      menuContent = (
        <div className={styles.tabMenuContent}>
          <div className={styles.tabMenuLabel}>View</div>
          <button
            className={`${styles.tabMenuOption} ${currentMode === 'view' ? styles.tabMenuOptionActive : ''}`}
            onClick={() => setRecordViewMode(t.id, 'view')}
          >
            <KanbanIcon className={styles.tabMenuOptionIcon} />
            <span>Formatted</span>
          </button>
          <button
            className={`${styles.tabMenuOption} ${currentMode === 'raw' ? styles.tabMenuOptionActive : ''}`}
            onClick={() => setRecordViewMode(t.id, 'raw')}
          >
            <TableIcon className={styles.tabMenuOptionIcon} />
            <span>Raw Data</span>
          </button>
        </div>
      )
    }

    return {
      id: t.id,
      label: t.label,
      icon: t.icon,
      closable: true,
      menuContent,
    }
  })

  // Render tab content for a given tab
  const renderTabContent = (tab: OpenTab | undefined) => {
    if (!tab) return null

    if (tab.type === 'file') {
      const content = files[tab.path]
      if (content == null) return <div className={styles.emptyState}>File not found</div>
      return (
        <div className={styles.tabContentInner}>
          <ContentPreview path={tab.path} content={content} />
        </div>
      )
    }

    if (tab.type === 'table' && snapshot) {
      const tableName = tab.path as DbTableName
      const viewMode = viewModes[tableName] || 'table'
      return (
        <DatabaseTableView
          snapshot={snapshot}
          tableName={tableName}
          viewMode={viewMode}
          onRowClick={(record, key) => openRecord(tableName, record, key)}
        />
      )
    }

    if (tab.type === 'record' && tab.record) {
      return (
        <div className={styles.tabContentInner}>
          <RecordDetailView
            record={tab.record}
            tableName={tab.tableName || 'Record'}
            viewMode={getRecordViewMode(tab.id)}
          />
        </div>
      )
    }

    return null
  }

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <select
          className={styles.projectSelect}
          value={activeProject}
          onChange={e => handleProjectChange(e.target.value)}
        >
          {projectNames.map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </div>
      <div className={styles.splitPane}>
        <div className={styles.sidebar}>
          <div className={styles.sidebarSection}>
            <div className={styles.sidebarHeader}>Files</div>
            <div className={styles.sidebarContent}>
              {tree.map(node => (
                <FileTreeNode
                  key={node.path}
                  node={node}
                  depth={0}
                  expandedFolders={expandedFolders}
                  selectedFile={selectedFilePath}
                  onToggle={toggleFolder}
                  onSelect={openFile}
                />
              ))}
            </div>
          </div>
          {snapshot && (
            <div className={styles.sidebarSection}>
              <div className={styles.sidebarHeader}>Database</div>
              <div className={styles.sidebarContent}>
                {TABLE_NAMES.map(name => (
                  <button
                    key={name}
                    className={`${styles.tableItem} ${focusedTab?.type === 'table' && focusedTab.path === name ? styles.tableItemActive : ''}`}
                    onClick={() => openTable(name)}
                  >
                    <span className={styles.tableName}>{TABLE_LABELS[name]}</span>
                    <span className={styles.tableCount}>{snapshot[name]?.length || 0}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className={styles.editorArea} ref={editorAreaRef}>
          <div
            className={`${styles.editorPane} ${activePane === 'left' ? styles.editorPaneActive : ''}`}
            style={hasRightPane ? { flex: `0 0 ${leftPaneWidth}%` } : undefined}
            onClick={() => setActivePane('left')}
          >
            <TabbedPane
              tabs={toTabs(leftTabs)}
              activeTabId={activeTabIds.left}
              onTabSelect={(id) => selectTab(id, 'left')}
              onTabClose={(id) => closeTab(id, 'left')}
              emptyState="Select a file or table to view"
              onSplitRight={splitToRight}
              paneId="left"
              onTabDrop={(tabId, targetIndex) => reorderTab('left', tabId, targetIndex)}
              onTabDropFromOtherPane={(tabId, sourcePane, targetIndex) => moveTabToPane(tabId, sourcePane, 'left', targetIndex)}
              onDragStart={() => setIsDragging(true)}
              onDragEnd={() => setIsDragging(false)}
            >
              {renderTabContent(activeLeftTab)}
            </TabbedPane>
          </div>
          {hasRightPane ? (
            <>
              <div
                className={styles.editorSplitter}
                onMouseDown={handleSplitterMouseDown}
              />
              <div
                className={`${styles.editorPane} ${activePane === 'right' ? styles.editorPaneActive : ''}`}
                style={{ flex: `0 0 ${100 - leftPaneWidth}%` }}
                onClick={() => setActivePane('right')}
              >
                <TabbedPane
                  tabs={toTabs(rightTabs)}
                  activeTabId={activeTabIds.right}
                  onTabSelect={(id) => selectTab(id, 'right')}
                  onTabClose={(id) => closeTab(id, 'right')}
                  emptyState="Drop tabs here"
                  paneId="right"
                  onTabDrop={(tabId, targetIndex) => reorderTab('right', tabId, targetIndex)}
                  onTabDropFromOtherPane={(tabId, sourcePane, targetIndex) => moveTabToPane(tabId, sourcePane, 'right', targetIndex)}
                  onDragStart={() => setIsDragging(true)}
                  onDragEnd={() => setIsDragging(false)}
                >
                  {renderTabContent(activeRightTab)}
                </TabbedPane>
              </div>
            </>
          ) : isDragging && (
            <div
              className={`${styles.splitDropZone} ${isOverDropZone ? styles.splitDropZoneActive : ''}`}
              onDragOver={handleDropZoneDragOver}
              onDragLeave={handleDropZoneDragLeave}
              onDrop={handleDropZoneDrop}
            >
              <span>Drop to split</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
