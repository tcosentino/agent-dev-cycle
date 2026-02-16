import { Component, type ReactNode, type ErrorInfo } from 'react'
import styles from './ErrorBoundary.module.css'

interface ErrorBoundaryProps {
  children: ReactNode
  level?: 'app' | 'panel'
  onReset?: () => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo)
    this.setState({
      error,
      errorInfo,
    })
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })

    if (this.props.onReset) {
      this.props.onReset()
    }
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      const { level = 'panel' } = this.props
      const isDevelopment = process.env.NODE_ENV === 'development'

      if (level === 'app') {
        return (
          <div className={styles.appError}>
            <div className={styles.errorContent}>
              <h1 className={styles.errorTitle}>Something went wrong</h1>
              <p className={styles.errorMessage}>
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>
              {isDevelopment && this.state.errorInfo && (
                <details className={styles.errorDetails}>
                  <summary>Error details</summary>
                  <pre>{this.state.error?.stack}</pre>
                  <pre>{this.state.errorInfo.componentStack}</pre>
                </details>
              )}
              <div className={styles.errorActions}>
                <button
                  onClick={this.handleReload}
                  className={styles.primaryButton}
                >
                  Reload Page
                </button>
                <a
                  href="https://github.com/anthropics/agentforge/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.secondaryButton}
                >
                  Report Issue
                </a>
              </div>
            </div>
          </div>
        )
      }

      // Panel-level error
      return (
        <div className={styles.panelError}>
          <div className={styles.panelErrorContent}>
            <h3 className={styles.panelErrorTitle}>Error loading this panel</h3>
            <p className={styles.panelErrorMessage}>
              {this.state.error?.message || 'Something went wrong'}
            </p>
            {isDevelopment && this.state.errorInfo && (
              <details className={styles.errorDetails}>
                <summary>Error details</summary>
                <pre>{this.state.error?.stack}</pre>
              </details>
            )}
            <button
              onClick={this.handleReset}
              className={styles.retryButton}
            >
              Retry Panel
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
