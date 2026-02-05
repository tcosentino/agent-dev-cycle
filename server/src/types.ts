import type { InferSelectModel, InferInsertModel } from 'drizzle-orm'
import type {
  projects,
  tasks,
  channels,
  messages,
  agentStatus,
  sessions,
} from './schema'

// --- Enum types (duplicated from frontend -- will share later) ---

export type AgentStatus = 'active' | 'busy' | 'away' | 'offline'
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical'
export type TaskType = 'backend' | 'frontend' | 'api' | 'database' | 'testing'
export type TaskStatus = 'todo' | 'in-progress' | 'done'
export type AgentRole = 'pm' | 'engineer' | 'qa' | 'lead'
export type MessageType = 'user' | 'agent' | 'system'
export type ActionStatus = 'success' | 'error' | 'pending'
export type ActionType = 'created' | 'updated' | 'assigned' | 'completed' | 'analyzed' | 'started'

// --- Inferred DB row types ---

export type Project = InferSelectModel<typeof projects>
export type NewProject = InferInsertModel<typeof projects>

export type Task = InferSelectModel<typeof tasks>
export type NewTask = InferInsertModel<typeof tasks>

export type Channel = InferSelectModel<typeof channels>
export type NewChannel = InferInsertModel<typeof channels>

export type Message = InferSelectModel<typeof messages>
export type NewMessage = InferInsertModel<typeof messages>

export type AgentStatusRow = InferSelectModel<typeof agentStatus>
export type NewAgentStatusRow = InferInsertModel<typeof agentStatus>

export type Session = InferSelectModel<typeof sessions>
export type NewSession = InferInsertModel<typeof sessions>

// --- Snapshot shape (for seeding) ---

export interface DbSnapshot {
  projects: Project[]
  tasks: Task[]
  channels: Channel[]
  messages: Message[]
  agentStatus: AgentStatusRow[]
  sessions: Session[]
}
