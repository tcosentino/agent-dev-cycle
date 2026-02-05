import { sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  key: text('key').notNull(),
  repoUrl: text('repo_url').notNull(),
  createdAt: text('created_at').notNull(),
})

export const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id),
  key: text('key').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  type: text('type', { enum: ['backend', 'frontend', 'api', 'database', 'testing'] }).notNull(),
  priority: text('priority', { enum: ['low', 'medium', 'high', 'critical'] }).notNull(),
  status: text('status', { enum: ['todo', 'in-progress', 'done'] }).notNull(),
  assignee: text('assignee', { enum: ['pm', 'engineer', 'qa', 'lead'] }),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
})

export const channels = sqliteTable('channels', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id),
  name: text('name').notNull(),
  createdAt: text('created_at').notNull(),
})

export const messages = sqliteTable('messages', {
  id: text('id').primaryKey(),
  channelId: text('channel_id').notNull().references(() => channels.id),
  projectId: text('project_id').notNull().references(() => projects.id),
  type: text('type', { enum: ['user', 'agent', 'system'] }).notNull(),
  sender: text('sender', { enum: ['pm', 'engineer', 'qa', 'lead'] }),
  senderName: text('sender_name'),
  content: text('content').notNull(),
  actionType: text('action_type', { enum: ['created', 'updated', 'assigned', 'completed', 'analyzed', 'started'] }),
  actionStatus: text('action_status', { enum: ['success', 'error', 'pending'] }),
  actionLabel: text('action_label'),
  actionSubject: text('action_subject'),
  createdAt: text('created_at').notNull(),
})

export const agentStatus = sqliteTable('agent_status', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id),
  role: text('role', { enum: ['pm', 'engineer', 'qa', 'lead'] }).notNull(),
  status: text('status', { enum: ['active', 'busy', 'away', 'offline'] }).notNull(),
  currentTask: text('current_task'),
  lastActiveAt: text('last_active_at').notNull(),
})

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id),
  runId: text('run_id').notNull(),
  agent: text('agent', { enum: ['pm', 'engineer', 'qa', 'lead'] }).notNull(),
  phase: text('phase').notNull(),
  summary: text('summary'),
  startedAt: text('started_at').notNull(),
  completedAt: text('completed_at'),
})
