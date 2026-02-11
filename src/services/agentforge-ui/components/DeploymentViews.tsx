import { useMemo, useState } from 'react'
import {
  CheckCircleIcon,
  ClockIcon,
  AlertTriangleIcon,
  GitBranchIcon,
  ServerIcon,
  PlayIcon,
  RocketIcon,
  FileDocumentIcon,
  ClipboardIcon,
  XCircleIcon,
  Modal,
  useToast,
} from '@agentforge/ui-components'
import type { DbSnapshot, Deployment, Workload, WorkloadStage, StageStatus } from '../types'
import { HealthBadge } from './HealthBadge'
import { LogViewer } from './LogViewer'
import { getWorkloadLogs } from '../api'
import type { LogEntry } from './LogViewer'
import styles from '../ProjectViewer.module.css'
import modalStyles from '@agentforge/ui-components/components/Modal/Modal.module.css'

// --- Stage Progress Indicator ---

const STAGE_ORDER: WorkloadStage[] = ['starting-container', 'cloning-repo', 'starting-service', 'running', 'graceful-shutdown', 'stopped']

const STAGE_LABELS: Record<WorkloadStage, string> = {
  'pending': 'Pending',
  'starting-container': 'Starting Container',
  'cloning-repo': 'Cloning Repository',
  'starting-service': 'Starting Service',
  'running': 'Running',
  'graceful-shutdown': 'Graceful Shutdown',
  'stopped': 'Stopped',
  'failed': 'Failed',
}

function formatStageName(stage: WorkloadStage): string {
  return STAGE_LABELS[stage] || stage
}

function StageIndicator({ stage, status }: { stage: WorkloadStage; status: StageStatus }) {
  const getIcon = () => {
    if (status === 'success') return <CheckCircleIcon className={styles.stageIconSuccess} />
    if (status === 'failed') return <AlertTriangleIcon className={styles.stageIconFailed} />
    if (status === 'running') return <PlayIcon className={styles.stageIconRunning} />
    return <div className={styles.stageIconPending} />
  }

  return (
    <div className={`${styles.stageIndicator} ${styles[`stage-${status}`]}`} title={`${formatStageName(stage)}: ${status}`}>
      {getIcon()}
      <span className={styles.stageLabel}>{formatStageName(stage)}</span>
    </div>
  )
}

