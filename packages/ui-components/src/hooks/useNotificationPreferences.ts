import { useState, useEffect } from 'react'

export interface NotificationPreferences {
  sessionStart: { enabled: boolean; duration: number }
  sessionComplete: { enabled: boolean; duration: number | null } // null = persist
  sessionFailed: { enabled: boolean; duration: number | null }
  sessionCancelled: { enabled: boolean; duration: number }
  sessionRetried: { enabled: boolean; duration: number }
  apiError: { enabled: boolean; duration: number | null }
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  sessionStart: { enabled: true, duration: 4000 },
  sessionComplete: { enabled: true, duration: null }, // persist
  sessionFailed: { enabled: true, duration: null }, // persist
  sessionCancelled: { enabled: true, duration: 3000 },
  sessionRetried: { enabled: true, duration: 3000 },
  apiError: { enabled: true, duration: null }, // persist
}

const STORAGE_KEY = 'agentforge-notification-preferences'

export function useNotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferences>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) }
      }
    } catch (err) {
      console.warn('Failed to load notification preferences:', err)
    }
    return DEFAULT_PREFERENCES
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
    } catch (err) {
      console.warn('Failed to save notification preferences:', err)
    }
  }, [preferences])

  return {
    preferences,
    setPreferences,
    resetPreferences: () => setPreferences(DEFAULT_PREFERENCES),
  }
}
