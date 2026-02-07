import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import type { ReactNode } from 'react'
import {
  FileDocumentIcon,
  SettingsIcon,
  BookOpenIcon,
  ClockIcon,
  CodeIcon,
  DatabaseIcon,
  TableIcon,
  KanbanIcon,
  MessageSquareIcon,
  RocketIcon,
  BoxIcon,
  PlayIcon,
  TabbedPane,
  type Tab,
} from '@agentforge/ui-components'
import {
  AgentSessionProgressPanel,
  StartAgentSessionModal,
} from './components/AgentSessionPanel'
import type { FileCategory, ProjectData, ProjectDbData, DbTableName, Workload, ServiceMetadata } from './types'
import {
  categorizeFile,
  buildFileTree,
  getDefaultExpanded,
  filterTreeForSimpleMode,
  TABLE_NAMES,
  TABLE_LABELS,
  TABLES_WITH_VIEW,
  TABLES_WITH_DETAIL_VIEW,
  FileTreeNode,
  ContentPreview,
  DatabaseTableView,
  RecordDetailView,
  ServiceView,
  AgentBrowser,
  AgentPage,
  parseAgentsYaml,
} from './components'
import type { TabType, PaneId, ViewMode, RecordViewMode, OpenTab } from './components'
import styles from './ProjectViewer.module.css'

// --- LocalStorage persistence ---

const STORAGE_KEY = 'projectViewer:state'

interface SerializedTab {
  id: string
  type: TabType
  path: string
  label: string
  pane: PaneId
  tableName?: DbTableName
}

interface PersistedState {
  activeProject: string
  tabs: SerializedTab[]
  activeTabIds: Record<PaneId, string | null>
  activePane: PaneId
  expandedFolders: string[]
  viewModes: Record<DbTableName, ViewMode>
  recordViewModes: Record<string, RecordViewMode>
  simpleMode: boolean
  leftPaneWidth: number
  sidebarWidth: number
  selectedAgent: string | null
}

function loadPersistedState(): Partial<PersistedState> | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch {
    // Invalid or no stored state
  }
  return null
}

function savePersistedState(state: PersistedState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Storage full or unavailable
  }
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

function getTabIcon(tab: SerializedTab): ReactNode {
  if (tab.type === 'file') {
    return getFileIcon(tab.path, categorizeFile(tab.path))
  }
  if (tab.type === 'table' || tab.type === 'record') {
    return <DatabaseIcon />
  }
  if (tab.type === 'service') {
    return <BoxIcon />
  }
  if (tab.type === 'agentSession') {
    return <PlayIcon />
  }
  if (tab.type === 'agent') {
    return <CodeIcon />
  }
  return <FileDocumentIcon />
}

// --- File Breadcrumb ---

interface FileBreadcrumbProps {
  path: string
  onNavigate: (path: string) => void
}

function FileBreadcrumb({ path, onNavigate }: FileBreadcrumbProps) {
  const parts = path.split('/')
  const fileName = parts.pop() || ''

  return (
    <div className={styles.fileBreadcrumb}>
      {parts.map((part, i) => {
        const folderPath = parts.slice(0, i + 1).join('/')
        return (
          <span key={i}>
            <button
              className={styles.breadcrumbPart}
              onClick={() => onNavigate(folderPath)}
              title={`Open ${folderPath}`}
            >
              {part}
            </button>
            <span className={styles.breadcrumbSep}>/</span>
          </span>
        )
      })}
      <span className={styles.breadcrumbCurrent}>{fileName}</span>
    </div>
  )
}

// --- File Content Loader ---

interface FileContentLoaderProps {
  projectId: string
  filePath: string
  cachedContent: string | undefined
  onLoadContent?: (projectId: string, filePath: string) => Promise<string>
}

