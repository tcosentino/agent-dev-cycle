import { z } from 'zod'

// OAuth credentials from Claude Code subscription
export const oauthCredentialsSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresAt: z.number(),
  subscriptionType: z.string().optional(),
})

export type OAuthCredentials = z.infer<typeof oauthCredentialsSchema>

// API key credentials
export const apiKeyCredentialsSchema = z.object({
  apiKey: z.string(),
})

export type ApiKeyCredentials = z.infer<typeof apiKeyCredentialsSchema>

// Union of credential types
export type ClaudeCredentials =
  | { type: 'oauth'; credentials: OAuthCredentials }
  | { type: 'api-key'; credentials: ApiKeyCredentials }

// Auth status for UI display
export type AuthStatus = 'valid' | 'expired' | 'not-configured'

export interface ClaudeAuthInfo {
  type: 'subscription' | 'api-key' | null
  status: AuthStatus
}

// PKCE flow state (stored temporarily during OAuth)
export interface PKCEState {
  codeVerifier: string
  state: string
  createdAt: number
}

// Claude Code OAuth constants
export const CLAUDE_OAUTH_CLIENT_ID = '9d1c250a-e61b-44d9-88ed-5944d1962f5e'
export const CLAUDE_OAUTH_REDIRECT_URI = 'https://console.anthropic.com/oauth/code/callback'
export const CLAUDE_OAUTH_SCOPE = 'user:inference'

// Token endpoint (discovered from Claude Code behavior)
export const CLAUDE_TOKEN_ENDPOINT = 'https://console.anthropic.com/api/oauth/token'
