import styles from './StatusIndicator.module.css'

export type IndicatorSize = 'xs' | 'sm' | 'md' | 'lg'
export type IndicatorStatus = 'active' | 'busy' | 'syncing' | 'away' | 'offline' | 'error'
export type IndicatorRole = 'pm' | 'engineer' | 'qa' | 'lead'

export interface StatusIndicatorProps {
  /** Status determines color and animation */
  status?: IndicatorStatus
  /** Agent role determines color (alternative to status) */
  role?: IndicatorRole
  /** Size of the indicator */
  size?: IndicatorSize
  /** Additional CSS class */
  className?: string
}

export function StatusIndicator({
  status,
  role,
  size = 'sm',
  className
}: StatusIndicatorProps) {
  const colorClass = role ? styles[role] : (status ? styles[status] : styles.offline)

  const classes = [
    styles.indicator,
    styles[size],
    colorClass,
    className
  ].filter(Boolean).join(' ')

  return <span className={classes} />
}
