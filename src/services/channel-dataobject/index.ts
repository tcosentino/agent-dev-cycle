import { defineResource, z } from '@agentforge/dataobject'

export const channelResource = defineResource({
  name: 'channel',

  schema: z.object({
    id: z.string().uuid(),
    projectId: z.string().uuid(),
    name: z.string().min(1).max(50), // e.g., 'general', 'engineering'
    type: z.string().optional(), // e.g., 'team', 'direct'
  }),

  createFields: ['projectId', 'name'],
  updateFields: ['name'],
  unique: [],
  searchable: ['name'],
})
