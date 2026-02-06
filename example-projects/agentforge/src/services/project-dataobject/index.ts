import { defineResource, z } from '@agentforge/resource'

export const projectResource = defineResource({
  name: 'project',

  schema: z.object({
    id: z.string().uuid(),
    name: z.string().min(1).max(200),
    key: z.string().min(2).max(10).toUpperCase(), // e.g., 'AF' for AgentForge
    repoUrl: z.string().url().optional(),
    createdAt: z.date(),
  }),

  createFields: ['name', 'key', 'repoUrl'],
  updateFields: ['name', 'repoUrl'],
  unique: ['key'],
  searchable: ['name', 'key'],
})
