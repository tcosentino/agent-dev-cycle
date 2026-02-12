import { useState } from 'react'
import type { Workload, WorkloadStage } from '../types'
import styles from './WorkloadControls.module.css'

interface WorkloadControlsProps {
  workload: Workload
  deploymentId: string
  onStop: (workloadId: string) => Promise<void>
  onRestart: (workloadId: string) => Promise<void>
  onViewLogs: (workload: Workload) => void
}

export function WorkloadControls({
  workload,
  deploymentId,
  onStop,
  onRestart,
  onViewLogs,
}: WorkloadControlsProps) {
  const [isOperating, setIsOperating] = useState(false)

  const isTransitioning = (stage: WorkloadStage): boolean => {
    return ['starting-container', 'cloning-repo', 'starting-service', 'graceful-shutdown'].includes(stage)
  }

  const canStop = workload.currentStage === 'running' && !isOperating
  const canRestart = !isTransitioning(workload.currentStage) && !isOperating

  const handleStop = async () => {
    setIsOperating(true)
    try {
      await onStop(workload.id)
    } finally {
      setIsOperating(false)
    }
  }

  const handleRestart = async () => {
    setIsOperating(true)
    try {
      await onRestart(workload.id)
    } finally {
      setIsOperating(false)
    }
  }

  const handleViewLogs = () => {
    onViewLogs(workload)
  }

  return (
    <div className={styles.controls}>
      {workload.currentStage === 'running' && (
        <button
          className={styles.button}
          onClick={handleStop}
          disabled={!canStop}
          aria-label="Stop workload"
        >
          {isOperating ? 'Stopping...' : 'Stop'}
        </button>
      )}

      {workload.currentStage !== 'running' && (
        <button
          className={styles.button}
          onClick={handleRestart}
          disabled={!canRestart}
          aria-label="Restart workload"
        >
          {isOperating ? 'Restarting...' : 'Restart'}
        </button>
      )}

      <button
        className={styles.buttonSecondary}
        onClick={handleViewLogs}
        disabled={isOperating}
        aria-label="View logs"
      >
        View Logs
      </button>
    </div>
  )
}
