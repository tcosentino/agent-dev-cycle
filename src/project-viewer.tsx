import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Nav } from './components/nav'
import { ProjectViewer } from './components/project-viewer/ProjectViewer'
import type { ProjectData, DbSnapshot, ProjectDbData } from './components/project-viewer/types'
import './components/shared/tokens.css'
import './project-viewer.css'

// Load all project files at build time.
// To support remote repos later, swap this data source --
// ProjectViewer only needs Record<projectName, Record<path, content>>.
const rawFiles = import.meta.glob(
  '/example-projects/**/*',
  { query: '?raw', import: 'default', eager: true }
) as Record<string, string>

// Load db snapshots separately (as JSON, not raw text)
const dbSnapshots = import.meta.glob(
  '/example-projects/**/.agentforge/db-snapshot.json',
  { import: 'default', eager: true }
) as Record<string, DbSnapshot>

function buildProjectMap(files: Record<string, string>): ProjectData {
  const projects: ProjectData = {}
  for (const [fullPath, content] of Object.entries(files)) {
    const withoutPrefix = fullPath.replace('/example-projects/', '')
    const slashIndex = withoutPrefix.indexOf('/')
    if (slashIndex === -1) continue
    const projectName = withoutPrefix.slice(0, slashIndex)
    const relativePath = withoutPrefix.slice(slashIndex + 1)
    if (!projects[projectName]) projects[projectName] = {}
    projects[projectName][relativePath] = content
  }
  return projects
}

function buildDbMap(snapshots: Record<string, DbSnapshot>): ProjectDbData {
  const result: ProjectDbData = {}
  for (const [path, snapshot] of Object.entries(snapshots)) {
    // Path format: /example-projects/{projectName}/.agentforge/db-snapshot.json
    const match = path.match(/\/example-projects\/([^/]+)\//)
    if (match) {
      result[match[1]] = snapshot
    }
  }
  return result
}

const projects = buildProjectMap(rawFiles)
const dbData = buildDbMap(dbSnapshots)

function ProjectViewerPage() {
  return (
    <div className="viewer-page">
      <Nav currentPage="components" />
      <div className="viewer-body">
        <ProjectViewer projects={projects} dbData={dbData} />
      </div>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ProjectViewerPage />
  </StrictMode>
)
