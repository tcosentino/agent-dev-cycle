import { StrictMode, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { Nav } from '../demo-ui/components/nav'
import { ProjectViewer } from './ProjectViewer'
import { api, fetchProjectSnapshot } from './api'
import type { ApiProject } from './api'
import type { ProjectData, DbSnapshot, ProjectDbData } from './types'
import './components/shared/tokens.css'
import './project-viewer.css'

function ProjectViewerPage() {
  const [projects, setProjects] = useState<ApiProject[]>([])
  const [dbData, setDbData] = useState<ProjectDbData>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load projects from API on mount
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        setError(null)

        // Fetch projects from API
        const apiProjects = await api.projects.list()
        setProjects(apiProjects)

        // Fetch snapshots for each project, keyed by project ID
        const snapshots: ProjectDbData = {}
        for (const project of apiProjects) {
          try {
            const snapshot = await fetchProjectSnapshot(project.id)
            snapshots[project.id] = snapshot as unknown as DbSnapshot
          } catch (err) {
            console.warn(`Failed to load snapshot for project ${project.name}:`, err)
          }
        }
        setDbData(snapshots)
      } catch (err) {
        console.error('Failed to load projects:', err)
        setError(err instanceof Error ? err.message : 'Failed to load projects')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Build project data from API projects
  // Key by project ID, files will be empty for now (could fetch from repo later)
  const projectData: ProjectData = {}
  for (const project of projects) {
    projectData[project.id] = {}
  }

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
            <p>Loading projects...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="viewer-page">
        <Nav currentPage="components" />
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
        <Nav currentPage="components" />
        <div className="viewer-body">
          <div className="loading-state">
            <p>No projects found</p>
            <p className="error-hint">Run `yarn seed` to create sample projects</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="viewer-page">
      <Nav currentPage="components" />
      <div className="viewer-body">
        <ProjectViewer
          projects={projectData}
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
