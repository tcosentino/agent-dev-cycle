import type { TaskType, TaskPriority, TaskStatus } from '../../types'

/**
 * Task domain constants
 *
 * These constants define the business logic for tasks.
 * Extracted from TaskForm, TaskBoard, and TaskFilters to centralize domain knowledge.
 */

// Available task types
export const TASK_TYPES: TaskType[] = [
  'epic',
  'api',
  'backend',
  'frontend',
  'testing',
  'documentation',
  'devops'
]

// Priority levels
export const TASK_PRIORITIES: TaskPriority[] = [
  'low',
  'medium',
  'high',
  'critical'
]

// Task statuses
export const TASK_STATUSES: TaskStatus[] = [
  'todo',
  'in-progress',
  'review',
  'done',
  'blocked'
]

// Kanban board column definitions
export const TASK_BOARD_COLUMNS: Array<{ status: TaskStatus; label: string }> = [
  { status: 'todo', label: 'To Do' },
  { status: 'in-progress', label: 'In Progress' },
  { status: 'review', label: 'Review' },
  { status: 'done', label: 'Done' },
  { status: 'blocked', label: 'Blocked' },
]

// Available assignees (agent roles)
export const TASK_ASSIGNEES = ['pm', 'engineer', 'qa', 'lead']

// Filter options (ordered for UI display)
export const TASK_FILTER_PRIORITIES: TaskPriority[] = ['critical', 'high', 'medium', 'low']
export const TASK_FILTER_TYPES: TaskType[] = TASK_TYPES
export const TASK_FILTER_ASSIGNEES = TASK_ASSIGNEES
