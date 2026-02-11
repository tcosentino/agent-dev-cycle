import { z } from 'zod'

// Lightweight schema definition for browser use (no server deps)
export const taskCommentSchema = z.object({
  id: z.string().uuid(),
  taskId: z.string().uuid(),
  userId: z.string().uuid(),
  content: z.string().min(1).max(5000),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  authorName: z.string().optional(),
  authorEmail: z.string().optional(),
})

export const taskCommentResourceDefinition = {
  name: 'taskComment',
  schema: taskCommentSchema,
  createFields: ['taskId', 'userId', 'content'],
  updateFields: ['content'],
  searchable: ['content'],
} as const
