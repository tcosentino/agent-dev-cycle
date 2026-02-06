import type { AgentRole, AgentStatus, TaskPriority, TaskType, TaskStatus } from '../components/task-board/types'
import type { MessageType, ActionType, ActionStatus } from '../components/chat/types'

// --- Projects ---

export interface DbProject {
  id: string
  name: string
  key: string
  repoUrl: string
  createdAt: string
}

// --- Tasks ---

export interface DbTask {
  id: string
  projectId: string
  key: string
  title: string
  description?: string
  type: TaskType
  priority: TaskPriority
  status: TaskStatus
  assignee?: AgentRole
  createdAt: string
  updatedAt: string
}

// --- Chat ---

export interface DbChatChannel {
  id: string
  projectId: string
  name: string
  createdAt: string
}

export interface DbChatMessage {
  id: string
  channelId: string
  projectId: string
  type: MessageType
  sender?: AgentRole
  senderName?: string
  content: string
  actionType?: ActionType
  actionStatus?: ActionStatus
  actionLabel?: string
  actionSubject?: string
  createdAt: string
}

// --- Agent Status ---

export interface DbAgentStatus {
  id: string
  projectId: string
  role: AgentRole
  status: AgentStatus
  currentTask?: string
  lastActiveAt: string
}

// --- Session Index ---

export interface DbSession {
  id: string
  projectId: string
  runId: string
  agent: AgentRole
  phase: string
  summary?: string
  startedAt: string
  completedAt?: string
}

// --- Full DB Snapshot (for dev/example use) ---

export interface DbSnapshot {
  projects: DbProject[]
  tasks: DbTask[]
  channels: DbChatChannel[]
  messages: DbChatMessage[]
  agentStatus: DbAgentStatus[]
  sessions: DbSession[]
}
