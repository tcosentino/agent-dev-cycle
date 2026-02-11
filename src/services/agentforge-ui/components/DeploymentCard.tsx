import { useMemo } from 'react'
import {
  CheckCircleIcon,
  ClockIcon,
  AlertTriangleIcon,
  GitBranchIcon,
  RocketIcon,
  PlayIcon,
  XCircleIcon,
  DeploymentStatusBadge,
} from '@agentforge/ui-components'
import type { Deployment, Workload } from '../types'
import { WorkloadCard } from './WorkloadCard'
import styles from '../ProjectViewer.module.css'

export interface DeploymentCardProps {
  deployment: Deployment
  workloads: Workload[]
  onWorkloadClick: (workload: Workload) => void
  onViewLogs: (workload: Workload) => void
  onDelete: (deployment: Deployment) => void
}

export function DeploymentCard({
  deployment,
  workloads,
  onWorkloadClick,
  onViewLogs,
  onDelete,
}: DeploymentCardProps) {
  const statusIcons: Record<Deployment['status'], React.ReactNode> = {
    pending: <ClockIcon className={styles.deploymentStatusIcon} />,
    running: <PlayIcon className={`${styles.deploymentStatusIcon} ${styles.spinning}`} />,
    success: <CheckCircleIcon className={styles.deploymentStatusIcon} style={{ color: 'var(--success)' }} />,
    failed: <AlertTriangleIcon className={styles.deploymentStatusIcon} style={{ color: 'var(--error)' }} />,
    stopped: <ClockIcon className={styles.deploymentStatusIcon} />,
  }

  const triggerLabel = useMemo(() => {
    if (!deployment.trigger) {
      return 'manual'
    }
    switch (deployment.trigger.type) {
      case 'agent':
        return `by ${deployment.trigger.agentName || 'Agent'}`
      case 'git-push':
        return `push to ${deployment.trigger.branch}`
      case 'manual':
        return 'manual'
      case 'schedule':
        return 'scheduled'
      default:
        return ''
    }
  }, [deployment.trigger])

  const deploymentName = (deployment as any).serviceName || deployment.name || 'Unnamed deployment'

  return (
    <div className={styles.deploymentCard}>
      <div className={styles.deploymentHeader}>
        <div className={styles.deploymentTitle}>
          {statusIcons[deployment.status]}
          <RocketIcon className={styles.deploymentIcon} />
          <span className={styles.deploymentName}>{deploymentName}</span>
          <DeploymentStatusBadge
            status={deployment.status}
            lastCheckTime={deployment.updatedAt}
            showTooltip={true}
          />
        </div>
        <div className={styles.deploymentMeta}>
          {deployment.trigger?.branch && (
            <span className={styles.deploymentBranch}>
              <GitBranchIcon className={styles.branchIcon} />
              {deployment.trigger.branch}
            </span>
          )}
          <span className={styles.deploymentTrigger}>{triggerLabel}</span>
          <span className={styles.deploymentTime}>
            {new Date(deployment.createdAt).toLocaleString()}
          </span>
          <button
            className={styles.deleteDeploymentButton}
            onClick={() => onDelete(deployment)}
            title="Delete deployment"
          >
            <XCircleIcon />
          </button>
        </div>
      </div>
      {deployment.description && (
        <p className={styles.deploymentDescription}>{deployment.description}</p>
      )}
      <div className={styles.deploymentWorkloads}>
        {workloads.map(workload => (
          <WorkloadCard
            key={workload.id}
            workload={workload}
            onClick={() => onWorkloadClick(workload)}
            onViewLogs={onViewLogs}
          />
        ))}
      </div>
    </div>
  )
}
