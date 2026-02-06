import type { IntegrationService, IntegrationContext } from '@agentforge/server'
import type { OpenAPIHono } from '@hono/zod-openapi'
import { registerGitHubRoutes } from './routes'

export const githubIntegration: IntegrationService = {
  name: 'github',
  version: '0.1.0',

  register(app: OpenAPIHono, ctx: IntegrationContext) {
    registerGitHubRoutes(app, ctx)
  },
}

// Re-export utilities for external use
export { parseRepoUrl } from './github-api'
