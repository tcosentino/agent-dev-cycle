import { CheckCircleIcon, AlertTriangleIcon, XCircleIcon } from '../../icons/icons'
import styles from './DeploymentStatusBadge.module.css'

export interface DeploymentStatusBadgeProps {
  status: 'pending' | 'running' | 'success' | 'failed' | 'stopped'
  lastCheckTime?: string
  showTooltip?: boolean
}

/**
 * Display health status badge for a deployment
 * - Green: running/success (healthy)
 * - Red: failed/stopped (unavailable)
 * - Gray: pending (unknown)
 */
export function DeploymentStatusBadge({ status, lastCheckTime, showTooltip = true }: DeploymentStatusBadgeProps) {
  const getHealthStatus = () => {
    switch (status) {
      case 'success':
      case 'running':
        return {
          label: 'Healthy',
          className: styles.healthy,
          icon: <CheckCircleIcon className={styles.icon} />,
        }
      case 'failed':
      case 'stopped':
        return {
          label: 'Unavailable',
          className: styles.unavailable,
          icon: <XCircleIcon className={styles.icon} />,
        }
      case 'pending':
      default:
        return {
          label: 'Unknown',
          className: styles.unknown,
          icon: <AlertTriangleIcon className={styles.icon} />,
        }
    }
  }

  const health = getHealthStatus()

  const formatLastCheck = () => {
    if (!lastCheckTime) return null
    try {
      const date = new Date(lastCheckTime)
      const now = Date.now()
      const diff = now - date.getTime()
      const seconds = Math.floor(diff / 1000)
      const minutes = Math.floor(seconds / 60)
      const hours = Math.floor(minutes / 60)
      const days = Math.floor(hours / 24)

      if (days > 0) return `Checked ${days} day${days > 1 ? 's' : ''} ago`
      if (hours > 0) return `Checked ${hours} hour${hours > 1 ? 's' : ''} ago`
      if (minutes > 0) return `Checked ${minutes} minute${minutes > 1 ? 's' : ''} ago`
      return 'Checked just now'
    } catch {
      return null
    }
  }

  const tooltip = showTooltip && lastCheckTime ? formatLastCheck() : null

  return (
    <div className={`${styles.deploymentStatusBadge} ${health.className}`} title={tooltip || undefined}>
      {health.icon}
      <span className={styles.label}>{health.label}</span>
    </div>
  )
}
