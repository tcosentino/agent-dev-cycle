import type { ApplicationViewProps } from './types'
import { SystemNode } from './SystemNode'
import { ConnectionLines } from './ConnectionLines'
import styles from './ApplicationView.module.css'

export function ApplicationView({ state, title, subtitle }: ApplicationViewProps) {
  const { nodes, connections, pulses, syncStatus } = state

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          {title && <h2 className={styles.title}>{title}</h2>}
          {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
        </div>

        {syncStatus && (
          <div className={styles.syncStatus}>
            <div className={`${styles.syncIndicator} ${styles[syncStatus.status]}`} />
            <div className={styles.syncInfo}>
              <span className={styles.syncLabel}>
                {syncStatus.status === 'running' ? 'Syncing...' :
                 syncStatus.status === 'completed' ? 'Sync Complete' :
                 syncStatus.status === 'error' ? 'Sync Error' : 'Idle'}
              </span>
              {syncStatus.recordsProcessed > 0 && (
                <span className={styles.syncCount}>
                  {syncStatus.recordsProcessed} records
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Architecture Diagram */}
      <div className={styles.diagram}>
        {/* Connection lines (SVG) */}
        <ConnectionLines
          nodes={nodes}
          connections={connections}
          pulses={pulses}
        />

        {/* System nodes */}
        {nodes.map(node => (
          <SystemNode key={node.id} node={node} />
        ))}

        {/* Grid background */}
        <div className={styles.gridOverlay} />
      </div>

      {/* Legend */}
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.source}`} />
          <span>Source</span>
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.destination}`} />
          <span>Destination</span>
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.transform}`} />
          <span>Transform</span>
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.orchestrator}`} />
          <span>Orchestrator</span>
        </div>
      </div>
    </div>
  )
}
