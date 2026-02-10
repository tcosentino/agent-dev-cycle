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
    // Claude Code authentication
    claudeAuthType: z.enum(['subscription', 'api-key']).optional(),
    claudeSubscriptionToken: z.string().optional(),
    claudeApiKey: z.string().optional(),
  }),

  createFields: ['githubId', 'githubLogin', 'githubEmail', 'githubAccessToken', 'avatarUrl'],
  updateFields: [
    'githubAccessToken',
    'githubEmail',
    'avatarUrl',
    'claudeAuthType',
    'claudeSubscriptionToken',
    'claudeApiKey',
  ],
  unique: ['githubId'],
  searchable: ['githubLogin'],
})
