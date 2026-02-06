import {
  HubspotIcon,
  ConnectwiseIcon,
  TransformIcon,
  SyncIcon,
  DatabaseFilledIcon,
  QueueIcon,
  DefaultNodeIcon
} from '../shared/icons'
import type { SystemNode as SystemNodeType } from './types'
import styles from './SystemNode.module.css'

interface SystemNodeProps {
  node: SystemNodeType
}

function NodeIcon({ icon }: { icon: SystemNodeType['icon'] }) {
  const iconProps = { className: styles.icon }

  switch (icon) {
    case 'hubspot':
      return <HubspotIcon {...iconProps} />
    case 'connectwise':
      return <ConnectwiseIcon {...iconProps} />
    case 'transform':
      return <TransformIcon {...iconProps} />
    case 'sync':
      return <SyncIcon {...iconProps} />
    case 'database':
      return <DatabaseFilledIcon {...iconProps} />
    case 'queue':
      return <QueueIcon {...iconProps} />
    default:
      return <DefaultNodeIcon {...iconProps} />
  }
}

export function SystemNode({ node }: SystemNodeProps) {
  const typeClass = styles[node.type] || ''
  const statusClass = styles[node.status] || ''

  return (
    <div
      className={`${styles.node} ${typeClass} ${statusClass}`}
      style={{
        left: `${node.position.x}%`,
        top: `${node.position.y}%`
      }}
    >
      <div className={styles.iconWrapper}>
        <NodeIcon icon={node.icon} />
        {node.status === 'syncing' && <div className={styles.syncRing} />}
        {node.status === 'active' && <div className={styles.activeIndicator} />}
      </div>
      <div className={styles.labelGroup}>
        <span className={styles.label}>{node.label}</span>
        {node.sublabel && <span className={styles.sublabel}>{node.sublabel}</span>}
      </div>
      <div className={styles.statusDot} />
    </div>
  )
}
