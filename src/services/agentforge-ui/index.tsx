import { StrictMode, useState, useEffect, useCallback, useMemo } from 'react'
import { createRoot } from 'react-dom/client'
import { Nav } from '../demo-ui/components/nav'
import { ProjectViewer } from './ProjectViewer'
import { CreateProjectModal } from './components/CreateProjectModal'
import { SettingsPage } from './components/SettingsPage'
import { QueryProvider } from '../../providers/QueryProvider'
import { ToastProvider } from '@agentforge/ui-components'
import { api, fetchProjectSnapshot, fetchProjectFiles, fetchFileContent, AuthError } from './api'
import type { ApiProject, ApiUser } from './api'
import type { ProjectData, DbSnapshot, ProjectDbData } from './types'
import '@agentforge/ui-components/styles/tokens.css'
import './project-viewer.css'

type CurrentPage = 'projects' | 'settings'

// LocalStorage key for persisted project viewer state (matches ProjectViewer)
const STORAGE_KEY = 'projectViewer:state'

function getPersistedProjectId(): string | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return parsed.activeProject || null
    }
  } catch {
    // Invalid or no stored state
  }
  return null
}

function ProjectViewerPage() {
  const [user, setUser] = useState<ApiUser | null>(null)
  const [projects, setProjects] = useState<ApiProject[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [projectFiles, setProjectFiles] = useState<ProjectData>({})
  const [dbData, setDbData] = useState<ProjectDbData>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [currentPage, setCurrentPage] = useState<CurrentPage>('projects')

  // Check authentication and load data
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        setError(null)

        // First check if user is authenticated
        let currentUser: ApiUser
        try {
          currentUser = await api.me()
          setUser(currentUser)
        } catch (err) {
          if (err instanceof AuthError) {
            // Not logged in - this is expected
            setLoading(false)
            return
          }
          throw err
        }

        // Fetch projects for this user
        const apiProjects = await api.projects.list(currentUser.id)
        setProjects(apiProjects)

        // Fetch files and snapshots for each project
        const files: ProjectData = {}
        const snapshots: ProjectDbData = {}

        for (const project of apiProjects) {
          // Fetch files from GitHub if project has a repoUrl
          if (project.repoUrl) {
            try {
              files[project.id] = await fetchProjectFiles(project.repoUrl)
            } catch (err) {
              console.warn(`Failed to load files for project ${project.name}:`, err)
              files[project.id] = {}
            }
          } else {
            files[project.id] = {}
          }

          // Fetch database snapshot
          try {
            const snapshot = await fetchProjectSnapshot(project.id)
            snapshots[project.id] = snapshot as unknown as DbSnapshot
          } catch (err) {
            console.warn(`Failed to load snapshot for project ${project.name}:`, err)
          }
        }

        setProjectFiles(files)
        setDbData(snapshots)

        // Set initial selected project (respect persisted selection)
        if (apiProjects.length > 0) {
          const persistedId = getPersistedProjectId()
          const validPersistedId = persistedId && apiProjects.some(p => p.id === persistedId)
          setSelectedProjectId(validPersistedId ? persistedId : apiProjects[0].id)
        }
      } catch (err) {
        console.error('Failed to load data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Handle project creation
  const handleProjectCreated = useCallback(async (project: ApiProject) => {
    setShowCreateModal(false)
    setProjects(prev => [...prev, project])

    // Load files and snapshot for the new project
    const files: Record<string, string> = {}
    if (project.repoUrl) {
      try {
        const projectFiles = await fetchProjectFiles(project.repoUrl)
        Object.assign(files, projectFiles)
      } catch (err) {
        console.warn(`Failed to load files for project ${project.name}:`, err)
      }
    }
    setProjectFiles(prev => ({ ...prev, [project.id]: files }))

    try {
      const snapshot = await fetchProjectSnapshot(project.id)
      setDbData(prev => ({ ...prev, [project.id]: snapshot as unknown as DbSnapshot }))
    } catch (err) {
      console.warn(`Failed to load snapshot for project ${project.name}:`, err)
    }
  }, [])

  // Build display names and repo URLs for project selector (memoized to prevent recreating on every render)
  const projectDisplayNames = useMemo(() => {
    const names: Record<string, string> = {}
    for (const project of projects) {
      names[project.id] = `${project.name} (${project.key})`
    }
    return names
  }, [projects])

  const projectRepoUrls = useMemo(() => {
    const urls: Record<string, string> = {}
    for (const project of projects) {
      if (project.repoUrl) {
        urls[project.id] = project.repoUrl
      }
    }
    return urls
  }, [projects])

  // Handler to refresh snapshot for a project
  const handleRefreshSnapshot = useCallback(async (projectId: string) => {
    try {
      const snapshot = await fetchProjectSnapshot(projectId)
      setDbData(prev => ({ ...prev, [projectId]: snapshot as unknown as DbSnapshot }))
    } catch (err) {
      console.error(`Failed to refresh snapshot for project ${projectId}:`, err)
    }
  }, [])

  // Handler to load file content on demand
  const handleLoadFileContent = useCallback(async (projectId: string, filePath: string): Promise<string> => {
    const repoUrl = projectRepoUrls[projectId]
    if (!repoUrl) {
      throw new Error('No repo URL for project')
    }
    const content = await fetchFileContent(repoUrl, filePath)
    // Update the cached content
    setProjectFiles(prev => ({
      ...prev,
      [projectId]: {
        ...prev[projectId],
        [filePath]: content,
      },
    }))
    return content
  }, [projectRepoUrls])

  // Build project selector component
  const projectSelector = projects.length > 0 ? (
    <>
      <button
        onClick={() => setShowCreateModal(true)}
        style={{
          padding: '0.5rem 1rem',
          fontSize: '0.85rem',
          background: 'var(--bg-tertiary)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          color: 'var(--text-primary)',
          cursor: 'pointer',
        }}
      >
        + New Project
      </button>
      <select
        className="nav-project-select"
        value={selectedProjectId}
        onChange={(e) => setSelectedProjectId(e.target.value)}
        style={{
          padding: '0.5rem 1rem',
          fontSize: '0.85rem',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          color: 'var(--text-primary)',
          cursor: 'pointer',
        }}
      >
        {projects.map(project => (
          <option key={project.id} value={project.id}>
            {project.name} ({project.key})
          </option>
        ))}
      </select>
      {projectRepoUrls[selectedProjectId] && (
        <a
          href={projectRepoUrls[selectedProjectId]}
          target="_blank"
          rel="noopener noreferrer"
          title="Open repository in GitHub"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0.5rem',
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            color: 'var(--text-primary)',
            textDecoration: 'none',
          }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            style={{ width: '18px', height: '18px' }}
          >
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
        </a>
      )}
    </>
  ) : null

  // Settings page
  if (currentPage === 'settings' && user) {
    return (
      <div className="viewer-page">
        <Nav
          currentPage="settings"
          user={user}
          onSettingsClick={() => setCurrentPage('settings')}
          projectSelector={projectSelector}
        />
        <div className="viewer-body">
          <SettingsPage onBack={() => setCurrentPage('projects')} />
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="viewer-page">
        <Nav currentPage="components" projectSelector={null} />
        <div className="viewer-body">
          <div className="loading-state">
            <div className="loading-spinner" />
            <p>Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  // Not logged in - show login button
  if (!user) {
    return (
      <div className="viewer-page">
        <Nav currentPage="components" projectSelector={null} />
        <div className="viewer-body">
          <div className="login-state">
            <h2>Welcome to AgentForge</h2>
            <p>Sign in with GitHub to view your projects</p>
            <a href={api.getLoginUrl()} className="login-button">
              Log in with GitHub
            </a>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="viewer-page">
        <Nav
          currentPage="components"
          user={user}
          onSettingsClick={() => setCurrentPage('settings')}
          projectSelector={projectSelector}
        />
        <div className="viewer-body">
          <div className="error-state">
            <p>Error: {error}</p>
            <p className="error-hint">Make sure the API server is running (yarn dev:server)</p>
          </div>
        </div>
      </div>
    )
  }

  if (projects.length === 0) {
    return (
      <div className="viewer-page">
        <Nav
          currentPage="components"
          user={user}
          onSettingsClick={() => setCurrentPage('settings')}
          projectSelector={projectSelector}
        />
        <div className="viewer-body">
          <div className="empty-state">
            <h2>No projects yet</h2>
            <p>Create a project to get started with AgentForge</p>
            <button
              className="create-project-button"
              onClick={() => setShowCreateModal(true)}
            >
              Create Project
            </button>
          </div>
        </div>
        {showCreateModal && user && (
          <CreateProjectModal
            userId={user.id}
            onClose={() => setShowCreateModal(false)}
            onProjectCreated={handleProjectCreated}
          />
        )}
      </div>
    )
  }

  return (
    <div className="viewer-page">
      <Nav
        currentPage="components"
        user={user}
        onSettingsClick={() => setCurrentPage('settings')}
        projectSelector={projectSelector}
      />
      <div className="viewer-body">
        <ProjectViewer
          projects={projectFiles}
          dbData={dbData}
          projectDisplayNames={projectDisplayNames}
          selectedProjectId={selectedProjectId}
          currentUserId={user?.id}
          onLoadFileContent={handleLoadFileContent}
          onRefreshSnapshot={handleRefreshSnapshot}
        />
      </div>
      {showCreateModal && user && (
        <CreateProjectModal
          userId={user.id}
          onClose={() => setShowCreateModal(false)}
          onProjectCreated={handleProjectCreated}
        />
      )}
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryProvider>
      <ToastProvider>
        <ProjectViewerPage />
      </ToastProvider>
    </QueryProvider>
  </StrictMode>
)
