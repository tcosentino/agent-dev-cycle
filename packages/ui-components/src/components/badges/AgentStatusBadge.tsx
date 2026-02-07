import type { AgentStatus } from '../../types'
import { StatusIndicator } from '../StatusIndicator/StatusIndicator'
import styles from './AgentStatusBadge.module.css'

interface AgentStatusBadgeProps {
  status: AgentStatus
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const statusLabels: Record<AgentStatus, string> = {
  active: 'Active',
  busy: 'Running job',
  away: 'Away',
  offline: 'Offline'
}

const sizeMap: Record<'sm' | 'md' | 'lg', 'sm' | 'md' | 'lg'> = {
  sm: 'sm',
  md: 'md',
  lg: 'lg'
}

export function AgentStatusBadge({
  status,
  showLabel = true,
  size = 'md'
}: AgentStatusBadgeProps) {
  return (
    <div className={`${styles.badge} ${styles[size]}`}>
      <StatusIndicator status={status} size={sizeMap[size]} />
      {showLabel && (
        <span className={styles.label}>{statusLabels[status]}</span>
      )}
    </div>
  )
}
