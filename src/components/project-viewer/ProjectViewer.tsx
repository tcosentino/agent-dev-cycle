import { useState, useMemo, useCallback } from 'react'
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
} from '../shared/icons'
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

type TabType = 'file' | 'table'
type PaneId = 'left' | 'right'

interface OpenTab {
  id: string
  type: TabType
  path: string // file path or table name
  label: string
  icon?: ReactNode
  pane: PaneId
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

function RecordDetailPanel({
  record,
  tableName,
  onClose,
}: {
  record: Record<string, unknown>
  tableName: string
  onClose: () => void
}) {
  const formatValue = (value: unknown): string => {
    if (value === null) return 'null'
    if (value === undefined) return 'undefined'
    if (typeof value === 'object') return JSON.stringify(value, null, 2)
    return String(value)
  }

  return (
    <div className={styles.detailPanel}>
      <div className={styles.detailHeader}>
        <span className={styles.detailTitle}>{tableName} Record</span>
        <button className={styles.detailClose} onClick={onClose}>
          <ChevronRightIcon className={styles.detailCloseIcon} />
        </button>
      </div>
      <div className={styles.detailBody}>
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

function DatabaseTableView({
  snapshot,
  tableName,
  selectedRow,
  onSelectRow,
  onCloseDetail,
}: {
  snapshot: DbSnapshot
  tableName: DbTableName
  selectedRow: number | null
  onSelectRow: (row: number) => void
  onCloseDetail: () => void
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

  const selectedRecord = selectedRow !== null ? rows[selectedRow] : null

  return (
    <div className={styles.dbViewContainer}>
      <div className={`${styles.dbTablePane} ${selectedRecord ? styles.dbTablePaneWithDetail : ''}`}>
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
                {rows.map((row, i) => (
                  <tr
                    key={i}
                    className={selectedRow === i ? styles.dataRowSelected : ''}
                    onClick={() => onSelectRow(i)}
                  >
                    {columns.map(col => (
                      <td key={col}>{formatCell(row[col])}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={styles.emptyState}>No rows in this table</div>
        )}
      </div>
      {selectedRecord && (
        <RecordDetailPanel
          record={selectedRecord}
          tableName={TABLE_LABELS[tableName]}
          onClose={onCloseDetail}
        />
      )}
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
  const [selectedDbRows, setSelectedDbRows] = useState<Record<string, number | null>>({})

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
    setSelectedDbRows({})
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

  // Get active tabs for each pane
  const activeLeftTab = leftTabs.find(t => t.id === activeTabIds.left)
  const activeRightTab = rightTabs.find(t => t.id === activeTabIds.right)

  // Selected file is from the currently focused pane
  const focusedTab = activePane === 'left' ? activeLeftTab : activeRightTab
  const selectedFilePath = focusedTab?.type === 'file' ? focusedTab.path : null

  // Convert to Tab[] for TabbedPane
  const toTabs = (tabs: OpenTab[]): Tab[] => tabs.map(t => ({
    id: t.id,
    label: t.label,
    icon: t.icon,
    closable: true,
  }))

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
      const selectedRow = selectedDbRows[tableName] ?? null
      return (
        <DatabaseTableView
          snapshot={snapshot}
          tableName={tableName}
          selectedRow={selectedRow}
          onSelectRow={(row) => setSelectedDbRows(prev => ({ ...prev, [tableName]: row }))}
          onCloseDetail={() => setSelectedDbRows(prev => ({ ...prev, [tableName]: null }))}
        />
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
        <div className={styles.editorArea}>
          <div
            className={`${styles.editorPane} ${activePane === 'left' ? styles.editorPaneActive : ''}`}
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
            >
              {renderTabContent(activeLeftTab)}
            </TabbedPane>
          </div>
          {hasRightPane && (
            <>
              <div className={styles.editorSplitter} />
              <div
                className={`${styles.editorPane} ${activePane === 'right' ? styles.editorPaneActive : ''}`}
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
                >
                  {renderTabContent(activeRightTab)}
                </TabbedPane>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
