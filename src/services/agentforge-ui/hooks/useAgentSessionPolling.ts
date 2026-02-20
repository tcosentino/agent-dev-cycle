import { useState, useEffect, useRef, useCallback } from 'react'
import { getAgentSession, type ApiAgentSession } from '../api'

type AgentSession = ApiAgentSession

interface UseAgentSessionPollingOptions {
  sessionId: string
  enabled?: boolean
  interval?: number // milliseconds
  onUpdate?: (session: AgentSession) => void
}

const TERMINAL_STAGES = ['completed', 'failed', 'cancelled']

export function useAgentSessionPolling({
  sessionId,
  enabled = true,
  interval = 3000,
  onUpdate,
}: UseAgentSessionPollingOptions) {
  const [session, setSession] = useState<AgentSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const errorCountRef = useRef(0)
  const currentIntervalRef = useRef(interval)
  const isActiveRef = useRef(true)

  // Detect if tab is visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      isActiveRef.current = !document.hidden
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  const fetchSession = useCallback(async () => {
    try {
      const data = await getAgentSession(sessionId)

      // Only update if data has changed
      setSession((prev) => {
        if (!prev || JSON.stringify(prev) !== JSON.stringify(data)) {
          onUpdate?.(data)
          return data
        }
        return prev
      })

      setError(null)
      errorCountRef.current = 0
      currentIntervalRef.current = interval // Reset to normal interval
      setLoading(false)

      // Stop polling if terminal state
      if (TERMINAL_STAGES.includes(data.stage)) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      }
    } catch (err) {
      console.error('Failed to fetch agent session:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch session')
      setLoading(false)

      // Exponential backoff: 3s → 6s → 12s
      errorCountRef.current++
      const backoffInterval = Math.min(interval * Math.pow(2, errorCountRef.current), 12000)
      currentIntervalRef.current = backoffInterval
    }
  }, [sessionId, interval, onUpdate])

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    // Initial fetch
    fetchSession()

    // Set up polling
    const startPolling = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }

      intervalRef.current = setInterval(() => {
        // Reduce frequency when tab is inactive
        const activeInterval = isActiveRef.current ? currentIntervalRef.current : 10000

        if (session && !TERMINAL_STAGES.includes(session.stage)) {
          fetchSession()
        } else if (!session) {
          fetchSession()
        }
      }, isActiveRef.current ? currentIntervalRef.current : 10000)
    }

    startPolling()

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [enabled, fetchSession, session])

  return {
    session,
    loading,
    error,
    refetch: fetchSession,
  }
}
