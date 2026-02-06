import { StrictMode, useState, useEffect, useCallback } from 'react'
import { createRoot } from 'react-dom/client'
import { Nav } from '../demo-ui/components/nav'
import { ProjectViewer } from './ProjectViewer'
import { CreateProjectModal } from './components/CreateProjectModal'
import { api, fetchProjectSnapshot, fetchProjectFiles, AuthError } from './api'
import type { ApiProject, ApiUser } from './api'
import type { ProjectData, DbSnapshot, ProjectDbData } from './types'
import './components/shared/tokens.css'
import './project-viewer.css'

function ProjectViewerPage() {
  const [user, setUser] = useState<ApiUser | null>(null)
  const [projects, setProjects] = useState<ApiProject[]>([])
  const [projectFiles, setProjectFiles] = useState<ProjectData>({})
  const [dbData, setDbData] = useState<ProjectDbData>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

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

  // Build display names for project selector
  const projectDisplayNames: Record<string, string> = {}
  for (const project of projects) {
    projectDisplayNames[project.id] = `${project.name} (${project.key})`
  }

  if (loading) {
    return (
      <div className="viewer-page">
        <Nav currentPage="components" />
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
        <Nav currentPage="components" />
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
        <Nav currentPage="components" user={user} />
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
        <Nav currentPage="components" user={user} />
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
      <Nav currentPage="components" user={user} />
      <div className="viewer-body">
        <ProjectViewer
          projects={projectFiles}
          dbData={dbData}
          projectDisplayNames={projectDisplayNames}
        />
      </div>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ProjectViewerPage />
  </StrictMode>
)
