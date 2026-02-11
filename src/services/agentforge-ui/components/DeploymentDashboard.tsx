import { RocketIcon } from '@agentforge/ui-components'
import type { Workload } from '../types'
import { DeploymentListView } from './DeploymentViews'
import { useDeploymentStream } from '../hooks/useDeploymentStream'
import styles from './DeploymentDashboard.module.css'

export interface DeploymentDashboardProps {
  projectId: string
  onWorkloadClick: (workload: Workload) => void
}

/**
 * Deployment Dashboard - View all deployments and workloads for a project
 * - Uses SSE stream for real-time deployment updates
 * - Displays deployment cards in grid
 * - Shows empty state when no deployments
 */
export function DeploymentDashboard({ projectId, onWorkloadClick }: DeploymentDashboardProps) {
  const { deployments, isLoading, isConnected, error, reconnect } = useDeploymentStream(projectId)

  if (isLoading) {
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
            onClick={reconnect}
          >
            Reconnect
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

  // Flatten workloads from deployments for DeploymentListView
  const allWorkloads = deployments.flatMap(d => d.workloads)

  // Create snapshot-like structure for DeploymentListView
  const snapshot = {
    deployments: deployments.map(d => ({
      id: d.id,
      projectId: d.projectId,
      name: d.name,
      description: d.description,
      trigger: d.trigger,
      status: d.status,
      workloadIds: d.workloadIds,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
      completedAt: d.completedAt,
    })),
    workloads: allWorkloads,
  }

  return (
    <div className={styles.container}>
      {!isConnected && (
        <div className={styles.connectionWarning}>
          Connection lost - Updates may be delayed
        </div>
      )}
      <DeploymentListView
        snapshot={snapshot as any}
        onWorkloadClick={onWorkloadClick}
      />
    </div>
  )
}
