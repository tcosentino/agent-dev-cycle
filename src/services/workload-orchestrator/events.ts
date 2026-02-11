import { EventEmitter } from 'events'

export interface WorkloadStageUpdate {
  workloadId: string
  deploymentId: string
  projectId: string
  currentStage: string
  status: string
  stages: Array<{
    stage: string
    status: string
    startedAt?: string
    completedAt?: string
    duration?: number
    logs: string[]
    error?: string
  }>
  updatedAt: string
}

export interface DeploymentDeletedEvent {
  deploymentId: string
  projectId: string
}

class WorkloadEventEmitter extends EventEmitter {
  emitWorkloadUpdate(update: WorkloadStageUpdate) {
    this.emit('workload-update', update)
  }

  onWorkloadUpdate(listener: (update: WorkloadStageUpdate) => void) {
    this.on('workload-update', listener)
  }

  offWorkloadUpdate(listener: (update: WorkloadStageUpdate) => void) {
    this.off('workload-update', listener)
  }

  emitDeploymentDeleted(event: DeploymentDeletedEvent) {
    this.emit('deployment-deleted', event)
  }

  onDeploymentDeleted(listener: (event: DeploymentDeletedEvent) => void) {
    this.on('deployment-deleted', listener)
  }

  offDeploymentDeleted(listener: (event: DeploymentDeletedEvent) => void) {
    this.off('deployment-deleted', listener)
  }
}

export const workloadEvents = new WorkloadEventEmitter()
