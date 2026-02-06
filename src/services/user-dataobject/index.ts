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
    claudeAuthType: z.enum(['oauth', 'api-key']).optional(),
    claudeOAuthAccessToken: z.string().optional(),
    claudeOAuthRefreshToken: z.string().optional(),
    claudeOAuthExpiresAt: z.number().optional(),
    claudeApiKey: z.string().optional(),
  }),

  createFields: ['githubId', 'githubLogin', 'githubEmail', 'githubAccessToken', 'avatarUrl'],
  updateFields: [
    'githubAccessToken',
    'githubEmail',
    'avatarUrl',
    'claudeAuthType',
    'claudeOAuthAccessToken',
    'claudeOAuthRefreshToken',
    'claudeOAuthExpiresAt',
    'claudeApiKey',
  ],
  unique: ['githubId'],
  searchable: ['githubLogin'],
})
