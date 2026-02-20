import type { OpenAPIHono } from '@hono/zod-openapi'
import type { ResourceStore } from '@agentforge/dataobject'
import { createAuthMiddleware } from '../github-integration/routes'

export const authIntegration = {
  name: 'auth-integration',
  version: '1.0.0',
  register(app: OpenAPIHono, ctx: { stores: Map<string, ResourceStore<Record<string, unknown>>> }) {
    const userStore = ctx.stores.get('user')
    if (!userStore) {
      console.warn('[auth] Warning: user store not found, authentication will not work')
      return
    }

    console.log('[auth] Applying global authentication middleware')

    // Apply auth middleware to ALL routes
    // This must run before any other integrations register their routes
    app.use('*', createAuthMiddleware(userStore))
  },
}
