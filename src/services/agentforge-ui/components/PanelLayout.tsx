import type { ReactNode } from 'react'
import styles from './PanelLayout.module.css'

export interface PanelTab<T extends string> {
  id: T
  label: string
  disabled?: boolean
}

export interface PanelLayoutProps<T extends string> {
  title: string
  headerActions?: ReactNode
  tabs: PanelTab<T>[]
  activeTab: T
  onTabChange: (tab: T) => void
  children: ReactNode
}

export function PanelLayout<T extends string>({
  title,
  headerActions,
  tabs,
  activeTab,
  onTabChange,
  children,
}: PanelLayoutProps<T>) {
  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        {headerActions && (
          <div className={styles.headerActions}>{headerActions}</div>
        )}
      </div>

      <div className={styles.tabNav}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
            onClick={() => onTabChange(tab.id)}
            disabled={tab.disabled}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className={styles.tabContent}>
        {children}
      </div>
    </div>
  )
}