function WorkloadStages({ workload }: { workload: Workload }) {
  const stageStatuses = useMemo(() => {
    const statuses: Record<WorkloadStage, StageStatus> = {
      pending: 'pending',
      'starting-container': 'pending',
      'cloning-repo': 'pending',
      'starting-service': 'pending',
      running: 'pending',
      'graceful-shutdown': 'pending',
      stopped: 'pending',
      failed: 'skipped',
    }

    if (workload.stages) {
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
    } else {
      // Handle new workload schema with single stage field
      const currentStage = (workload as any).stage as WorkloadStage
      if (currentStage && statuses[currentStage] !== undefined) {
        statuses[currentStage] = workload.status === 'running' ? 'running' : 'pending'
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
  onViewLogs,
}: {
  workload: Workload
  onClick: () => void
  onViewLogs: (workload: Workload) => void
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

  const hasLogs = workload.stages
    ? workload.stages.some(stage => stage.logs && stage.logs.length > 0)
    : (workload as any).logs?.length > 0

  const workloadName = workload.moduleName || (workload as any).servicePath || 'Unnamed workload'

  return (
    <button className={styles.workloadCard} onClick={onClick}>
      <div className={styles.workloadHeader}>
        <ServerIcon className={styles.workloadIcon} />
        <span className={styles.workloadName}>{workloadName}</span>
        <span
          className={styles.workloadStatus}
          style={{ color: statusColors[workload.status] }}
        >
          {workload.status}
        </span>
        {hasLogs && (
          <button
            className={styles.viewLogsButton}
            onClick={(e) => {
              e.stopPropagation()
              onViewLogs(workload)
            }}
            title="View Logs"
          >
            <FileDocumentIcon />
            <span>Logs</span>
          </button>
        )}
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
  onViewLogs,
  onDelete,
}: {
  deployment: Deployment
  workloads: Workload[]
  onWorkloadClick: (workload: Workload) => void
  onViewLogs: (workload: Workload) => void
  onDelete: (deployment: Deployment) => void
}) {
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
          <HealthBadge
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

  const [logViewerState, setLogViewerState] = useState<{
    workload: Workload
    logs: LogEntry[]
  } | null>(null)
  const [loadingLogs, setLoadingLogs] = useState(false)
  const [deletingDeployment, setDeletingDeployment] = useState<string | null>(null)
  const [deleteConfirmation, setDeleteConfirmation] = useState<Deployment | null>(null)
  const { showToast } = useToast()

  const deploymentsWithWorkloads = useMemo(() => {
    return deployments
      .map(dep => ({
        deployment: dep,
        workloads: workloads.filter(w => w.deploymentId === dep.id),
      }))
      .sort((a, b) => {
        const dateA = new Date(a.deployment.createdAt || 0).getTime()
        const dateB = new Date(b.deployment.createdAt || 0).getTime()
        return dateB - dateA // Most recent first
      })
  }, [deployments, workloads])

  const handleViewLogs = async (workload: Workload) => {
    setLoadingLogs(true)
    try {
      const logs = await getWorkloadLogs(workload.id)
      setLogViewerState({ workload, logs })
    } catch (error) {
      console.error('Failed to load logs:', error)
      // Show empty logs with error
      setLogViewerState({
        workload,
        logs: [{ stage: 'error', log: 'Failed to load logs', error: String(error) }]
      })
    } finally {
      setLoadingLogs(false)
    }
  }

  const handleDeleteDeployment = async (deployment: Deployment) => {
    setDeleteConfirmation(deployment)
  }

  const confirmDelete = async () => {
    if (!deleteConfirmation) return

    const deploymentName = (deleteConfirmation as any).serviceName || deleteConfirmation.name

    setDeletingDeployment(deleteConfirmation.id)
    setDeleteConfirmation(null)

    showToast({
      type: 'info',
      title: 'Deleting deployment',
      message: `Stopping workloads and cleaning up ${deploymentName}...`,
    })

    try {
      // Get all workloads for this deployment
      const deploymentWorkloads = workloads.filter(w => w.deploymentId === deleteConfirmation.id)

      // Stop all running workloads
      for (const workload of deploymentWorkloads) {
        if (workload.status === 'running') {
          try {
            await fetch(`/api/workloads/${workload.id}/stop`, {
              method: 'POST',
              credentials: 'include',
            })
          } catch (error) {
            console.error(`Failed to stop workload ${workload.id}:`, error)
          }
        }
      }

      // TODO: Clean up Docker containers/processes
      // TODO: Clean up any persistent volumes
      // TODO: Clean up network resources
      // TODO: Clean up any environment-specific resources

      // Delete all workloads
      for (const workload of deploymentWorkloads) {
        try {
          await fetch(`/api/workloads/${workload.id}`, {
            method: 'DELETE',
            credentials: 'include',
          })
        } catch (error) {
          console.error(`Failed to delete workload ${workload.id}:`, error)
        }
      }

      // Delete the deployment
      const response = await fetch(`/api/deployments/${deleteConfirmation.id}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to delete deployment')
      }

      showToast({
        type: 'success',
        title: 'Deployment deleted',
        message: `${deploymentName} has been successfully deleted`,
      })

      // Refresh the page to show updated list
      setTimeout(() => window.location.reload(), 1000)
    } catch (error) {
      console.error('Failed to delete deployment:', error)
      showToast({
        type: 'error',
        title: 'Failed to delete deployment',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      })
    } finally {
      setDeletingDeployment(null)
    }
  }

  if (deployments.length === 0) {
    return <div className={styles.emptyState}>No deployments yet</div>
  }

  return (
    <>
      <div className={styles.deploymentListView}>
        {deploymentsWithWorkloads.map(({ deployment, workloads }) => (
          <DeploymentCard
            key={deployment.id}
            deployment={deployment}
            workloads={workloads}
            onWorkloadClick={onWorkloadClick}
            onViewLogs={handleViewLogs}
            onDelete={handleDeleteDeployment}
          />
        ))}
      </div>
      {logViewerState && (
        <LogViewer
          workloadId={logViewerState.workload.id}
          workloadName={logViewerState.workload.moduleName}
          logs={logViewerState.logs}
          onClose={() => setLogViewerState(null)}
        />
      )}
      {loadingLogs && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingSpinner}>Loading logs...</div>
        </div>
      )}
      {deleteConfirmation && (
        <Modal title="Delete Deployment" onClose={() => setDeleteConfirmation(null)}>
          <div className={modalStyles.modalContent}>
            <p style={{ marginBottom: '16px', color: 'var(--text-primary)' }}>
              Are you sure you want to delete deployment <strong>"{(deleteConfirmation as any).serviceName || deleteConfirmation.name}"</strong>?
            </p>
            <p style={{ marginBottom: '24px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              This will stop all running workloads and clean up resources. This action cannot be undone.
            </p>
            <div className={modalStyles.modalFooter}>
              <button
                className={modalStyles.cancelButton}
                onClick={() => setDeleteConfirmation(null)}
              >
                Cancel
              </button>
              <button
                className={modalStyles.submitButton}
                onClick={confirmDelete}
                disabled={deletingDeployment !== null}
                style={{ background: 'var(--error)' }}
              >
                {deletingDeployment === deleteConfirmation.id ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}

// --- Workload Detail View ---

export function WorkloadDetailView({ workload }: { workload: Workload }) {
  const [copied, setCopied] = useState(false)
  const workloadName = workload.moduleName || (workload as any).servicePath || 'Unnamed workload'
  const workloadType = workload.moduleType || 'service'
  const port = (workload as any).port || workload.artifacts?.port
  const containerId = (workload as any).containerId

  const handleCopyLogs = async () => {
    let logText = ''

    if (workload.stages) {
      logText = workload.stages
        .map(stage => {
          const logs = stage.logs?.join('\n') || ''
          const error = stage.error || ''
          return `[${stage.stage}]\n${logs}${error ? '\nError: ' + error : ''}`
        })
        .join('\n\n')
    } else {
      const logs = (workload as any).logs || []
      logText = logs.map((log: any) => `[${log.stage || 'unknown'}] ${log.message}`).join('\n')
      if ((workload as any).error) {
        logText += `\nError: ${(workload as any).error}`
      }
    }

    try {
      await navigator.clipboard.writeText(logText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy logs:', err)
    }
  }

  return (
    <div className={styles.workloadDetailView}>
      <div className={styles.workloadDetailHeader}>
        <ServerIcon className={styles.workloadDetailIcon} />
        <div>
          <h2 className={styles.workloadDetailName}>{workloadName}</h2>
          <span className={styles.workloadDetailType}>{workloadType}</span>
        </div>
        <span className={`${styles.workloadDetailStatus} ${styles[`status-${workload.status}`]}`}>
          {workload.status}
        </span>
      </div>

      {(workload.artifacts || port || containerId) && (
        <div className={styles.workloadArtifacts}>
          <h3>Artifacts</h3>
          <dl>
            {workload.artifacts?.imageName && (
              <>
                <dt>Image</dt>
                <dd>{workload.artifacts.imageName}</dd>
              </>
            )}
            {(containerId || workload.artifacts?.containerName) && (
              <>
                <dt>Container</dt>
                <dd>{containerId || workload.artifacts?.containerName}</dd>
              </>
            )}
            {workload.artifacts?.url && (
              <>
                <dt>URL</dt>
                <dd>
                  <a href={workload.artifacts.url} target="_blank" rel="noopener noreferrer">
                    {workload.artifacts.url}
                  </a>
                </dd>
              </>
            )}
            {port && (
              <>
                <dt>Port</dt>
                <dd>{port}</dd>
              </>
            )}
          </dl>
        </div>
      )}

      <div className={styles.workloadStageDetails}>
        <div className={styles.stageDetailsHeader}>
          <h3>Pipeline Stages</h3>
          <button
            className={styles.copyLogsButton}
            onClick={handleCopyLogs}
            title="Copy logs to clipboard"
          >
            <ClipboardIcon />
            <span>{copied ? 'Copied!' : 'Copy Logs'}</span>
          </button>
        </div>
        {workload.stages ? workload.stages.map((stage, i) => (
          <div key={i} className={`${styles.stageDetail} ${styles[`stage-${stage.status}`]}`}>
            <div className={styles.stageDetailHeader}>
              <span className={styles.stageDetailName}>{formatStageName(stage.stage)}</span>
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
        )) : (
          <div className={styles.stageDetail}>
            <div className={styles.stageDetailHeader}>
              <span className={styles.stageDetailName}>{formatStageName((workload as any).stage || 'pending')}</span>
              <span className={styles.stageDetailStatus}>{workload.status}</span>
            </div>
            {(workload as any).logs && (workload as any).logs.length > 0 && (
              <pre className={styles.stageDetailLogs}>
                {(workload as any).logs.map((log: any) => log.message).join('\n')}
              </pre>
            )}
            {(workload as any).error && (
              <div className={styles.stageDetailError}>{(workload as any).error}</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
