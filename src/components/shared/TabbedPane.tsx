import type { ReactNode } from 'react'
import { XIcon } from './icons'
import styles from './TabbedPane.module.css'

export interface Tab {
  id: string
  label: string
  icon?: ReactNode
  closable?: boolean
}

interface TabbedPaneProps {
  tabs: Tab[]
  activeTabId: string | null
  onTabSelect: (id: string) => void
  onTabClose: (id: string) => void
  children: ReactNode
  emptyState?: ReactNode
}

export function TabbedPane({
  tabs,
  activeTabId,
  onTabSelect,
  onTabClose,
  children,
  emptyState,
}: TabbedPaneProps) {
  if (tabs.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          {emptyState || 'No tabs open'}
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.tabBar}>
        {tabs.map(tab => (
          <div
            key={tab.id}
            className={`${styles.tab} ${activeTabId === tab.id ? styles.tabActive : ''}`}
            onClick={() => onTabSelect(tab.id)}
          >
            {tab.icon && <span className={styles.tabIcon}>{tab.icon}</span>}
            <span className={styles.tabLabel}>{tab.label}</span>
            {tab.closable !== false && (
              <button
                className={styles.tabClose}
                onClick={(e) => {
                  e.stopPropagation()
                  onTabClose(tab.id)
                }}
              >
                <XIcon className={styles.tabCloseIcon} />
              </button>
            )}
          </div>
        ))}
      </div>
      <div className={styles.content}>
        {children}
      </div>
    </div>
  )
}
