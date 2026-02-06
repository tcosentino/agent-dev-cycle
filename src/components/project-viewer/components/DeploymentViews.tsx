import { useMemo } from 'react'
import {
  CheckCircleIcon,
  ClockIcon,
  AlertTriangleIcon,
  GitBranchIcon,
  ServerIcon,
  PlayIcon,
  RocketIcon,
} from '../../shared/icons'
import type { DbSnapshot, Deployment, Workload, WorkloadStage, StageStatus } from '../types'
import styles from '../ProjectViewer.module.css'

// --- Stage Progress Indicator ---

const STAGE_ORDER: WorkloadStage[] = ['validate', 'build', 'deploy', 'healthcheck', 'test', 'complete']

function StageIndicator({ stage, status }: { stage: WorkloadStage; status: StageStatus }) {
  const getIcon = () => {
    if (status === 'success') return <CheckCircleIcon className={styles.stageIconSuccess} />
    if (status === 'failed') return <AlertTriangleIcon className={styles.stageIconFailed} />
    if (status === 'running') return <PlayIcon className={styles.stageIconRunning} />
    return <div className={styles.stageIconPending} />
  }

  return (
    <div className={`${styles.stageIndicator} ${styles[`stage-${status}`]}`} title={`${stage}: ${status}`}>
      {getIcon()}
      <span className={styles.stageLabel}>{stage}</span>
    </div>
  )
}

function WorkloadStages({ workload }: { workload: Workload }) {
  const stageStatuses = useMemo(() => {
    const statuses: Record<WorkloadStage, StageStatus> = {
      pending: 'pending',
      validate: 'pending',
      build: 'pending',
      deploy: 'pending',
      healthcheck: 'pending',
      test: 'pending',
      complete: 'pending',
      failed: 'skipped',
      rolledback: 'skipped',
    }

    for (const result of workload.stages) {
      statuses[result.stage] = result.status
    }

    // Mark current stage as running if workload is running
    if (workload.status === 'running' && workload.currentStage) {
      const currentStageResult = workload.stages.find(s => s.stage === workload.currentStage)
      if (!currentStageResult || currentStageResult.status === 'pending') {
        statuses[workload.currentStage] = 'running'
      }
    }

    return statuses
  }, [workload])

  return (
    <div className={styles.workloadStages}>
      {STAGE_ORDER.map((stage, i) => (
        <div key={stage} className={styles.stageStep}>
          <StageIndicator stage={stage} status={stageStatuses[stage]} />
          {i < STAGE_ORDER.length - 1 && <div className={styles.stageConnector} />}
        </div>
      ))}
    </div>
  )
}

// --- Workload Card ---

function WorkloadCard({
  workload,
  onClick,
}: {
  workload: Workload
  onClick: () => void
}) {
  const statusColors: Record<Workload['status'], string> = {
    pending: 'var(--text-tertiary)',
    running: 'var(--accent-primary)',
    success: 'var(--success)',
    failed: 'var(--error)',
    rolledback: 'var(--warning)',
    stopped: 'var(--text-tertiary)',
  }

  const duration = useMemo(() => {
    if (!workload.completedAt) return null
    const start = new Date(workload.createdAt).getTime()
    const end = new Date(workload.completedAt).getTime()
    const seconds = Math.round((end - start) / 1000)
    if (seconds < 60) return `${seconds}s`
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
  }, [workload])

  return (
    <button className={styles.workloadCard} onClick={onClick}>
      <div className={styles.workloadHeader}>
        <ServerIcon className={styles.workloadIcon} />
        <span className={styles.workloadName}>{workload.moduleName}</span>
        <span
          className={styles.workloadStatus}
          style={{ color: statusColors[workload.status] }}
        >
          {workload.status}
        </span>
      </div>
      <WorkloadStages workload={workload} />
      <div className={styles.workloadMeta}>
        <span className={styles.workloadType}>{workload.moduleType}</span>
        {workload.artifacts?.url && (
          <a
            href={workload.artifacts.url}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.workloadUrl}
            onClick={(e) => e.stopPropagation()}
          >
            {workload.artifacts.url}
          </a>
        )}
        {duration && <span className={styles.workloadDuration}>{duration}</span>}
      </div>
    </button>
  )
}

// --- Deployment Card ---

