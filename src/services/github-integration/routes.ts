import type { OpenAPIHono } from '@hono/zod-openapi'
import { setCookie, getCookie, deleteCookie } from 'hono/cookie'
import { createMiddleware } from 'hono/factory'
import type { ResourceStore } from '@agentforge/dataobject'
import { createHmac, randomBytes } from 'node:crypto'
import {
  exchangeCodeForToken,
  getAuthenticatedUser,
  getUserEmail,
  getRepoTree,
  getFileContent,
  getUserRepos,
  createRepo,
} from './github-api'

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || ''
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || ''
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-secret-change-me'
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'
const CALLBACK_URL = process.env.CALLBACK_URL || 'http://localhost:3000/auth/github/callback'

// Simple session signing (in production, use a proper JWT or signed cookie library)
function signUserId(userId: string): string {
  const hmac = createHmac('sha256', SESSION_SECRET)
  hmac.update(userId)
  const signature = hmac.digest('hex')
  return `${userId}.${signature}`
}

function verifyUserId(signedValue: string): string | null {
  const parts = signedValue.split('.')
  if (parts.length !== 2) return null

  const [userId, signature] = parts
  const hmac = createHmac('sha256', SESSION_SECRET)
  hmac.update(userId)
  const expectedSig = hmac.digest('hex')

  if (signature !== expectedSig) return null
  return userId
}

interface User {
  id: string
  githubId: string
  githubLogin: string
  githubEmail?: string
  githubAccessToken: string
  avatarUrl?: string
}

// Auth middleware - attaches user to context if authenticated
export function createAuthMiddleware(userStore: ResourceStore<Record<string, unknown>>) {
  return createMiddleware<{ Variables: { user: User | null; userId: string | null } }>(
    async (c, next) => {
      const sessionCookie = getCookie(c, 'session')

      if (!sessionCookie) {
        console.log('[auth] No session cookie found for request:', c.req.path)
        c.set('user', null)
        c.set('userId', null)
        return next()
      }

      const userId = verifyUserId(sessionCookie)
      if (!userId) {
        console.error('[auth] Failed to verify session cookie for request:', c.req.path)
        c.set('user', null)
        c.set('userId', null)
        return next()
      }

      try {
        const user = await userStore.findById(userId)
        if (user) {
          console.log('[auth] Authenticated user:', userId, 'for request:', c.req.path)
          c.set('user', user as User | null)
          c.set('userId', userId)
        } else {
          console.error('[auth] User not found in store:', userId)
          c.set('user', null)
          c.set('userId', null)
        }
      } catch (error) {
        console.error('[auth] Error loading user from store:', error)
        c.set('user', null)
        c.set('userId', null)
      }

      return next()
    }
  )
}

// Require auth middleware - returns 401 if not authenticated
export const requireAuth = createMiddleware<{ Variables: { user: User; userId: string } }>(
  async (c, next) => {
    const user = c.get('user')
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    return next()
  }
)

