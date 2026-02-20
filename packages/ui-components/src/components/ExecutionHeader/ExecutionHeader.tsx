import type { ReactNode } from 'react'
import { Badge } from '../Badge'
import styles from './ExecutionHeader.module.css'

export interface ExecutionHeaderProps {
  status?: string
  error?: string
  actions?: ReactNode
}

function getStatusVariant(status: string | undefined): 'green' | 'red' | 'orange' | 'muted' {
  if (!status) return 'muted'

  const lowerStatus = status.toLowerCase()

  if (lowerStatus === 'completed') {
    return 'green'
  }

  if (lowerStatus === 'failed' || lowerStatus === 'cancelled') {
    return 'red'
  }

  if (lowerStatus === 'running' || lowerStatus === 'executing' || lowerStatus === 'cloning' || lowerStatus === 'loading' || lowerStatus === 'capturing' || lowerStatus === 'committing') {
    return 'orange'
  }

  return 'muted'
}

export function ExecutionHeader({ status, error, actions }: ExecutionHeaderProps) {
  const variant = getStatusVariant(status)

  return (
    <div className={styles.header}>
      <div className={styles.statusSection}>
        {status && (
          <Badge variant={variant} size="sm">
            {status}
          </Badge>
        )}
        {error && (
          <span className={styles.errorMessage}>{error}</span>
        )}
      </div>

      {actions && (
        <div className={styles.actions}>
          {actions}
        </div>
      )}
    </div>
  )
}
