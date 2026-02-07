import { PenIcon } from '../../icons/icons'
import styles from './PhaseBadge.module.css'

interface PhaseBadgeProps {
  phase: string
}

export function PhaseBadge({ phase }: PhaseBadgeProps) {
  return (
    <div className={styles.badge}>
      <PenIcon className={styles.icon} />
      <span className={styles.text}>{phase}</span>
    </div>
  )
}
