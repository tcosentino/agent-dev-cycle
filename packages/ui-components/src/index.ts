// Base components
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

// Task components
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

// Badge variants
export { AgentStatusBadge } from './components/badges/AgentStatusBadge'
export { AssigneeBadge } from './components/badges/AssigneeBadge'
export { PhaseBadge } from './components/badges/PhaseBadge'
export { PriorityBadge } from './components/badges/PriorityBadge'
export { TypeBadge } from './components/badges/TypeBadge'

// Icons
export * from './icons/icons'

// Shared types
export type { AgentStatus, AgentRole, TaskPriority, TaskType, TaskStatus, Task } from './types'
