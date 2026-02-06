import { useState, useEffect, useCallback } from 'react'
import { api, type ClaudeAuthStatus } from '../api'
import './SettingsPage.css'

interface SettingsPageProps {
  onBack?: () => void
}

type AuthMethod = 'oauth' | 'api-key'

export function SettingsPage({ onBack }: SettingsPageProps) {
  const [authStatus, setAuthStatus] = useState<ClaudeAuthStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // OAuth flow state
  const [oauthUrl, setOauthUrl] = useState<string | null>(null)
  const [oauthState, setOauthState] = useState<string | null>(null)
  const [oauthCode, setOauthCode] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // API key state
  const [apiKey, setApiKey] = useState('')
  const [selectedMethod, setSelectedMethod] = useState<AuthMethod>('oauth')

  // Load current auth status
  useEffect(() => {
    async function loadStatus() {
      try {
        setLoading(true)
        const status = await api.claudeAuth.getStatus()
        setAuthStatus(status)
        if (status.type) {
          setSelectedMethod(status.type)
        }
      } catch (err) {
        console.error('Failed to load auth status:', err)
        setError('Failed to load authentication status')
      } finally {
        setLoading(false)
      }
    }
    loadStatus()
  }, [])

  // Start OAuth flow
  const handleStartOAuth = useCallback(async () => {
    try {
      setError(null)
      setSubmitting(true)
      const response = await api.claudeAuth.startOAuth()
      setOauthUrl(response.authUrl)
      setOauthState(response.state)
    } catch (err) {
      console.error('Failed to start OAuth:', err)
      setError('Failed to start authentication flow')
    } finally {
      setSubmitting(false)
    }
  }, [])

  // Complete OAuth flow
  const handleCompleteOAuth = useCallback(async () => {
    if (!oauthCode.trim()) {
      setError('Please enter the authorization code')
      return
    }

    try {
      setError(null)
      setSubmitting(true)
      const response = await api.claudeAuth.completeOAuth(oauthCode.trim(), oauthState || undefined)
      if (response.success) {
        // Reload status
        const status = await api.claudeAuth.getStatus()
        setAuthStatus(status)
        setOauthUrl(null)
        setOauthState(null)
        setOauthCode('')
      }
    } catch (err) {
      console.error('Failed to complete OAuth:', err)
      setError('Failed to complete authentication. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }, [oauthCode, oauthState])

  // Save API key
  const handleSaveApiKey = useCallback(async () => {
    if (!apiKey.trim()) {
      setError('Please enter an API key')
      return
    }

    try {
      setError(null)
      setSubmitting(true)
      const response = await api.claudeAuth.setApiKey(apiKey.trim())
      if (response.success) {
        const status = await api.claudeAuth.getStatus()
        setAuthStatus(status)
        setApiKey('')
      }
    } catch (err) {
      console.error('Failed to save API key:', err)
      setError('Failed to save API key. Make sure it starts with sk-ant-')
    } finally {
      setSubmitting(false)
    }
  }, [apiKey])

  // Disconnect
  const handleDisconnect = useCallback(async () => {
    try {
      setError(null)
      setSubmitting(true)
      await api.claudeAuth.disconnect()
      setAuthStatus({ type: null, status: 'not-configured' })
      setOauthUrl(null)
      setOauthState(null)
    } catch (err) {
      console.error('Failed to disconnect:', err)
      setError('Failed to disconnect')
    } finally {
      setSubmitting(false)
    }
  }, [])

  // Format expiry date
  const formatExpiry = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="settings-page">
        <div className="settings-header">
          {onBack && (
            <button className="settings-back" onClick={onBack}>
              Back
            </button>
          )}
          <h1>Settings</h1>
        </div>
        <div className="settings-loading">Loading...</div>
      </div>
    )
  }

  const isConnected = authStatus?.status === 'valid'
  const isExpired = authStatus?.status === 'expired'

  return (
    <div className="settings-page">
      <div className="settings-header">
        {onBack && (
          <button className="settings-back" onClick={onBack}>
            Back
          </button>
        )}
        <h1>Settings</h1>
      </div>

      <div className="settings-content">
        <section className="settings-section">
          <h2>Claude Code Authentication</h2>
          <p className="settings-description">
            Connect your Claude subscription or API key to run agent sessions.
          </p>

          {error && <div className="settings-error">{error}</div>}

          {/* Current Status */}
          {isConnected && (
            <div className="auth-status auth-status-connected">
              <div className="auth-status-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <div className="auth-status-info">
                <div className="auth-status-title">
                  Connected via {authStatus?.type === 'oauth' ? 'Claude Subscription' : 'API Key'}
                </div>
                {authStatus?.type === 'oauth' && authStatus.expiresAt && (
                  <div className="auth-status-detail">
                    Expires: {formatExpiry(authStatus.expiresAt)}
                  </div>
                )}
              </div>
              <button
                className="settings-button settings-button-secondary"
                onClick={handleDisconnect}
                disabled={submitting}
              >
                Disconnect
              </button>
            </div>
          )}

          {isExpired && (
            <div className="auth-status auth-status-expired">
              <div className="auth-status-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <div className="auth-status-info">
                <div className="auth-status-title">Token Expired</div>
                <div className="auth-status-detail">
                  Please re-authenticate to continue using agent sessions.
                </div>
              </div>
              <button
                className="settings-button settings-button-secondary"
                onClick={handleDisconnect}
                disabled={submitting}
              >
                Clear
              </button>
            </div>
          )}

          {/* Auth Setup Form */}
          {!isConnected && (
            <div className="auth-setup">
              <div className="auth-method-tabs">
                <button
                  className={`auth-method-tab ${selectedMethod === 'oauth' ? 'active' : ''}`}
                  onClick={() => setSelectedMethod('oauth')}
                >
                  Claude Subscription
                </button>
                <button
                  className={`auth-method-tab ${selectedMethod === 'api-key' ? 'active' : ''}`}
                  onClick={() => setSelectedMethod('api-key')}
                >
                  API Key
                </button>
              </div>

              {selectedMethod === 'oauth' && (
                <div className="auth-method-content">
                  {!oauthUrl ? (
                    <>
                      <p>
                        Authenticate with your Claude subscription to use your existing plan for
                        agent sessions.
                      </p>
                      <button
                        className="settings-button settings-button-primary"
                        onClick={handleStartOAuth}
                        disabled={submitting}
                      >
                        {submitting ? 'Starting...' : 'Start Authentication'}
                      </button>
                    </>
                  ) : (
                    <div className="oauth-flow">
                      <div className="oauth-step">
                        <div className="oauth-step-number">1</div>
                        <div className="oauth-step-content">
                          <p>Click the link below to authenticate with Claude:</p>
                          <div className="oauth-url-container">
                            <a
                              href={oauthUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="oauth-url-link"
                            >
                              Open Authentication Page
                            </a>
                            <button
                              className="oauth-copy-button"
                              onClick={() => navigator.clipboard.writeText(oauthUrl)}
                              title="Copy URL"
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="oauth-step">
                        <div className="oauth-step-number">2</div>
                        <div className="oauth-step-content">
                          <p>After authenticating, paste the code you receive:</p>
                          <div className="oauth-code-input">
                            <input
                              type="text"
                              value={oauthCode}
                              onChange={(e) => setOauthCode(e.target.value)}
                              placeholder="Paste authorization code here"
                              disabled={submitting}
                            />
                            <button
                              className="settings-button settings-button-primary"
                              onClick={handleCompleteOAuth}
                              disabled={submitting || !oauthCode.trim()}
                            >
                              {submitting ? 'Verifying...' : 'Complete'}
                            </button>
                          </div>
                        </div>
                      </div>

                      <button
                        className="oauth-cancel"
                        onClick={() => {
                          setOauthUrl(null)
                          setOauthState(null)
                          setOauthCode('')
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              )}

              {selectedMethod === 'api-key' && (
                <div className="auth-method-content">
                  <p>
                    Enter your Anthropic API key to use for agent sessions. API keys can be
                    created in the{' '}
                    <a
                      href="https://console.anthropic.com/settings/keys"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Anthropic Console
                    </a>
                    .
                  </p>
                  <div className="api-key-input">
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="sk-ant-..."
                      disabled={submitting}
                    />
                    <button
                      className="settings-button settings-button-primary"
                      onClick={handleSaveApiKey}
                      disabled={submitting || !apiKey.trim()}
                    >
                      {submitting ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
