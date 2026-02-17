import { useMemo, useState, useEffect } from 'react'
import { Modal, useToast, ServerIcon, ClipboardIcon, ChevronDownIcon, ExecutionHeader, ExecutionControls, ExecutionLogPanel, type StageOutput, type LogEntry as ExecutionLogEntry } from '@agentforge/ui-components'
import type { DbSnapshot, Deployment, Workload, WorkloadStage } from '../types'
import { DeploymentCard } from './DeploymentCard'
import { api } from '../api'
import { formatStageName, formatUptime, formatDuration, transformLogsToStages } from '../utils/deploymentUtils'
import { useDeployments } from '../contexts/DeploymentContext'
import styles from '../ProjectViewer.module.css'
import modalStyles from '@agentforge/ui-components/components/Modal/Modal.module.css'

interface WorkloadLogEntry {
  timestamp: string
  stage: WorkloadStage
  message: string
  level: 'info' | 'warn' | 'error'
}

// --- Main Deployment List View ---

export function DeploymentListView({
  snapshot,
  onWorkloadClick,
}: {
  snapshot?: DbSnapshot
  onWorkloadClick: (workload: Workload) => void
}) {
  const { deployments: deploymentsFromContext, isLoading, error } = useDeployments()

  // Flatten deployments and workloads from context (SSE data)
  const deployments = deploymentsFromContext.map(d => ({
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
  }))
  const workloads = deploymentsFromContext.flatMap(d => d.workloads)

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

      // The SSE stream will automatically update the UI when the deployment is deleted
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
            onDelete={handleDeleteDeployment}
          />
        ))}
      </div>
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

export function WorkloadDetailView({ workload: initialWorkload }: { workload: Workload }) {
  const { getWorkloadById, getDeploymentById } = useDeployments()
  const { showToast } = useToast()

  // Always use the fresh workload from context if available
  const workload = getWorkloadById(initialWorkload.id) || initialWorkload

  // Check if the workload's deployment has been deleted
  const deployment = workload.deploymentId ? getDeploymentById(workload.deploymentId) : undefined
  const isDeleted = !getWorkloadById(initialWorkload.id)
  const [copied, setCopied] = useState(false)
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set())
  const [isStopping, setIsStopping] = useState(false)
  const [isRestarting, setIsRestarting] = useState(false)
  const workloadName = workload.moduleName || (workload as any).servicePath || 'Unnamed workload'
  const workloadType = workload.moduleType || 'service'
  const port = (workload as any).port || workload.artifacts?.port
  const containerId = (workload as any).containerId
  const currentStage = workload.currentStage || (workload as any).stage || 'pending'

  // Transform workload stages to ExecutionLogPanel format
  const stageOutputs = useMemo((): StageOutput[] => {
    let stages = workload.stages
    if (!stages || stages.length === 0) {
      const logs = (workload as any).logs as WorkloadLogEntry[] | undefined | null
      if (logs && Array.isArray(logs) && logs.length > 0) {
        stages = transformLogsToStages(logs)
      } else {
        return []
      }
    }

    return stages.map(stage => ({
      stage: formatStageName(stage.stage),
      status: stage.status,
      startedAt: stage.startedAt,
      completedAt: stage.completedAt,
      duration: stage.duration,
      logs: (stage.logs || []).map(log => ({
        timestamp: stage.startedAt || new Date().toISOString(),
        level: 'info' as const,
        message: log
      })),
      error: stage.error
    }))
  }, [workload])

  // Toggle all stages expanded/collapsed
  const toggleAllStages = () => {
    if (expandedStages.size === stageOutputs.length) {
      setExpandedStages(new Set())
    } else {
      setExpandedStages(new Set(stageOutputs.map(s => s.stage)))
    }
  }

  const handleToggleStage = (stage: string) => {
    setExpandedStages(prev => {
      const next = new Set(prev)
      if (next.has(stage)) {
        next.delete(stage)
      } else {
        next.add(stage)
      }
      return next
    })
  }

  const handleCopyLogs = async () => {
    const logText = stageOutputs
      .map(stage => {
        const logs = stage.logs.map(l => l.message).join('\n')
        const error = stage.error || ''
        return `[${stage.stage}]\n${logs}${error ? '\nError: ' + error : ''}`
      })
      .join('\n\n')

    try {
      await navigator.clipboard.writeText(logText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy logs:', err)
    }
  }

  const handleStop = async () => {
    setIsStopping(true)
    try {
      await api.workloads.stop(workload.deploymentId, workload.id)
      showToast({
        type: 'success',
        title: 'Workload stopped',
        message: 'The workload has been stopped successfully'
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      showToast({
        type: 'error',
        title: 'Failed to stop workload',
        message
      })
    } finally {
      setIsStopping(false)
    }
  }

  const handleRestart = async () => {
    setIsRestarting(true)
    try {
      await api.workloads.restart(workload.deploymentId, workload.id)
      showToast({
        type: 'success',
        title: 'Workload restarting',
        message: 'The workload is being restarted'
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      showToast({
        type: 'error',
        title: 'Failed to restart workload',
        message
      })
    } finally {
      setIsRestarting(false)
    }
  }

  if (isDeleted) {
    return (
      <div className={styles.workloadDetailView}>
        <div className={styles.emptyState}>
          <h2>Workload Deleted</h2>
          <p>This workload has been deleted.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.workloadDetailView}>
      <div className={styles.workloadDetailHeader}>
        <ServerIcon className={styles.workloadDetailIcon} />
        <div>
          <h2 className={styles.workloadDetailName}>{workloadName}</h2>
          <span className={styles.workloadDetailType}>{workloadType}</span>
        </div>
      </div>

      <ExecutionHeader
        status={workload.status}
        error={(workload as any).error}
        actions={
          <ExecutionControls
            mode="service"
            status={workload.status}
            onStop={handleStop}
            onRestart={handleRestart}
            isStopping={isStopping}
            isRestarting={isRestarting}
          />
        }
      />

      {(workload.artifacts || port || containerId) && (
        <div className={styles.workloadArtifacts}>
          <h3>Artifacts & Metadata</h3>
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
            {workload.status === 'running' && workload.createdAt && (
              <>
                <dt>Uptime</dt>
                <dd>{formatUptime(workload.createdAt)}</dd>
              </>
            )}
            {workload.completedAt && workload.createdAt && (
              <>
                <dt>Duration</dt>
                <dd>{formatDuration(workload.createdAt, workload.completedAt)}</dd>
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
            onClick={toggleAllStages}
            title={expandedStages.size === stageOutputs.length ? 'Collapse all stages' : 'Expand all stages'}
          >
            <ChevronDownIcon />
            <span>{expandedStages.size === stageOutputs.length ? 'Collapse All' : 'Expand All'}</span>
          </button>
          <button
            className={styles.copyLogsButton}
            onClick={handleCopyLogs}
            title="Copy all logs to clipboard"
          >
            <ClipboardIcon />
            <span>{copied ? 'Copied!' : 'Copy All Logs'}</span>
          </button>
        </div>
        <ExecutionLogPanel
          stageOutputs={stageOutputs}
          expandedStages={expandedStages}
          onToggleStage={handleToggleStage}
          autoScroll={false}
        />
      </div>
    </div>
  )
}
