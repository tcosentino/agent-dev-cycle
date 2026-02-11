import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { CheckCircleIcon, AlertTriangleIcon, XCircleIcon, InfoIcon, XIcon } from '../../icons/icons'
import styles from './Toast.module.css'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface ToastOptions {
  type?: ToastType
  title: string
  message?: string
  duration?: number
  onClick?: () => void
}

interface Toast extends ToastOptions {
  id: string
  exiting?: boolean
}

interface ToastContextValue {
  showToast: (options: ToastOptions) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}

interface ToastProviderProps {
  children: ReactNode
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const startExiting = useCallback((id: string) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t))
    setTimeout(() => removeToast(id), 300) // Match animation duration
  }, [removeToast])

  const showToast = useCallback((options: ToastOptions) => {
    const id = Math.random().toString(36).substring(2, 9)
    const toast: Toast = {
      id,
      type: options.type || 'info',
      title: options.title,
      message: options.message,
      duration: options.duration || 5000,
    }

    setToasts(prev => [...prev, toast])

    // Auto-dismiss after duration
    setTimeout(() => {
      startExiting(id)
    }, toast.duration!)
  }, [startExiting])

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon width={20} height={20} />
      case 'error':
        return <XCircleIcon width={20} height={20} />
      case 'warning':
        return <AlertTriangleIcon width={20} height={20} />
      case 'info':
      default:
        return <InfoIcon width={20} height={20} />
    }
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className={styles.toastContainer}>
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`${styles.toast} ${styles[toast.type!]} ${toast.exiting ? styles.exiting : ''} ${toast.onClick ? styles.clickable : ''}`}
            onClick={() => {
              if (toast.onClick) {
                toast.onClick()
                startExiting(toast.id)
              }
            }}
          >
            <div className={styles.toastIcon}>
              {getIcon(toast.type!)}
            </div>
            <div className={styles.toastContent}>
              <h4 className={styles.toastTitle}>{toast.title}</h4>
              {toast.message && <p className={styles.toastMessage}>{toast.message}</p>}
            </div>
            <button
              className={styles.toastClose}
              onClick={(e) => {
                e.stopPropagation()
                startExiting(toast.id)
              }}
              aria-label="Close notification"
            >
              <XIcon width={16} height={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
