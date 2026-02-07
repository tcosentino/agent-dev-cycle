import { BoxIcon, PhaseBadge } from '@agentforge/ui-components'
import styles from './TaskBoardHeader.module.css'

interface TaskBoardHeaderProps {
  projectName: string
  projectKey: string
  phase: string
}

export function TaskBoardHeader({ projectName, projectKey, phase }: TaskBoardHeaderProps) {
  return (
    <div className={styles.header}>
      <div className={styles.project}>
        <div className={styles.icon}>
          <BoxIcon className={styles.iconSvg} />
        </div>
        <div>
          <div className={styles.name}>{projectName}</div>
          <div className={styles.key}>{projectKey}</div>
        </div>
      </div>
      <PhaseBadge phase={phase} />
    </div>
  )
}
