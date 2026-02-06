import type { IntegrationService, IntegrationContext } from '@agentforge/server'
import type { OpenAPIHono } from '@hono/zod-openapi'
import { registerAgentSessionRoutes } from './routes'

export const agentSessionIntegration: IntegrationService = {
  name: 'agent-session',
  version: '0.1.0',

  register(app: OpenAPIHono, ctx: IntegrationContext) {
    registerAgentSessionRoutes(app, ctx)
  },
}