function DeploymentCard({
  deployment,
  workloads,
  onWorkloadClick,
}: {
  deployment: Deployment
  workloads: Workload[]
  onWorkloadClick: (workload: Workload) => void
}) {
  const statusIcons: Record<Deployment['status'], React.ReactNode> = {
    pending: <ClockIcon className={styles.deploymentStatusIcon} />,
    running: <PlayIcon className={`${styles.deploymentStatusIcon} ${styles.spinning}`} />,
    success: <CheckCircleIcon className={styles.deploymentStatusIcon} style={{ color: 'var(--success)' }} />,
    failed: <AlertTriangleIcon className={styles.deploymentStatusIcon} style={{ color: 'var(--error)' }} />,
    stopped: <ClockIcon className={styles.deploymentStatusIcon} />,
  }

  const triggerLabel = useMemo(() => {
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

  return (
    <div className={styles.deploymentCard}>
      <div className={styles.deploymentHeader}>
        <div className={styles.deploymentTitle}>
          {statusIcons[deployment.status]}
          <RocketIcon className={styles.deploymentIcon} />
          <span className={styles.deploymentName}>{deployment.name}</span>
        </div>
        <div className={styles.deploymentMeta}>
          {deployment.trigger.branch && (
            <span className={styles.deploymentBranch}>
              <GitBranchIcon className={styles.branchIcon} />
              {deployment.trigger.branch}
            </span>
          )}
          <span className={styles.deploymentTrigger}>{triggerLabel}</span>
          <span className={styles.deploymentTime}>
            {new Date(deployment.createdAt).toLocaleString()}
          </span>
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
          />
        ))}
      </div>
    </div>
  )
}

// --- Main Deployment List View ---

export function DeploymentListView({
  snapshot,
  onWorkloadClick,
}: {
  snapshot: DbSnapshot
  onWorkloadClick: (workload: Workload) => void
}) {
  const deployments = snapshot.deployments || []
  const workloads = snapshot.workloads || []

  const deploymentsWithWorkloads = useMemo(() => {
    return deployments.map(dep => ({
      deployment: dep,
      workloads: workloads.filter(w => dep.workloadIds.includes(w.id)),
    }))
  }, [deployments, workloads])

  if (deployments.length === 0) {
    return <div className={styles.emptyState}>No deployments yet</div>
  }

  return (
    <div className={styles.deploymentListView}>
      {deploymentsWithWorkloads.map(({ deployment, workloads }) => (
        <DeploymentCard
          key={deployment.id}
          deployment={deployment}
          workloads={workloads}
          onWorkloadClick={onWorkloadClick}
        />
      ))}
    </div>
  )
}

// --- Workload Detail View ---

export function WorkloadDetailView({ workload }: { workload: Workload }) {
  return (
    <div className={styles.workloadDetailView}>
      <div className={styles.workloadDetailHeader}>
        <ServerIcon className={styles.workloadDetailIcon} />
        <div>
          <h2 className={styles.workloadDetailName}>{workload.moduleName}</h2>
          <span className={styles.workloadDetailType}>{workload.moduleType}</span>
        </div>
        <span className={`${styles.workloadDetailStatus} ${styles[`status-${workload.status}`]}`}>
          {workload.status}
        </span>
      </div>

      {workload.artifacts && (
        <div className={styles.workloadArtifacts}>
          <h3>Artifacts</h3>
          <dl>
            {workload.artifacts.imageName && (
              <>
                <dt>Image</dt>
                <dd>{workload.artifacts.imageName}</dd>
              </>
            )}
            {workload.artifacts.containerName && (
              <>
                <dt>Container</dt>
                <dd>{workload.artifacts.containerName}</dd>
              </>
            )}
            {workload.artifacts.url && (
              <>
                <dt>URL</dt>
                <dd>
                  <a href={workload.artifacts.url} target="_blank" rel="noopener noreferrer">
                    {workload.artifacts.url}
                  </a>
                </dd>
              </>
            )}
            {workload.artifacts.port && (
              <>
                <dt>Port</dt>
                <dd>{workload.artifacts.port}</dd>
              </>
            )}
          </dl>
        </div>
      )}

      <div className={styles.workloadStageDetails}>
        <h3>Pipeline Stages</h3>
        {workload.stages.map((stage, i) => (
          <div key={i} className={`${styles.stageDetail} ${styles[`stage-${stage.status}`]}`}>
            <div className={styles.stageDetailHeader}>
              <span className={styles.stageDetailName}>{stage.stage}</span>
              <span className={styles.stageDetailStatus}>{stage.status}</span>
              {stage.duration && (
                <span className={styles.stageDetailDuration}>{stage.duration}ms</span>
              )}
            </div>
            {stage.logs && stage.logs.length > 0 && (
              <pre className={styles.stageDetailLogs}>
                {stage.logs.join('\n')}
              </pre>
            )}
            {stage.error && (
              <div className={styles.stageDetailError}>{stage.error}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
