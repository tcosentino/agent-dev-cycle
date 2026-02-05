import { useState } from 'react'
import type { ReactNode, DragEvent } from 'react'
import { XIcon, LayoutIcon } from './icons'
import styles from './TabbedPane.module.css'

export interface Tab {
  id: string
  label: string
  icon?: ReactNode
  closable?: boolean
}

export interface TabDragData {
  tabId: string
  sourcePane?: string
}

interface TabbedPaneProps {
  tabs: Tab[]
  activeTabId: string | null
  onTabSelect: (id: string) => void
  onTabClose: (id: string) => void
  children: ReactNode
  emptyState?: ReactNode
  onSplitRight?: (tabId: string) => void
  paneId?: string
  onTabDrop?: (tabId: string, targetIndex: number) => void
  onTabDropFromOtherPane?: (tabId: string, sourcePane: string, targetIndex: number) => void
}

export function TabbedPane({
  tabs,
  activeTabId,
  onTabSelect,
  onTabClose,
  children,
  emptyState,
  onSplitRight,
  paneId,
  onTabDrop,
  onTabDropFromOtherPane,
}: TabbedPaneProps) {
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [isDraggingOver, setIsDraggingOver] = useState(false)

  const handleDragStart = (e: DragEvent, tabId: string) => {
    const data: TabDragData = { tabId, sourcePane: paneId }
    e.dataTransfer.setData('application/json', JSON.stringify(data))
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIndex(index)
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = (e: DragEvent, targetIndex: number) => {
    e.preventDefault()
    setDragOverIndex(null)
    setIsDraggingOver(false)

    try {
      const data: TabDragData = JSON.parse(e.dataTransfer.getData('application/json'))
      if (data.sourcePane && data.sourcePane !== paneId && onTabDropFromOtherPane) {
        onTabDropFromOtherPane(data.tabId, data.sourcePane, targetIndex)
      } else if (onTabDrop) {
        onTabDrop(data.tabId, targetIndex)
      }
    } catch {
      // Invalid drag data
    }
  }

  const handleContainerDragOver = (e: DragEvent) => {
    e.preventDefault()
    setIsDraggingOver(true)
  }

  const handleContainerDragLeave = (e: DragEvent) => {
    // Only set to false if we're leaving the container entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDraggingOver(false)
      setDragOverIndex(null)
    }
  }

  const handleContainerDrop = (e: DragEvent) => {
    // Drop on empty area = drop at end
    if (dragOverIndex === null) {
      handleDrop(e, tabs.length)
    }
  }

  if (tabs.length === 0) {
    return (
      <div
        className={`${styles.container} ${isDraggingOver ? styles.containerDragOver : ''}`}
        onDragOver={handleContainerDragOver}
        onDragLeave={handleContainerDragLeave}
        onDrop={(e) => handleDrop(e, 0)}
      >
        <div className={styles.emptyState}>
          {emptyState || 'No tabs open'}
        </div>
      </div>
    )
  }

  return (
    <div
      className={`${styles.container} ${isDraggingOver ? styles.containerDragOver : ''}`}
      onDragOver={handleContainerDragOver}
      onDragLeave={handleContainerDragLeave}
      onDrop={handleContainerDrop}
    >
      <div className={styles.tabBar}>
        {tabs.map((tab, index) => (
          <div
            key={tab.id}
            className={`${styles.tab} ${activeTabId === tab.id ? styles.tabActive : ''} ${dragOverIndex === index ? styles.tabDragOver : ''}`}
            onClick={() => onTabSelect(tab.id)}
            draggable
            onDragStart={(e) => handleDragStart(e, tab.id)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
          >
            {tab.icon && <span className={styles.tabIcon}>{tab.icon}</span>}
            <span className={styles.tabLabel}>{tab.label}</span>
            {onSplitRight && (
              <button
                className={styles.tabSplit}
                onClick={(e) => {
                  e.stopPropagation()
                  onSplitRight(tab.id)
                }}
                title="Split right"
              >
                <LayoutIcon className={styles.tabSplitIcon} />
              </button>
            )}
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
        {/* Drop zone at end of tabs */}
        <div
          className={`${styles.tabDropZone} ${dragOverIndex === tabs.length ? styles.tabDropZoneActive : ''}`}
          onDragOver={(e) => handleDragOver(e, tabs.length)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, tabs.length)}
        />
      </div>
      <div className={styles.content}>
        {children}
      </div>
    </div>
  )
}