export function registerGitHubRoutes(
  app: OpenAPIHono,
  ctx: { stores: Map<string, ResourceStore<Record<string, unknown>>> }
) {
  const userStore = ctx.stores.get('user')
  if (!userStore) {
    console.warn('Warning: user store not found, GitHub auth will not work')
    return
  }

  // Note: Auth middleware is now applied globally by auth-integration
  // which loads before this integration (alphabetically)

  // OAuth: Start login flow
  app.get('/auth/github', (c) => {
    if (!GITHUB_CLIENT_ID) {
      return c.json({ error: 'GitHub OAuth not configured' }, 500)
    }

    // Generate state for CSRF protection
    const state = randomBytes(16).toString('hex')

    // Store state in cookie for verification
    setCookie(c, 'oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      maxAge: 600, // 10 minutes
      path: '/',
    })

    const params = new URLSearchParams({
      client_id: GITHUB_CLIENT_ID,
      redirect_uri: CALLBACK_URL,
      scope: 'repo user:email',
      state,
    })

    return c.redirect(`https://github.com/login/oauth/authorize?${params}`)
  })

  // OAuth: Handle callback
  app.get('/auth/github/callback', async (c) => {
    const code = c.req.query('code')
    const state = c.req.query('state')
    const storedState = getCookie(c, 'oauth_state')

    // Clear state cookie
    deleteCookie(c, 'oauth_state')

    if (!code || !state) {
      return c.redirect(`${FRONTEND_URL}?error=missing_code`)
    }

    if (state !== storedState) {
      return c.redirect(`${FRONTEND_URL}?error=invalid_state`)
    }

    try {
      // Exchange code for token
      const tokenData = await exchangeCodeForToken(
        code,
        GITHUB_CLIENT_ID,
        GITHUB_CLIENT_SECRET,
        CALLBACK_URL
      )

      // Get user info
      const githubUser = await getAuthenticatedUser(tokenData.access_token)
      const email = githubUser.email || await getUserEmail(tokenData.access_token)

      // Find or create user
      const existingUsers = await userStore.findAll({ where: { githubId: String(githubUser.id) } })
      let user: User

      if (existingUsers.length > 0) {
        // Update existing user with new token
        const updated = await userStore.update(existingUsers[0].id as string, {
          githubAccessToken: tokenData.access_token,
          githubEmail: email,
          avatarUrl: githubUser.avatar_url,
        })
        user = updated as unknown as User
      } else {
        // Create new user
        const created = await userStore.create({
          githubId: String(githubUser.id),
          githubLogin: githubUser.login,
          githubEmail: email,
          githubAccessToken: tokenData.access_token,
          avatarUrl: githubUser.avatar_url,
        })
        user = created as unknown as User
      }

      // Set session cookie
      setCookie(c, 'session', signUserId(user.id), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Lax',
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: '/',
      })

      return c.redirect(FRONTEND_URL)
    } catch (err) {
      console.error('OAuth callback error:', err)
      return c.redirect(`${FRONTEND_URL}?error=auth_failed`)
    }
  })

  // OAuth: Logout
  app.get('/auth/github/logout', (c) => {
    deleteCookie(c, 'session')
    return c.redirect(FRONTEND_URL)
  })

  // Helper to get user from context (set by auth middleware)
  const getUser = (c: { get: (key: string) => unknown }): User | null => {
    return c.get('user') as User | null
  }

  // API: Get current user
  app.get('/api/me', (c) => {
    const user = getUser(c)
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    // Don't expose the access token
    return c.json({
      id: user.id,
      githubId: user.githubId,
      githubLogin: user.githubLogin,
      githubEmail: user.githubEmail,
      avatarUrl: user.avatarUrl,
    })
  })

  // API: Get repository tree
  app.get('/api/github/repos/:owner/:repo/tree', async (c) => {
    const user = getUser(c)
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const { owner, repo } = c.req.param()
    const branch = c.req.query('branch') || 'main'

    try {
      const tree = await getRepoTree(user.githubAccessToken, owner, repo, branch)

      // Transform to simpler format
      const files = tree.tree
        .filter(item => item.type === 'blob')
        .map(item => ({
          path: item.path,
          size: item.size,
        }))

      return c.json({ files, truncated: tree.truncated })
    } catch (err) {
      console.error('Error fetching repo tree:', err)
      return c.json({ error: 'Failed to fetch repository tree' }, 500)
    }
  })

  // API: Get user's repositories
  app.get('/api/github/repos', async (c) => {
    const user = getUser(c)
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    try {
      const repos = await getUserRepos(user.githubAccessToken)
      return c.json({ repos })
    } catch (err) {
      console.error('Error fetching user repos:', err)
      return c.json({ error: 'Failed to fetch repositories' }, 500)
    }
  })

  // API: Create a new repository
  app.post('/api/github/repos', async (c) => {
    const user = getUser(c)
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    try {
      const body = await c.req.json()
      const { name, description, isPrivate, initializeWithReadme } = body

      if (!name || typeof name !== 'string') {
        return c.json({ error: 'Repository name is required' }, 400)
      }

      // Validate name format (no spaces, valid characters)
      if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
        return c.json({ error: 'Repository name can only contain letters, numbers, hyphens, and underscores' }, 400)
      }

      const repo = await createRepo(user.githubAccessToken, {
        name,
        description,
        private: isPrivate ?? true,
        auto_init: initializeWithReadme ?? true,
      })

      return c.json({ repo })
    } catch (err) {
      console.error('Error creating repo:', err)
      return c.json({ error: err instanceof Error ? err.message : 'Failed to create repository' }, 500)
    }
  })

  // API: Get file content
  app.get('/api/github/repos/:owner/:repo/contents/*', async (c) => {
    const user = getUser(c)
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const { owner, repo } = c.req.param()
    const path = c.req.path.replace(`/api/github/repos/${owner}/${repo}/contents/`, '')
    const branch = c.req.query('branch') || 'main'

    try {
      const content = await getFileContent(user.githubAccessToken, owner, repo, path, branch)
      return c.json({ content })
    } catch (err) {
      console.error(`Error fetching file content for path="${path}":`, err)
      return c.json({ error: 'Failed to fetch file content', details: err instanceof Error ? err.message : String(err) }, 500)
    }
  })
}
