import { defineResource, z } from '@agentforge/dataobject'

export const userResource = defineResource({
  name: 'user',

  schema: z.object({
    id: z.string().uuid(),
    githubId: z.string(),
    githubLogin: z.string(),
    githubEmail: z.string().email().optional(),
    githubAccessToken: z.string(),
    avatarUrl: z.string().url().optional(),
  }),

  createFields: ['githubId', 'githubLogin', 'githubEmail', 'githubAccessToken', 'avatarUrl'],
  updateFields: ['githubAccessToken', 'githubEmail', 'avatarUrl'],
  unique: ['githubId'],
  searchable: ['githubLogin'],
})
