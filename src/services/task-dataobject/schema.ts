import { z } from 'zod'

// Lightweight schema definition for browser use (no server deps)
export const taskSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  key: z.string().min(1).max(20),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  type: z.enum(['epic', 'api', 'backend', 'frontend', 'testing', 'documentation', 'devops']).optional(),
  priority: z.enum(['critical', 'high', 'medium', 'low']).optional(),
  status: z.enum(['todo', 'in-progress', 'review', 'done', 'blocked']).default('todo'),
  assignee: z.string().optional(),
})

export const taskResourceDefinition = {
  name: 'task',
  schema: taskSchema,
  createFields: ['projectId', 'key', 'title', 'description', 'type', 'priority', 'status', 'assignee'],
  updateFields: ['title', 'description', 'type', 'priority', 'status', 'assignee'],
  unique: ['key'],
  searchable: ['title', 'key', 'assignee'],
} as const
