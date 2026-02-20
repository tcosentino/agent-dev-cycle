export type ExecutionMode = 'job' | 'service'

export interface ExecutionControlsProps {
  mode: ExecutionMode
  status: string
  onCancel?: () => void
  onRetry?: () => void
  onStop?: () => void
  onRestart?: () => void
  isCancelling?: boolean
  isRetrying?: boolean
  isStopping?: boolean
  isRestarting?: boolean
}

import styles from './ExecutionControls.module.css'

export function ExecutionControls({
  mode,
  status,
  onCancel,
  onRetry,
  onStop,
  onRestart,
  isCancelling = false,
  isRetrying = false,
  isStopping = false,
  isRestarting = false,
}: ExecutionControlsProps) {
  const isRunning = !['completed', 'failed', 'cancelled', 'stopped', 'pending'].includes(status)
  const isFailed = status === 'failed' || status === 'cancelled'

  // Determine which buttons to show based on mode and status
  const showCancel = mode === 'job' && isRunning && onCancel
  const showRetry = mode === 'job' && isFailed && onRetry
  const showStop = mode === 'service' && isRunning && onStop
  const showRestart = mode === 'service' && ['running', 'stopped', 'failed'].includes(status) && onRestart

  if (!showCancel && !showRetry && !showStop && !showRestart) {
    return null
  }

  return (
    <div className={styles.controls}>
      {showCancel && (
        <button
          className={styles.cancelButton}
          onClick={onCancel}
          disabled={isCancelling || status === 'cancelling'}
        >
          {status === 'cancelling' || isCancelling ? 'Cancelling...' : 'Cancel'}
        </button>
      )}

      {showRetry && (
        <button
          className={styles.retryButton}
          onClick={onRetry}
          disabled={isRetrying}
        >
          {isRetrying ? 'Retrying...' : 'Retry'}
        </button>
      )}

      {showStop && (
        <button
          className={styles.stopButton}
          onClick={onStop}
          disabled={isStopping}
        >
          {isStopping ? 'Stopping...' : 'Stop'}
        </button>
      )}

      {showRestart && (
        <button
          className={styles.restartButton}
          onClick={onRestart}
          disabled={isRestarting}
        >
          {isRestarting ? 'Restarting...' : 'Restart'}
        </button>
      )}
    </div>
  )
}
