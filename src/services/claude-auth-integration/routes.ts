import type { OpenAPIHono } from '@hono/zod-openapi'
import type { ResourceStore } from '@agentforge/dataobject'
import { randomBytes, createHash } from 'node:crypto'
import {
  CLAUDE_OAUTH_CLIENT_ID,
  CLAUDE_OAUTH_REDIRECT_URI,
  CLAUDE_OAUTH_SCOPE,
  CLAUDE_TOKEN_ENDPOINT,
  type ClaudeAuthInfo,
  type PKCEState,
} from './types'

// In-memory PKCE state storage (in production, use Redis or similar)
const pkceStates = new Map<string, PKCEState>()

// Clean up expired PKCE states (older than 10 minutes)
function cleanupPkceStates() {
  const now = Date.now()
  const maxAge = 10 * 60 * 1000 // 10 minutes
  for (const [userId, state] of pkceStates.entries()) {
    if (now - state.createdAt > maxAge) {
      pkceStates.delete(userId)
    }
  }
}

// Generate PKCE challenge
function generatePKCE(): { codeVerifier: string; codeChallenge: string } {
  // Generate random code verifier (43-128 chars, URL-safe)
  const codeVerifier = randomBytes(32).toString('base64url')

  // Generate code challenge using S256
  const hash = createHash('sha256').update(codeVerifier).digest()
  const codeChallenge = hash.toString('base64url')

  return { codeVerifier, codeChallenge }
}

interface User {
  id: string
  githubId: string
  githubLogin: string
  claudeAuthType?: 'oauth' | 'api-key'
  claudeOAuthAccessToken?: string
  claudeOAuthRefreshToken?: string
  claudeOAuthExpiresAt?: number
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

  // Start OAuth flow - generates PKCE and returns URL
  app.post('/api/claude-auth/start-oauth', async (c) => {
    const user = getUser(c)
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    cleanupPkceStates()

    const { codeVerifier, codeChallenge } = generatePKCE()
    const state = randomBytes(16).toString('base64url')

    // Store PKCE state for this user
    pkceStates.set(user.id, {
      codeVerifier,
      state,
      createdAt: Date.now(),
    })

    // Build OAuth URL
    const params = new URLSearchParams({
      code: 'true',
      client_id: CLAUDE_OAUTH_CLIENT_ID,
      response_type: 'code',
      redirect_uri: CLAUDE_OAUTH_REDIRECT_URI,
      scope: CLAUDE_OAUTH_SCOPE,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      state,
    })

    const authUrl = `https://claude.ai/oauth/authorize?${params}`

    return c.json({ authUrl, state })
  })

