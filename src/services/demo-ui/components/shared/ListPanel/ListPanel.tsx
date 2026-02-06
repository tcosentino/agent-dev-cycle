import { type ReactNode } from 'react'
import type { ListPanelProps } from './types'
import styles from './ListPanel.module.css'

export function ListPanel<T extends string = string>({
  sidebarTitle = 'Items',
  sidebarItems,
  activeItemId,
  onItemSelect,
  showAllOption = false,
  allOptionLabel = 'All',
  allOptionCount,
  headerTitle,
  headerContent,
  children,
  emptyState,
  minHeight
}: ListPanelProps<T>) {
  const hasContent = Array.isArray(children)
    ? children.length > 0
    : children !== null && children !== undefined

  return (
    <div
      className={styles.container}
      style={minHeight ? { minHeight } : undefined}
    >
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>{sidebarTitle}</div>
        <div className={styles.itemList}>
          {showAllOption && (
            <button
              className={`${styles.itemButton} ${!activeItemId ? styles.active : ''}`}
              onClick={() => onItemSelect?.(undefined)}
            >
              <span className={styles.itemLabel}>{allOptionLabel}</span>
              {allOptionCount !== undefined && (
                <span className={styles.itemCount}>{allOptionCount}</span>
              )}
            </button>
          )}
          {sidebarItems.map(item => (
            <button
              key={item.id}
              className={`${styles.itemButton} ${activeItemId === item.id ? styles.active : ''}`}
              onClick={() => onItemSelect?.(item.id)}
            >
              {item.icon && <span className={styles.itemIcon}>{item.icon}</span>}
              <span className={styles.itemLabel}>{item.label}</span>
              {item.count !== undefined && (
                <span className={styles.itemCount}>{item.count}</span>
              )}
            </button>
          ))}
        </div>
      </div>
      <div className={styles.main}>
        {(headerTitle || headerContent) && (
          <div className={styles.header}>
            {headerTitle && <span className={styles.headerTitle}>{headerTitle}</span>}
            {headerContent && <div className={styles.headerContent}>{headerContent}</div>}
          </div>
        )}
        <div className={styles.content}>
          {hasContent ? children : emptyState}
        </div>
      </div>
    </div>
  )
}

// Convenience wrapper for content cards (optional)
export function ListPanelCard({
  children,
  onClick,
  className
}: {
  children: ReactNode
  onClick?: () => void
  className?: string
}) {
  return (
    <div
      className={className}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : undefined }}
    >
      {children}
    </div>
  )
}
