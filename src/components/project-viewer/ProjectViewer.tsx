import { useState, useMemo, useCallback } from 'react'
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
} from '../shared/icons'
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

function Breadcrumb({ path }: { path: string }) {
  const parts = path.split('/')
  return (
    <span className={styles.breadcrumb}>
      {parts.map((part, i) => (
        <span key={i}>
          {i > 0 && <span className={styles.breadcrumbSep}>/</span>}
          <span className={i === parts.length - 1 ? styles.breadcrumbCurrent : ''}>
            {part}
          </span>
        </span>
      ))}
    </span>
  )
}

type ViewMode = 'files' | 'database'

const TABLE_NAMES: DbTableName[] = ['projects', 'tasks', 'channels', 'messages', 'agentStatus', 'sessions']

const TABLE_LABELS: Record<DbTableName, string> = {
  projects: 'Projects',
  tasks: 'Tasks',
  channels: 'Channels',
  messages: 'Messages',
  agentStatus: 'Agent Status',
  sessions: 'Sessions',
}

function DatabaseView({ snapshot }: { snapshot: DbSnapshot }) {
  const [selectedTable, setSelectedTable] = useState<DbTableName>('tasks')

  const rows = snapshot[selectedTable] || []
  const columns = useMemo(() => {
    if (rows.length === 0) return []
    return Object.keys(rows[0])
  }, [rows])

  const formatCell = (value: unknown): string => {
    if (value === null || value === undefined) return ''
    if (typeof value === 'string') {
      // Truncate long strings
      return value.length > 50 ? value.slice(0, 50) + '...' : value
    }
    return String(value)
  }

  return (
    <>
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>Tables</div>
        {TABLE_NAMES.map(name => (
          <button
            key={name}
            className={`${styles.tableItem} ${selectedTable === name ? styles.tableItemActive : ''}`}
            onClick={() => setSelectedTable(name)}
          >
            <span className={styles.tableName}>{TABLE_LABELS[name]}</span>
            <span className={styles.tableCount}>{snapshot[name]?.length || 0}</span>
          </button>
        ))}
      </div>
      <div className={styles.contentPane}>
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
                  <tr key={i}>
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
    </>
  )
}

// --- Main Component ---

interface ProjectViewerProps {
  projects: ProjectData
  dbData: ProjectDbData
}

export function ProjectViewer({ projects, dbData }: ProjectViewerProps) {
  const projectNames = useMemo(() => Object.keys(projects).sort(), [projects])
  const [activeProject, setActiveProject] = useState(projectNames[0] || '')
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(() => new Set())
  const [viewMode, setViewMode] = useState<ViewMode>('files')

  const files = projects[activeProject] || {}
  const snapshot = dbData[activeProject]
  const tree = useMemo(() => buildFileTree(files), [files])

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

  const selectFile = useCallback((path: string) => {
    setSelectedFile(path)
  }, [])

  const handleProjectChange = useCallback((name: string) => {
    setActiveProject(name)
    setSelectedFile(null)
  }, [])

  const selectedContent = selectedFile ? files[selectedFile] : null

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
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${viewMode === 'files' ? styles.tabActive : ''}`}
            onClick={() => setViewMode('files')}
          >
            Files
          </button>
          <button
            className={`${styles.tab} ${viewMode === 'database' ? styles.tabActive : ''}`}
            onClick={() => setViewMode('database')}
          >
            Database
          </button>
        </div>
        {viewMode === 'files' && selectedFile && <Breadcrumb path={selectedFile} />}
      </div>
      <div className={styles.splitPane}>
        {viewMode === 'files' ? (
          <>
            <div className={styles.sidebar}>
              <div className={styles.sidebarHeader}>Files</div>
              {tree.map(node => (
                <FileTreeNode
                  key={node.path}
                  node={node}
                  depth={0}
                  expandedFolders={expandedFolders}
                  selectedFile={selectedFile}
                  onToggle={toggleFolder}
                  onSelect={selectFile}
                />
              ))}
            </div>
            <div className={styles.contentPane}>
              {selectedFile && selectedContent != null ? (
                <ContentPreview path={selectedFile} content={selectedContent} />
              ) : (
                <div className={styles.emptyState}>Select a file to preview</div>
              )}
            </div>
          </>
        ) : snapshot ? (
          <DatabaseView snapshot={snapshot} />
        ) : (
          <div className={styles.emptyState}>No database snapshot for this project</div>
        )}
      </div>
    </div>
  )
}
