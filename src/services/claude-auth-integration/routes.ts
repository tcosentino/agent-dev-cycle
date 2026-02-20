import type { OpenAPIHono } from '@hono/zod-openapi'
import type { ResourceStore } from '@agentforge/dataobject'
import { type ClaudeAuthInfo } from './types'

interface User {
  id: string
  githubId: string
  githubLogin: string
  claudeAuthType?: 'subscription' | 'api-key'
  claudeSubscriptionToken?: string
  claudeApiKey?: string
}

export function registerClaudeAuthRoutes(
  app: OpenAPIHono,
  ctx: { stores: Map<string, ResourceStore<Record<string, unknown>>> }
) {
  const userStore = ctx.stores.get('user')
  if (!userStore) {
    console.warn('Warning: user store not found, Claude auth will not work')
    return
  }

  // Helper to get user from context
  const getUser = (c: { get: (key: string) => unknown }): User | null => {
    return c.get('user') as User | null
  }

  // Set subscription token
  app.post('/api/claude-auth/set-subscription-token', async (c) => {
    try {
      const user = getUser(c)
      if (!user) {
        console.error('[claude-auth] Unauthorized: No user in context for set-subscription-token')
        return c.json({ error: 'Unauthorized', message: 'User not authenticated' }, 401)
      }

      const body = await c.req.json()
      const { token } = body

      if (!token || typeof token !== 'string') {
        console.error('[claude-auth] Bad request: Missing or invalid token', { userId: user.id })
        return c.json({ error: 'Missing token' }, 400)
      }

      console.log('[claude-auth] Setting subscription token for user:', user.id)

      // Store subscription token and clear API key
      await userStore.update(user.id, {
        claudeAuthType: 'subscription',
        claudeSubscriptionToken: token,
        claudeApiKey: null,
      })

      console.log('[claude-auth] Successfully set subscription token for user:', user.id)
      return c.json({ success: true })
    } catch (error) {
      console.error('[claude-auth] Error setting subscription token:', error)
      return c.json({ error: 'Internal server error', message: String(error) }, 500)
    }
  })

  // Set API key
  app.post('/api/claude-auth/set-api-key', async (c) => {
    try {
      const user = getUser(c)
      if (!user) {
        console.error('[claude-auth] Unauthorized: No user in context for set-api-key')
        return c.json({ error: 'Unauthorized', message: 'User not authenticated' }, 401)
      }

      const body = await c.req.json()
      const { apiKey } = body

      if (!apiKey || typeof apiKey !== 'string') {
        console.error('[claude-auth] Bad request: Missing or invalid API key', { userId: user.id })
        return c.json({ error: 'Missing API key' }, 400)
      }

      // Basic validation
      if (!apiKey.startsWith('sk-ant-')) {
        console.error('[claude-auth] Bad request: Invalid API key format', { userId: user.id })
        return c.json({ error: 'Invalid API key format' }, 400)
      }

      console.log('[claude-auth] Setting API key for user:', user.id)

      // Store API key and clear subscription token
      await userStore.update(user.id, {
        claudeAuthType: 'api-key',
        claudeApiKey: apiKey,
        claudeSubscriptionToken: null,
      })

      console.log('[claude-auth] Successfully set API key for user:', user.id)
      return c.json({ success: true })
    } catch (error) {
      console.error('[claude-auth] Error setting API key:', error)
      return c.json({ error: 'Internal server error', message: String(error) }, 500)
    }
  })

  // Get current auth status
  app.get('/api/claude-auth/status', async (c) => {
    try {
      const user = getUser(c)
      if (!user) {
        console.error('[claude-auth] Unauthorized: No user in context for status check')
        return c.json({ error: 'Unauthorized', message: 'User not authenticated' }, 401)
      }

      const info: ClaudeAuthInfo = {
        type: user.claudeAuthType || null,
        status: 'not-configured',
      }

      if (user.claudeAuthType === 'subscription' && user.claudeSubscriptionToken) {
        info.status = 'valid'
      } else if (user.claudeAuthType === 'api-key' && user.claudeApiKey) {
        info.status = 'valid'
      }

      return c.json(info)
    } catch (error) {
      console.error('[claude-auth] Error getting status:', error)
      return c.json({ error: 'Internal server error', message: String(error) }, 500)
    }
  })

  // Disconnect (clear credentials)
  app.delete('/api/claude-auth/disconnect', async (c) => {
    try {
      const user = getUser(c)
      if (!user) {
        console.error('[claude-auth] Unauthorized: No user in context for disconnect')
        return c.json({ error: 'Unauthorized', message: 'User not authenticated' }, 401)
      }

      console.log('[claude-auth] Disconnecting user:', user.id)

      await userStore.update(user.id, {
        claudeAuthType: null,
        claudeApiKey: null,
        claudeSubscriptionToken: null,
      })

      console.log('[claude-auth] Successfully disconnected user:', user.id)
      return c.json({ success: true })
    } catch (error) {
      console.error('[claude-auth] Error disconnecting:', error)
      return c.json({ error: 'Internal server error', message: String(error) }, 500)
    }
  })
}

// Get credentials for container launch
// Refreshes OAuth token before returning
export async function getClaudeCredentialsForSession(
  userStore: ResourceStore<Record<string, unknown>>,
  userId: string
): Promise<{ success: boolean; envVars?: Record<string, string>; error?: string }> {
  const user = await userStore.findById(userId) as User | null
  if (!user) {
    return { success: false, error: 'User not found' }
  }

  if (!user.claudeAuthType) {
    return { success: false, error: 'Claude Code not connected. Go to Settings to authenticate.' }
  }

  if (user.claudeAuthType === 'api-key') {
    if (!user.claudeApiKey) {
      return { success: false, error: 'API key not configured' }
    }
    return {
      success: true,
      envVars: { ANTHROPIC_API_KEY: user.claudeApiKey },
    }
  }

  // Subscription token
  if (user.claudeAuthType === 'subscription') {
    if (!user.claudeSubscriptionToken) {
      return { success: false, error: 'Subscription token not configured' }
    }
    return {
      success: true,
      envVars: { CLAUDE_CODE_OAUTH_TOKEN: user.claudeSubscriptionToken },
    }
  }

  return { success: false, error: 'Unknown auth type' }
}
