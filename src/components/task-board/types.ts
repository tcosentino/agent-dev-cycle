export type AgentStatus = 'active' | 'busy' | 'away' | 'offline'

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical'
export type TaskType = 'backend' | 'frontend' | 'api' | 'database' | 'testing'
export type TaskStatus = 'todo' | 'in-progress' | 'done'
export type AgentRole = 'pm' | 'engineer' | 'qa' | 'lead'

export interface Task {
  key: string
  title: string
  type: TaskType
  priority: TaskPriority
  status: TaskStatus
  assignee?: AgentRole
}

export interface TaskBoardProps {
  projectName: string
  projectKey: string
  phase: string
  tasks: Task[]
  animate?: boolean
  minHeight?: string | number
  selectedTaskKey?: string | null
  onTaskClick?: (taskKey: string) => void
}
