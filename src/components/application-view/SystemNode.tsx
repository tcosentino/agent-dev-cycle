import type { SystemNode as SystemNodeType } from './types'
import styles from './SystemNode.module.css'

interface SystemNodeProps {
  node: SystemNodeType
}

function NodeIcon({ icon }: { icon: SystemNodeType['icon'] }) {
  switch (icon) {
    case 'hubspot':
      return (
        <svg viewBox="0 0 24 24" className={styles.icon}>
          <path fill="currentColor" d="M18.164 7.93V5.727a2.188 2.188 0 0 0 1.262-1.969c0-1.203-.98-2.183-2.183-2.183-1.202 0-2.182.98-2.182 2.183 0 .878.527 1.63 1.281 1.969V7.93a5.737 5.737 0 0 0-3.156 1.665L6.612 4.655a2.363 2.363 0 0 0 .094-.654c0-1.328-1.078-2.406-2.406-2.406S1.894 2.673 1.894 4c0 1.328 1.078 2.406 2.406 2.406.353 0 .688-.08.991-.218l6.413 4.88a5.766 5.766 0 0 0-.863 3.033c0 1.09.305 2.106.833 2.979l-2.016 2.016a2.07 2.07 0 0 0-.655-.115c-1.159 0-2.1.94-2.1 2.1 0 1.159.941 2.1 2.1 2.1s2.1-.941 2.1-2.1c0-.24-.044-.468-.12-.683l1.984-1.984a5.755 5.755 0 0 0 3.293 1.034c3.186 0 5.774-2.588 5.774-5.774a5.742 5.742 0 0 0-3.87-5.434zm-.921 8.856a3.399 3.399 0 0 1-3.398-3.399 3.399 3.399 0 0 1 3.398-3.398 3.399 3.399 0 0 1 3.399 3.398 3.399 3.399 0 0 1-3.399 3.399z"/>
        </svg>
      )
    case 'connectwise':
      return (
        <svg viewBox="0 0 24 24" className={styles.icon}>
          <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
        </svg>
      )
    case 'transform':
      return (
        <svg viewBox="0 0 24 24" className={styles.icon}>
          <path fill="currentColor" d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
        </svg>
      )
    case 'sync':
      return (
        <svg viewBox="0 0 24 24" className={styles.icon}>
          <path fill="currentColor" d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 .79-.15 1.56-.44 2.25l1.5 1.5C19.66 14.66 20 13.37 20 12c0-4.42-3.58-8-8-8zm-6 8c0-.79.15-1.56.44-2.25l-1.5-1.5C4.34 9.34 4 10.63 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3c-3.31 0-6-2.69-6-6z"/>
        </svg>
      )
    case 'database':
      return (
        <svg viewBox="0 0 24 24" className={styles.icon}>
          <path fill="currentColor" d="M12 3C7.58 3 4 4.79 4 7v10c0 2.21 3.58 4 8 4s8-1.79 8-4V7c0-2.21-3.58-4-8-4zm0 2c3.87 0 6 1.5 6 2s-2.13 2-6 2-6-1.5-6-2 2.13-2 6-2zM6 17v-2.73c1.42.74 3.58 1.23 6 1.23s4.58-.49 6-1.23V17c0 .5-2.13 2-6 2s-6-1.5-6-2zm0-5v-2.73c1.42.74 3.58 1.23 6 1.23s4.58-.49 6-1.23V12c0 .5-2.13 2-6 2s-6-1.5-6-2z"/>
        </svg>
      )
    case 'queue':
      return (
        <svg viewBox="0 0 24 24" className={styles.icon}>
          <path fill="currentColor" d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12z"/>
        </svg>
      )
    default:
      return (
        <svg viewBox="0 0 24 24" className={styles.icon}>
          <rect x="3" y="3" width="18" height="18" rx="3" fill="none" stroke="currentColor" strokeWidth="2"/>
        </svg>
      )
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
