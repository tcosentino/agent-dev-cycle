import { useMemo } from 'react'
import type { Workload, WorkloadStage, StageStatus, StageResult } from '../types'
import { StageIndicator } from './StageIndicator'
import { STAGE_ORDER, transformLogsToStages } from '../utils/deploymentUtils'
import styles from '../ProjectViewer.module.css'

interface WorkloadLogEntry {
  timestamp: string
  stage: WorkloadStage
  message: string
  level: 'info' | 'warn' | 'error'
}

export interface WorkloadStagesProps {
  workload: Workload
}

export function WorkloadStages({ workload }: WorkloadStagesProps) {
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

    // Transform logs to stages if needed
    let stages: StageResult[] = []
    if (workload.stages && workload.stages.length > 0) {
      stages = workload.stages
    } else {
      const logs = (workload as any).logs as WorkloadLogEntry[] | undefined
      if (logs && logs.length > 0) {
        stages = transformLogsToStages(logs)
      }
    }

    // Apply stage statuses from transformed stages
    if (stages.length > 0) {
      for (const result of stages) {
        statuses[result.stage] = result.status
      }

      // Mark current stage as running if workload is running
      const currentStage = workload.currentStage || (workload as any).stage
      if (workload.status === 'running' && currentStage) {
        const currentStageResult = stages.find(s => s.stage === currentStage)
        if (!currentStageResult || currentStageResult.status === 'pending') {
          statuses[currentStage] = 'running'
        }
      }
    } else {
      // Handle workloads with no log data yet
      const currentStage = (workload as any).stage as WorkloadStage
      if (currentStage && statuses[currentStage] !== undefined) {
        statuses[currentStage] = workload.status === 'running' ? 'running' : 'pending'
      }
    }

    return statuses
  }, [workload])

  return (
    <div className={styles.workloadStages}>
      {STAGE_ORDER.map((stage, i) => {
        const isCompleted = stageStatuses[stage] === 'success'
        return (
          <div key={stage} className={styles.stageStep}>
            <StageIndicator stage={stage} status={stageStatuses[stage]} />
            {i < STAGE_ORDER.length - 1 && (
              <div className={`${styles.stageConnector} ${isCompleted ? styles.completed : ''}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}
