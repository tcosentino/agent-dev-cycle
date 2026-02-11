import { defineResource, z } from '@agentforge/dataobject'

export const projectResource = defineResource({
  name: 'project',

  schema: z.object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    name: z.string().min(1).max(100),
    key: z.string().min(2).max(10).toUpperCase(),
    repoUrl: z.string().url().optional(),
    createdAt: z.date().default(() => new Date()),
    updatedAt: z.date().default(() => new Date()),
  }),

  createFields: ['userId', 'name', 'key', 'repoUrl'],
  updateFields: ['name', 'repoUrl'],
  unique: ['key'],
  searchable: ['name', 'key'],
  relations: {
    user: { type: 'belongsTo', resource: 'user', foreignKey: 'userId' },
  },
})
