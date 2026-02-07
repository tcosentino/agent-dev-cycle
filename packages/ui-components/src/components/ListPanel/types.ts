import type { ReactNode } from 'react'

export interface SidebarItem<T extends string = string> {
  id: T
  label: string
  icon?: ReactNode
  count?: number
}

export interface ListPanelProps<T extends string = string> {
  // Sidebar
  sidebarTitle?: string
  sidebarItems: SidebarItem<T>[]
  activeItemId?: T
  onItemSelect?: (id: T | undefined) => void
  showAllOption?: boolean
  allOptionLabel?: string
  allOptionCount?: number

  // Header
  headerTitle?: string
  headerContent?: ReactNode // For search input, filters, etc.

  // Content
  children: ReactNode
  emptyState?: ReactNode

  // Styling
  minHeight?: number | string
}
