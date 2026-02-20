import type { ReactNode } from 'react'
import styles from './SectionCard.module.css'

export interface SectionCardTab<T extends string> {
  id: T
  label: string
  disabled?: boolean
}

export interface SectionCardProps<T extends string = never> {
  title: ReactNode
  headerMeta?: ReactNode
  /** If provided, renders a tab bar below the header */
  tabs?: SectionCardTab<T>[]
  activeTab?: T
  onTabChange?: (tab: T) => void
  children: ReactNode
  className?: string
  /** Remove default padding from the body (use when body manages its own padding) */
  noPadding?: boolean
}

export function SectionCard<T extends string = never>({
  title,
  headerMeta,
  tabs,
  activeTab,
  onTabChange,
  children,
  className,
  noPadding,
}: SectionCardProps<T>) {
  return (
    <div className={`${styles.card} ${className ?? ''}`}>
      <div className={styles.header}>
        <div className={styles.title}>{title}</div>
        {headerMeta && <div className={styles.headerMeta}>{headerMeta}</div>}
      </div>

      {tabs && tabs.length > 0 && (
        <div className={styles.tabNav}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
              onClick={() => onTabChange?.(tab.id)}
              disabled={tab.disabled}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      <div className={noPadding ? undefined : styles.body}>
        {children}
      </div>
    </div>
  )
}
