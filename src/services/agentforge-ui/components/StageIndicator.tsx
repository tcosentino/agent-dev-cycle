import { CheckCircleIcon, AlertTriangleIcon, PlayIcon } from '@agentforge/ui-components'
import type { WorkloadStage, StageStatus } from '../types'
import { formatStageName } from '../utils/deploymentUtils'
import styles from '../ProjectViewer.module.css'

export interface StageIndicatorProps {
  stage: WorkloadStage
  status: StageStatus
}

export function StageIndicator({ stage, status }: StageIndicatorProps) {
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