function FileContentLoader({ projectId, filePath, cachedContent, onLoadContent }: FileContentLoaderProps) {
  const [content, setContent] = useState<string | null>(cachedContent ?? null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const loadedRef = useRef(false)
  const currentFileRef = useRef<string>('')

  // Reset state when file path changes
  useEffect(() => {
    if (currentFileRef.current !== filePath) {
      currentFileRef.current = filePath
      loadedRef.current = false
      setError(null)
      // Use cached content immediately if available
      if (cachedContent) {
        setContent(cachedContent)
        loadedRef.current = true
      } else {
        setContent(null)
      }
    }
  }, [filePath, cachedContent])

  // Update content when cachedContent changes for current file
  useEffect(() => {
    if (cachedContent && currentFileRef.current === filePath) {
      setContent(cachedContent)
      loadedRef.current = true
    }
  }, [cachedContent, filePath])

  // Load content on demand if not cached
  useEffect(() => {
    // Skip if already loaded or loading or we have cached content
    if (loadedRef.current || loading || cachedContent) {
      return
    }

    // If no loader function, show error
    if (!onLoadContent) {
      setError('No content loader available')
      return
    }

    // Load content on demand
    setLoading(true)
    setError(null)
    loadedRef.current = true
    onLoadContent(projectId, filePath)
      .then(loadedContent => {
        setContent(loadedContent)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load file content:', err)
        setError(err instanceof Error ? err.message : 'Failed to load file')
        setLoading(false)
      })
  }, [projectId, filePath, cachedContent, onLoadContent, loading])

  if (loading) {
    return <div className={styles.emptyState}>Loading...</div>
  }

  if (error) {
    return <div className={styles.emptyState}>Error: {error}</div>
  }

  if (content === null) {
    return <div className={styles.emptyState}>No content</div>
  }

  return <ContentPreview path={filePath} content={content} />
}

// --- Main Component ---

interface ProjectViewerProps {
  projects: ProjectData
  dbData: ProjectDbData
  projectDisplayNames?: Record<string, string>
  selectedProjectId?: string
  onLoadFileContent?: (projectId: string, filePath: string) => Promise<string>
}

export function ProjectViewer({ projects, dbData, projectDisplayNames, selectedProjectId, onLoadFileContent }: ProjectViewerProps) {
  const projectIds = useMemo(() => Object.keys(projects).sort(), [projects])

  // Load persisted state once on mount
  const persistedState = useMemo(() => loadPersistedState(), [])

  const [activeProject, setActiveProject] = useState(() => {
    // Use selectedProjectId if provided
    if (selectedProjectId && projectIds.includes(selectedProjectId)) {
      return selectedProjectId
    }
    // Use persisted project if it exists in current projects
    if (persistedState?.activeProject && projectIds.includes(persistedState.activeProject)) {
      return persistedState.activeProject
    }
    return projectIds[0] || ''
  })

  // Sync activeProject with selectedProjectId when it changes
  useEffect(() => {
    if (selectedProjectId && selectedProjectId !== activeProject && projectIds.includes(selectedProjectId)) {
      setActiveProject(selectedProjectId)
      setOpenTabs([])
      setActiveTabIds({ left: null, right: null })
      setActivePane('left')
    }
  }, [selectedProjectId, activeProject, projectIds])

  // Restore tabs from persisted state (need to regenerate icons and fetch data)
  const [openTabs, setOpenTabs] = useState<OpenTab[]>(() => {
    if (!persistedState?.tabs || persistedState.activeProject !== activeProject) {
      return []
    }
    return persistedState.tabs.map(tab => ({
      ...tab,
      icon: getTabIcon(tab),
      // Record data will be re-fetched when tab is selected
      record: undefined,
      serviceMetadata: undefined,
      serviceReadme: undefined,
    }))
  })

  const [activeTabIds, setActiveTabIds] = useState<Record<PaneId, string | null>>(() => {
    if (persistedState?.activeTabIds && persistedState.activeProject === activeProject) {
      return persistedState.activeTabIds
    }
    return { left: null, right: null }
  })

  const [activePane, setActivePane] = useState<PaneId>(() => {
    return persistedState?.activePane || 'left'
  })

  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(() => {
    if (persistedState?.expandedFolders && persistedState.activeProject === activeProject) {
      return new Set(persistedState.expandedFolders)
    }
    return new Set()
  })

  const [viewModes, setViewModes] = useState<Record<DbTableName, ViewMode>>(() => {
    return (persistedState?.viewModes || {}) as Record<DbTableName, ViewMode>
  })

  const [recordViewModes, setRecordViewModes] = useState<Record<string, RecordViewMode>>(() => {
    return persistedState?.recordViewModes || {}
  })

  const [simpleMode, setSimpleMode] = useState(() => {
    return persistedState?.simpleMode ?? true
  })

  const getRecordViewMode = useCallback((tabId: string): RecordViewMode => {
    return recordViewModes[tabId] || 'view'
  }, [recordViewModes])

  const setRecordViewMode = useCallback((tabId: string, mode: RecordViewMode) => {
    setRecordViewModes(prev => ({ ...prev, [tabId]: mode }))
  }, [])
  const [isDragging, setIsDragging] = useState(false)
  const [isOverDropZone, setIsOverDropZone] = useState(false)
  const [showStartSessionModal, setShowStartSessionModal] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<string | null>(() => {
    return persistedState?.selectedAgent || null
  })
  const [preselectedAgentForModal, setPreselectedAgentForModal] = useState<string | undefined>()
  const [leftPaneWidth, setLeftPaneWidth] = useState(() => persistedState?.leftPaneWidth ?? 50)
  const [sidebarWidth, setSidebarWidth] = useState(() => persistedState?.sidebarWidth ?? 260)
  const isResizing = useRef(false)
  const isResizingSidebar = useRef(false)
  const editorAreaRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Persist state to localStorage when it changes
  useEffect(() => {
    const serializedTabs: SerializedTab[] = openTabs.map(t => ({
      id: t.id,
      type: t.type,
      path: t.path,
      label: t.label,
      pane: t.pane,
      tableName: t.tableName,
    }))

    savePersistedState({
      activeProject,
      tabs: serializedTabs,
      activeTabIds,
      activePane,
      expandedFolders: Array.from(expandedFolders),
      viewModes,
      recordViewModes,
      simpleMode,
      leftPaneWidth,
      sidebarWidth,
      selectedAgent,
    })
  }, [
    activeProject,
    openTabs,
    activeTabIds,
    activePane,
    expandedFolders,
    viewModes,
    recordViewModes,
    simpleMode,
    leftPaneWidth,
    sidebarWidth,
    selectedAgent,
  ])

  const files = projects[activeProject] || {}
  const snapshot = dbData[activeProject]
  const fullTree = useMemo(() => buildFileTree(files), [files])
  const tree = useMemo(
    () => simpleMode ? filterTreeForSimpleMode(fullTree) : fullTree,
    [fullTree, simpleMode]
  )

  // Load agents from YAML
  // Eagerly load agents.yaml when files change
  useEffect(() => {
    const agentsYamlPath = '.agentforge/agents.yaml'
    const fileExists = agentsYamlPath in files
    const fileContent = files[agentsYamlPath]

    // If file exists in the list but content is empty, load it
    if (fileExists && fileContent === '' && onLoadFileContent) {
      console.log('[ProjectViewer] Eagerly loading agents.yaml')
      onLoadFileContent(activeProject, agentsYamlPath).catch((err: Error) => {
        console.error('[ProjectViewer] Failed to load agents.yaml:', err)
      })
    }
  }, [files, activeProject, onLoadFileContent])

  const agents = useMemo(() => {
    const agentsFile = files['.agentforge/agents.yaml']
    console.log('[ProjectViewer] Parsing agents, content length:', agentsFile?.length)
    if (!agentsFile || agentsFile === '') return []
    return parseAgentsYaml(agentsFile)
  }, [files])

  // Split tabs by pane
  const leftTabs = useMemo(() => openTabs.filter(t => t.pane === 'left'), [openTabs])
  const rightTabs = useMemo(() => openTabs.filter(t => t.pane === 'right'), [openTabs])
  const hasRightPane = rightTabs.length > 0

  // Set default expanded folders when tree changes
  useEffect(() => {
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
  }, [openTabs])

  const openService = useCallback((servicePath: string) => {
    const tabId = `service:${servicePath}`

    // Check if tab already exists
    const existingTab = openTabs.find(t => t.id === tabId)
    if (existingTab) {
      setActiveTabIds(prev => ({ ...prev, [existingTab.pane]: tabId }))
      setActivePane(existingTab.pane)
      return
    }

    // Try to load service.json and README.md
    const serviceJsonPath = `${servicePath}/service.json`
    const readmePath = `${servicePath}/README.md`

    const serviceJsonContent = files[serviceJsonPath]
    const readmeContent = files[readmePath]

    let metadata: ServiceMetadata | undefined
    try {
      if (serviceJsonContent) {
        metadata = JSON.parse(serviceJsonContent)
      }
    } catch {
      // Invalid JSON
    }

    if (!metadata) {
      // Fallback - just open as a regular file view
      openFile(serviceJsonPath)
      return
    }

    const label = metadata.name || servicePath.split('/').pop() || 'Service'

    setOpenTabs(prev => [...prev, {
      id: tabId,
      type: 'service',
      path: servicePath,
      label,
      icon: <BoxIcon />,
      pane: activePane,
      serviceMetadata: metadata,
      serviceReadme: readmeContent,
    }])
    setActiveTabIds(prev => ({ ...prev, [activePane]: tabId }))
  }, [openTabs, files, activePane, openFile])

  const openAgentSession = useCallback((sessionId: string) => {
    const tabId = `agentSession:${sessionId}`

    // Check if tab already exists
    const existingTab = openTabs.find(t => t.id === tabId)
    if (existingTab) {
      setActiveTabIds(prev => ({ ...prev, [existingTab.pane]: tabId }))
      setActivePane(existingTab.pane)
      return
    }

    // Create new tab
    setOpenTabs(prev => [...prev, {
      id: tabId,
      type: 'agentSession',
      path: sessionId,
      label: `Session ${sessionId.slice(0, 8)}`,
      icon: <PlayIcon />,
      pane: activePane,
    }])
    setActiveTabIds(prev => ({ ...prev, [activePane]: tabId }))
  }, [openTabs, activePane])

  const openAgent = useCallback((agentId: string) => {
    const tabId = `agent:${agentId}`
    const agent = agents.find(a => a.id === agentId)
    if (!agent) return

    // Check if tab already exists
    const existingTab = openTabs.find(t => t.id === tabId)
    if (existingTab) {
      setActiveTabIds(prev => ({ ...prev, [existingTab.pane]: tabId }))
      setActivePane(existingTab.pane)
      return
    }

    // Create new tab
    setOpenTabs(prev => [...prev, {
      id: tabId,
      type: 'agent',
      path: agentId,
      label: agent.displayName,
      icon: <CodeIcon />,
      pane: activePane,
      agentId,
    }])
    setActiveTabIds(prev => ({ ...prev, [activePane]: tabId }))
    setActivePane(activePane)
  }, [openTabs, activePane, agents])

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

  // Handle sidebar resize
  const handleSidebarMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    isResizingSidebar.current = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isResizingSidebar.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const newWidth = moveEvent.clientX - rect.left
      // Clamp between 150px and 500px
      setSidebarWidth(Math.min(500, Math.max(150, newWidth)))
    }

    const handleMouseUp = () => {
      isResizingSidebar.current = false
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
      const defaultMode = tableName === 'tasks' ? 'view' : 'table'
      const currentMode = viewModes[tableName] || defaultMode

      // Customize view labels based on table type
      const viewLabel = tableName === 'channels' ? 'Chat' : tableName === 'deployments' ? 'Pipeline' : 'Board'
      const ViewIcon = tableName === 'channels' ? MessageSquareIcon : tableName === 'deployments' ? RocketIcon : KanbanIcon

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
            <ViewIcon className={styles.tabMenuOptionIcon} />
            <span>{viewLabel}</span>
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
      const cachedContent = files[tab.path]
      // If cachedContent is undefined, file doesn't exist in the tree
      if (cachedContent === undefined) {
        return <div className={styles.emptyState}>File not found</div>
      }
      return (
        <div className={styles.tabContentInner}>
          <FileBreadcrumb path={tab.path} onNavigate={openFile} />
          <div className={styles.tabContentScrollable}>
            <FileContentLoader
              projectId={activeProject}
              filePath={tab.path}
              cachedContent={cachedContent || undefined}
              onLoadContent={onLoadFileContent}
            />
          </div>
        </div>
      )
    }

    if (tab.type === 'table' && snapshot) {
      const tableName = tab.path as DbTableName
      const defaultMode = tableName === 'tasks' ? 'view' : 'table'
      const viewMode = viewModes[tableName] || defaultMode
      return (
        <DatabaseTableView
          snapshot={snapshot}
          tableName={tableName}
          viewMode={viewMode}
          onRowClick={(record, key) => openRecord(tableName, record, key)}
          onWorkloadClick={(workload: Workload) => openRecord('workloads', workload as unknown as Record<string, unknown>, workload.id)}
        />
      )
    }

    if (tab.type === 'record') {
      // Try to get record from tab, or fetch it from snapshot if tab was restored
      let record = tab.record
      if (!record && tab.tableName && snapshot) {
        const [, key] = tab.path.split(':')
        const tableData = snapshot[tab.tableName] as Record<string, unknown>[] | undefined
        record = tableData?.find(r => String(r.id || r.key) === key)
      }
      if (!record) {
        return <div className={styles.emptyState}>Record not found</div>
      }
      return (
        <div className={styles.tabContentInner}>
          <RecordDetailView
            record={record}
            tableName={tab.tableName || 'Record'}
            viewMode={getRecordViewMode(tab.id)}
          />
        </div>
      )
    }

    if (tab.type === 'service') {
      // Try to get metadata from tab, or load it if tab was restored
      let metadata = tab.serviceMetadata
      let readme = tab.serviceReadme
      if (!metadata) {
        const serviceJsonPath = `${tab.path}/service.json`
        const readmePath = `${tab.path}/README.md`
        try {
          const content = files[serviceJsonPath]
          if (content) {
            metadata = JSON.parse(content)
          }
        } catch {
          // Invalid JSON
        }
        readme = files[readmePath]
      }
      if (!metadata) {
        return <div className={styles.emptyState}>Service not found</div>
      }
      return (
        <div className={styles.tabContentInner}>
          <ServiceView
            metadata={metadata}
            readme={readme}
            servicePath={tab.path}
            onFileClick={openFile}
          />
        </div>
      )
    }

    if (tab.type === 'agentSession') {
      return (
        <div className={styles.tabContentInner}>
          <AgentSessionProgressPanel
            sessionId={tab.path}
            onClose={() => closeTab(tab.id, tab.pane)}
            onRetry={(newSessionId) => {
              // Close the current failed session tab and open the new retry session
              closeTab(tab.id, tab.pane)
              openAgentSession(newSessionId)
            }}
          />
        </div>
      )
    }

    if (tab.type === 'agent' && tab.agentId) {
      const agent = agents.find(a => a.id === tab.agentId)
      if (!agent) {
        return <div className={styles.emptyState}>Agent not found</div>
      }

      // Try all possible locations for prompt files
      const promptContent =
        files[`.agentforge/agents/${agent.id}.md`] ||
        files[`.agentforge/prompts/${agent.id}.md`] ||
        files[`prompts/${agent.id}.md`]

      return (
        <AgentPage
          agent={agent}
          projectId={activeProject}
          promptContent={promptContent}
          onRunAgent={(agentId) => {
            setPreselectedAgentForModal(agentId)
            setShowStartSessionModal(true)
          }}
          onSessionSelect={openAgentSession}
        />
      )
    }

    return null
  }

  return (
    <div className={styles.container} ref={containerRef}>
      <div className={styles.splitPane}>
        <div className={styles.sidebar} style={{ width: sidebarWidth }}>
          <div className={styles.sidebarSection}>
            <div className={styles.sidebarHeader}>
              <span>Project</span>
              <label className={styles.simpleModeToggle}>
                <input
                  type="checkbox"
                  checked={simpleMode}
                  onChange={e => setSimpleMode(e.target.checked)}
                />
                <span>Simple</span>
              </label>
            </div>
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
                  onServiceSelect={openService}
                />
              ))}
            </div>
          </div>
          <div className={styles.sidebarSection}>
            <div className={styles.sidebarHeader}>
              <span>Agents</span>
              <button
                className={styles.sidebarAddButton}
                disabled
                title='Coming soon'
              >
                +
              </button>
            </div>
            <div className={styles.sidebarContent}>
              <AgentBrowser
                agents={agents}
                selectedAgent={selectedAgent}
                onAgentSelect={(agentId) => {
                  setSelectedAgent(agentId)
                  openAgent(agentId)
                }}
              />
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
        <div
          className={styles.sidebarResizer}
          onMouseDown={handleSidebarMouseDown}
        />
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
      {showStartSessionModal && (
        <StartAgentSessionModal
          projectId={activeProject}
          projectName={projectDisplayNames?.[activeProject] || activeProject}
          agents={agents.length > 0 ? agents : undefined}
          preselectedAgent={preselectedAgentForModal}
          onClose={() => {
            setShowStartSessionModal(false)
            setPreselectedAgentForModal(undefined)
          }}
          onSessionCreated={(sessionId) => {
            setShowStartSessionModal(false)
            setPreselectedAgentForModal(undefined)
            openAgentSession(sessionId)
          }}
        />
      )}
    </div>
  )
}
