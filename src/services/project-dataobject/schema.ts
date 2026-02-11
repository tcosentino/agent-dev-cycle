import { z } from 'zod'

// Lightweight schema definition for browser use (no server deps)
export const projectSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string().min(1).max(200),
  key: z.string().min(2).max(10).toUpperCase(),
  repoUrl: z.string().url().optional(),
})

export const projectResourceDefinition = {
  name: 'project',
  schema: projectSchema,
  createFields: ['userId', 'name', 'key', 'repoUrl'],
  updateFields: ['name', 'repoUrl'],
  unique: ['key'],
  searchable: ['name', 'key'],
} as const
