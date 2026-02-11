import { useState } from 'react'
import { ChevronDownIcon } from '@agentforge/ui-components'
import type { StageResult } from '../types'
import { formatStageName } from '../utils/deploymentUtils'
import styles from '../ProjectViewer.module.css'

export interface StageDetailCardProps {
  stage: StageResult
  expanded?: boolean
}

export function StageDetailCard({ stage, expanded }: StageDetailCardProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  // Use parent-controlled expanded state if provided
  const actualExpanded = expanded !== undefined ? expanded : isExpanded

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return null
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    })
  }

  const hasContent = (stage.logs && stage.logs.length > 0) || stage.error

  return (
    <div className={`${styles.stageDetail} ${styles[`stage-${stage.status}`]}`}>
      <button
        className={styles.stageDetailHeader}
        onClick={() => setIsExpanded(!isExpanded)}
        disabled={!hasContent || expanded !== undefined}
      >
        <span className={styles.stageDetailName}>{formatStageName(stage.stage)}</span>
        <span className={styles.stageDetailStatus}>{stage.status}</span>
        {stage.startedAt && (
          <span className={styles.stageDetailTimestamp}>
            Started: {formatTimestamp(stage.startedAt)}
          </span>
        )}
        {stage.completedAt && (
          <span className={styles.stageDetailTimestamp}>
            Completed: {formatTimestamp(stage.completedAt)}
          </span>
        )}
        {stage.duration && (
          <span className={styles.stageDetailDuration}>{stage.duration}ms</span>
        )}
        {hasContent && (
          <span className={`${styles.stageToggleIcon} ${actualExpanded ? styles.expanded : ''}`}>
            <ChevronDownIcon />
          </span>
        )}
      </button>
      {actualExpanded && hasContent && (
        <div className={styles.stageDetailContent}>
          {stage.logs && stage.logs.length > 0 && (
            <pre className={styles.stageDetailLogs}>
              {stage.logs.join('\n')}
            </pre>
          )}
          {stage.error && (
            <div className={styles.stageDetailError}>{stage.error}</div>
          )}
        </div>
      )}
    </div>
  )
}