  // Complete OAuth flow - exchange code for tokens
  app.post('/api/claude-auth/complete-oauth', async (c) => {
    const user = getUser(c)
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const body = await c.req.json()
    const { code, state } = body

    if (!code) {
      return c.json({ error: 'Missing authorization code' }, 400)
    }

    // Verify PKCE state
    const pkceState = pkceStates.get(user.id)
    if (!pkceState) {
      return c.json({ error: 'No pending OAuth flow. Please start again.' }, 400)
    }

    if (state && state !== pkceState.state) {
      return c.json({ error: 'Invalid state parameter' }, 400)
    }

    // Clean up used state
    pkceStates.delete(user.id)

    try {
      // Exchange code for tokens
      const tokenResponse = await fetch(CLAUDE_TOKEN_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          code,
          code_verifier: pkceState.codeVerifier,
          client_id: CLAUDE_OAUTH_CLIENT_ID,
          redirect_uri: CLAUDE_OAUTH_REDIRECT_URI,
        }),
      })

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text()
        console.error('Token exchange failed:', tokenResponse.status, errorText)
        return c.json({ error: 'Failed to exchange code for token' }, 400)
      }

      const tokenData = await tokenResponse.json()

      // Store credentials
      await userStore.update(user.id, {
        claudeAuthType: 'oauth',
        claudeOAuthAccessToken: tokenData.access_token,
        claudeOAuthRefreshToken: tokenData.refresh_token,
        claudeOAuthExpiresAt: tokenData.expires_at || (Date.now() + tokenData.expires_in * 1000),
      })

      return c.json({
        success: true,
        expiresAt: tokenData.expires_at,
        subscriptionType: tokenData.subscription_type,
      })
    } catch (err) {
      console.error('OAuth completion error:', err)
      return c.json({ error: 'Failed to complete OAuth flow' }, 500)
    }
  })

  // Set API key
  app.post('/api/claude-auth/set-api-key', async (c) => {
    const user = getUser(c)
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const body = await c.req.json()
    const { apiKey } = body

    if (!apiKey || typeof apiKey !== 'string') {
      return c.json({ error: 'Missing API key' }, 400)
    }

    // Basic validation
    if (!apiKey.startsWith('sk-ant-')) {
      return c.json({ error: 'Invalid API key format' }, 400)
    }

    // Store API key and clear OAuth credentials
    await userStore.update(user.id, {
      claudeAuthType: 'api-key',
      claudeApiKey: apiKey,
      claudeOAuthAccessToken: null,
      claudeOAuthRefreshToken: null,
      claudeOAuthExpiresAt: null,
    })

    return c.json({ success: true })
  })

  // Get current auth status
  app.get('/api/claude-auth/status', async (c) => {
    const user = getUser(c)
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const info: ClaudeAuthInfo = {
      type: user.claudeAuthType || null,
      status: 'not-configured',
    }

    if (user.claudeAuthType === 'oauth' && user.claudeOAuthAccessToken) {
      info.expiresAt = user.claudeOAuthExpiresAt
      if (user.claudeOAuthExpiresAt && user.claudeOAuthExpiresAt < Date.now()) {
        info.status = 'expired'
      } else {
        info.status = 'valid'
      }
    } else if (user.claudeAuthType === 'api-key' && user.claudeApiKey) {
      info.status = 'valid'
    }

    return c.json(info)
  })

  // Disconnect (clear credentials)
  app.delete('/api/claude-auth/disconnect', async (c) => {
    const user = getUser(c)
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    await userStore.update(user.id, {
      claudeAuthType: null,
      claudeApiKey: null,
      claudeOAuthAccessToken: null,
      claudeOAuthRefreshToken: null,
      claudeOAuthExpiresAt: null,
    })

    return c.json({ success: true })
  })
}

// Utility function to refresh OAuth token
// Call this before each agent session to extend the token
export async function refreshClaudeToken(
  userStore: ResourceStore<Record<string, unknown>>,
  userId: string
): Promise<{ success: boolean; accessToken?: string; error?: string }> {
  const user = await userStore.findById(userId) as User | null
  if (!user) {
    return { success: false, error: 'User not found' }
  }

  if (user.claudeAuthType !== 'oauth') {
    // API key doesn't need refresh
    if (user.claudeAuthType === 'api-key' && user.claudeApiKey) {
      return { success: true, accessToken: user.claudeApiKey }
    }
    return { success: false, error: 'No Claude auth configured' }
  }

  if (!user.claudeOAuthRefreshToken) {
    return { success: false, error: 'No refresh token available' }
  }

  try {
    const tokenResponse = await fetch(CLAUDE_TOKEN_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        refresh_token: user.claudeOAuthRefreshToken,
        client_id: CLAUDE_OAUTH_CLIENT_ID,
      }),
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('Token refresh failed:', tokenResponse.status, errorText)
      return { success: false, error: 'Token refresh failed' }
    }

    const tokenData = await tokenResponse.json()

    // Update stored credentials
    await userStore.update(userId, {
      claudeOAuthAccessToken: tokenData.access_token,
      claudeOAuthRefreshToken: tokenData.refresh_token || user.claudeOAuthRefreshToken,
      claudeOAuthExpiresAt: tokenData.expires_at || (Date.now() + tokenData.expires_in * 1000),
    })

    return { success: true, accessToken: tokenData.access_token }
  } catch (err) {
    console.error('Token refresh error:', err)
    return { success: false, error: 'Token refresh failed' }
  }
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

  // OAuth: refresh token before use
  const refreshResult = await refreshClaudeToken(userStore, userId)
  if (!refreshResult.success) {
    return {
      success: false,
      error: refreshResult.error || 'Failed to refresh token. Go to Settings to re-authenticate.',
    }
  }

  return {
    success: true,
    envVars: { CLAUDE_CODE_OAUTH_TOKEN: refreshResult.accessToken! },
  }
}
