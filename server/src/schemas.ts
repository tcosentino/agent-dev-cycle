import { z } from 'zod'

// --- Enums ---

export const AgentRoleEnum = z.enum(['pm', 'engineer', 'qa', 'lead'])
export const AgentStatusEnum = z.enum(['active', 'busy', 'away', 'offline'])
export const TaskPriorityEnum = z.enum(['low', 'medium', 'high', 'critical'])
export const TaskTypeEnum = z.enum(['backend', 'frontend', 'api', 'database', 'testing'])
export const TaskStatusEnum = z.enum(['todo', 'in-progress', 'done'])
export const MessageTypeEnum = z.enum(['user', 'agent', 'system'])
export const ActionStatusEnum = z.enum(['success', 'error', 'pending'])
export const ActionTypeEnum = z.enum(['created', 'updated', 'assigned', 'completed', 'analyzed', 'started'])

// --- Entity Schemas ---

export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  key: z.string(),
  repoUrl: z.string(),
  createdAt: z.string(),
}).openapi('Project')

export const CreateProjectSchema = ProjectSchema.omit({}).openapi('CreateProject')
export const UpdateProjectSchema = ProjectSchema.partial().omit({ id: true }).openapi('UpdateProject')

export const TaskSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  key: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  type: TaskTypeEnum,
  priority: TaskPriorityEnum,
  status: TaskStatusEnum,
  assignee: AgentRoleEnum.nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
}).openapi('Task')

export const CreateTaskSchema = TaskSchema.omit({}).openapi('CreateTask')
export const UpdateTaskSchema = TaskSchema.partial().omit({ id: true }).openapi('UpdateTask')

export const ChannelSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  name: z.string(),
  createdAt: z.string(),
}).openapi('Channel')

export const CreateChannelSchema = ChannelSchema.omit({}).openapi('CreateChannel')
export const UpdateChannelSchema = ChannelSchema.partial().omit({ id: true }).openapi('UpdateChannel')

export const MessageSchema = z.object({
  id: z.string(),
  channelId: z.string(),
  projectId: z.string(),
  type: MessageTypeEnum,
  sender: AgentRoleEnum.nullable(),
  senderName: z.string().nullable(),
  content: z.string(),
  actionType: ActionTypeEnum.nullable(),
  actionStatus: ActionStatusEnum.nullable(),
  actionLabel: z.string().nullable(),
  actionSubject: z.string().nullable(),
  createdAt: z.string(),
}).openapi('Message')

export const CreateMessageSchema = MessageSchema.omit({}).openapi('CreateMessage')
export const UpdateMessageSchema = MessageSchema.partial().omit({ id: true }).openapi('UpdateMessage')

export const AgentStatusRowSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  role: AgentRoleEnum,
  status: AgentStatusEnum,
  currentTask: z.string().nullable(),
  lastActiveAt: z.string(),
}).openapi('AgentStatus')

export const CreateAgentStatusSchema = AgentStatusRowSchema.omit({}).openapi('CreateAgentStatus')
export const UpdateAgentStatusSchema = AgentStatusRowSchema.partial().omit({ id: true }).openapi('UpdateAgentStatus')

export const SessionSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  runId: z.string(),
  agent: AgentRoleEnum,
  phase: z.string(),
  summary: z.string().nullable(),
  startedAt: z.string(),
  completedAt: z.string().nullable(),
}).openapi('Session')

export const CreateSessionSchema = SessionSchema.omit({}).openapi('CreateSession')
export const UpdateSessionSchema = SessionSchema.partial().omit({ id: true }).openapi('UpdateSession')

// --- Common ---

export const IdParam = z.object({
  id: z.string(),
})

export const ProjectIdQuery = z.object({
  projectId: z.string().optional(),
})

export const MessageFilterQuery = z.object({
  projectId: z.string().optional(),
  channelId: z.string().optional(),
})

export const NotFoundSchema = z.object({
  error: z.string(),
}).openapi('NotFound')

export const OkSchema = z.object({
  ok: z.boolean(),
}).openapi('Ok')
