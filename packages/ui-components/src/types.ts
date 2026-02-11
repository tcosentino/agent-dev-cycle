// Shared types for UI components

export type AgentStatus = 'active' | 'busy' | 'away' | 'offline'
export type AgentRole = 'pm' | 'engineer' | 'qa' | 'lead'
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low'
export type TaskType = 'epic' | 'api' | 'backend' | 'frontend' | 'testing' | 'documentation' | 'devops'
export type TaskStatus = 'todo' | 'in-progress' | 'review' | 'done' | 'blocked'

export interface Task {
  id: string
  projectId: string
  key: string
  title: string
  description?: string
  type?: TaskType
  priority?: TaskPriority
  status: TaskStatus
  assignee?: string
  createdAt: string
  updatedAt: string
}
