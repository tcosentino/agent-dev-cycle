import { useState, useEffect, useCallback } from 'react'
import { api, type ClaudeAuthStatus } from '../api'
import './SettingsPage.css'

interface SettingsPageProps {
  onBack?: () => void
}

type AuthMethod = 'subscription' | 'api-key'

export function SettingsPage({ onBack }: SettingsPageProps) {
  const [authStatus, setAuthStatus] = useState<ClaudeAuthStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Subscription token state
  const [subscriptionToken, setSubscriptionToken] = useState('')

  // API key state
  const [apiKey, setApiKey] = useState('')
  const [selectedMethod, setSelectedMethod] = useState<AuthMethod>('subscription')

  // Load current auth status
  useEffect(() => {
    async function loadStatus() {
      try {
        setLoading(true)
        const status = await api.claudeAuth.getStatus()
        setAuthStatus(status)
        if (status.type) {
          setSelectedMethod(status.type === 'subscription' ? 'subscription' : 'api-key')
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

  // Save subscription token
  const handleSaveSubscriptionToken = useCallback(async () => {
    if (!subscriptionToken.trim()) {
      setError('Please enter a subscription token')
      return
    }

    try {
      setError(null)
      setSubmitting(true)
      const response = await api.claudeAuth.setSubscriptionToken(subscriptionToken.trim())
      if (response.success) {
        const status = await api.claudeAuth.getStatus()
        setAuthStatus(status)
        setSubscriptionToken('')
      }
    } catch (err) {
      console.error('Failed to save subscription token:', err)
      setError('Failed to save subscription token. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }, [subscriptionToken])

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
    } catch (err) {
      console.error('Failed to disconnect:', err)
      setError('Failed to disconnect')
    } finally {
      setSubmitting(false)
    }
  }, [])

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
                  Connected via {authStatus?.type === 'subscription' ? 'Claude Subscription' : 'API Key'}
                </div>
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
                  className={`auth-method-tab ${selectedMethod === 'subscription' ? 'active' : ''}`}
                  onClick={() => setSelectedMethod('subscription')}
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

              {selectedMethod === 'subscription' && (
                <div className="auth-method-content">
                  <div className="auth-instructions">
                    <p>To use your Claude subscription with AgentForge:</p>
                    <ol>
                      <li>
                        Open your terminal and run:
                        <div className="code-block">
                          <code>claude setup-token</code>
                        </div>
                      </li>
                      <li>Follow the prompts to authenticate with your Claude account</li>
                      <li>Copy the token you receive and paste it below</li>
                    </ol>
                  </div>
                  <div className="token-input">
                    <input
                      type="password"
                      value={subscriptionToken}
                      onChange={(e) => setSubscriptionToken(e.target.value)}
                      placeholder="Paste your subscription token here"
                      disabled={submitting}
                    />
                    <button
                      className="settings-button settings-button-primary"
                      onClick={handleSaveSubscriptionToken}
                      disabled={submitting || !subscriptionToken.trim()}
                    >
                      {submitting ? 'Saving...' : 'Save Token'}
                    </button>
                  </div>
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
