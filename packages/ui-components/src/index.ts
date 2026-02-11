/**
 * UI Components Library
 *
 * This library is organized into two tiers:
 * - Tier 1 (Generic): Reusable, domain-agnostic UI components
 * - Tier 2 (Domain): Business-specific components that compose Tier 1 components
 *
 * Import from top level for common components, or from '/domain' for domain-specific ones.
 */

// ============================================================================
// TIER 1: Generic/Reusable Components (No Business Logic)
// ============================================================================

// Core UI Components
export { Badge } from './components/Badge/Badge'
export type { BadgeProps, BadgeSize, BadgeVariant } from './components/Badge/Badge'

export { Spinner } from './components/Spinner/Spinner'
export type { SpinnerProps } from './components/Spinner/Spinner'

export { StatusIndicator } from './components/StatusIndicator/StatusIndicator'
export type { StatusIndicatorProps } from './components/StatusIndicator/StatusIndicator'

export { TabbedPane } from './components/TabbedPane/TabbedPane'
export type { Tab } from './components/TabbedPane/TabbedPane'

export { ListPanel } from './components/ListPanel/ListPanel'
export type { ListPanelProps, SidebarItem } from './components/ListPanel/types'

export { Modal } from './components/Modal/Modal'
export type { ModalProps } from './components/Modal/Modal'

export { ToastProvider, useToast } from './components/Toast/Toast'
export type { ToastOptions, ToastType } from './components/Toast/Toast'

// ============================================================================
// TIER 2: Domain-Specific Components (Business Logic)
// ============================================================================
// Note: These components contain hardcoded business logic for specific domains.
// They compose Tier 1 components with domain knowledge (task types, agent roles, etc.)

// Task Domain Components
export { TaskCard } from './components/TaskCard/TaskCard'
export type { TaskCardProps } from './components/TaskCard/TaskCard'

export { TaskForm } from './components/TaskForm/TaskForm'
export type { TaskFormProps, TaskFormData } from './components/TaskForm/TaskForm'

export { TaskBoard } from './components/TaskBoard/TaskBoard'
export type { TaskBoardProps } from './components/TaskBoard/TaskBoard'

export { TaskFiltersComponent as TaskFilters } from './components/TaskBoard/TaskFilters'
export type { TaskFilters as TaskFiltersType, TaskFiltersProps } from './components/TaskBoard/TaskFilters'

export { TaskDetailPanel } from './components/TaskDetailPanel/TaskDetailPanel'
export type { TaskDetailPanelProps } from './components/TaskDetailPanel/TaskDetailPanel'

export { CommentThread } from './components/CommentThread/CommentThread'
export type { CommentThreadProps, Comment } from './components/CommentThread/CommentThread'

// Agent Domain Components
export { AgentStatusBadge } from './components/badges/AgentStatusBadge'
export { AssigneeBadge } from './components/badges/AssigneeBadge'
export { PhaseBadge } from './components/badges/PhaseBadge'

// Deployment Domain Components
export { DeploymentStatusBadge } from './components/badges/DeploymentStatusBadge'
export type { DeploymentStatusBadgeProps } from './components/badges/DeploymentStatusBadge'

// Task-specific Badge Components
export { PriorityBadge } from './components/badges/PriorityBadge'
export { TypeBadge } from './components/badges/TypeBadge'

// ============================================================================
// Domain Constants & Types
// ============================================================================
// Export domain constants for consumers who want to customize behavior

export * from './domain'

// Icons
export * from './icons/icons'

// Shared types
export type { AgentStatus, AgentRole, TaskPriority, TaskType, TaskStatus, Task } from './types'
