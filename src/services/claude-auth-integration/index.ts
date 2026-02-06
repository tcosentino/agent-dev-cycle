import type { IntegrationService, IntegrationContext } from '@agentforge/server'
import type { OpenAPIHono } from '@hono/zod-openapi'
import { registerClaudeAuthRoutes } from './routes'

export const claudeAuthIntegration: IntegrationService = {
  name: 'claude-auth',
  version: '0.1.0',

  register(app: OpenAPIHono, ctx: IntegrationContext) {
    registerClaudeAuthRoutes(app, ctx)
  },
}

// Re-export utilities for use in agent session launching
export { getClaudeCredentialsForSession, refreshClaudeToken } from './routes'
export * from './types'
