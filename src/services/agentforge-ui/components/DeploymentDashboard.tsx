import { useState, useEffect } from 'react'
import { RocketIcon } from '@agentforge/ui-components'
import type { Deployment, Workload } from '../types'
import { getDeployments, getWorkloads, getWorkloadLogs } from '../api'
import { DeploymentListView } from './DeploymentViews'
import type { LogEntry } from './LogViewer'
import { LogViewer } from './LogViewer'
import styles from './DeploymentDashboard.module.css'

export interface DeploymentDashboardProps {
  projectId: string
  onWorkloadClick: (workload: Workload) => void
}

/**
 * Deployment Dashboard - View all deployments and workloads for a project
 * - Fetches deployments and workloads on mount
 * - Displays deployment cards in grid
 * - Integrates LogViewer for viewing logs
 * - Shows empty state when no deployments
 */
export function DeploymentDashboard({ projectId, onWorkloadClick }: DeploymentDashboardProps) {
  const [deployments, setDeployments] = useState<Deployment[]>([])
  const [workloads, setWorkloads] = useState<Workload[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch deployments and workloads
  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      setError(null)
      try {
        const deps = await getDeployments(projectId)
        setDeployments(deps)

        // Fetch workloads for each deployment
        const allWorkloads: Workload[] = []
        for (const dep of deps) {
          const workloadsForDep = await getWorkloads(dep.id)
          allWorkloads.push(...workloadsForDep)
        }
        setWorkloads(allWorkloads)
      } catch (err) {
        console.error('Failed to fetch deployments:', err)
        setError('Failed to load deployments. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [projectId])

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <RocketIcon className={styles.loadingIcon} />
          <p>Loading deployments...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <p className={styles.errorMessage}>{error}</p>
          <button 
            className={styles.retryButton}
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (deployments.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <RocketIcon className={styles.emptyIcon} />
          <h2>No deployments yet</h2>
          <p>Deployments will appear here once you deploy services from this project.</p>
        </div>
      </div>
    )
  }

  // Create snapshot-like structure for DeploymentListView
  const snapshot = {
    deployments,
    workloads,
  }

  return (
    <div className={styles.container}>
      <DeploymentListView 
        snapshot={snapshot as any} 
        onWorkloadClick={onWorkloadClick}
      />
    </div>
  )
}
