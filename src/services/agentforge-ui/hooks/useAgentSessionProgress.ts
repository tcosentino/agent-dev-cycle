import { useState, useEffect, useRef, useCallback } from 'react'
import { api, type ApiAgentSessionLogEntry, type ApiAgentSessionStage, type ApiAgentSessionStageOutput, type ApiTokenUsage, type ApiResourceMetrics } from '../api'

export interface AgentSessionProgress {
  // Session identity
  id: string
  sessionId: string
  agent: string
  phase: string
  taskPrompt: string

  // Progress state
  stage: ApiAgentSessionStage
  progress: number
  currentStep?: string
  logs: ApiAgentSessionLogEntry[]
  stageOutputs?: {
    cloning?: ApiAgentSessionStageOutput
    loading?: ApiAgentSessionStageOutput
    executing?: ApiAgentSessionStageOutput
    capturing?: ApiAgentSessionStageOutput
    committing?: ApiAgentSessionStageOutput
  }

  // Metrics
  tokenUsage?: ApiTokenUsage
  resourceMetrics?: ApiResourceMetrics

  // Timing
  startedAt?: string

  // Result (when completed/failed)
  summary?: string
  commitSha?: string
  error?: string
  completedAt?: string

  // Connection state
  isConnected: boolean
  isComplete: boolean
}

export interface UseAgentSessionProgressOptions {
  // Whether to auto-connect when sessionId is provided
  autoConnect?: boolean
}

export interface UseAgentSessionProgressResult {
  progress: AgentSessionProgress | null
  isLoading: boolean
  error: string | null
  connect: () => void
  disconnect: () => void
  reconnect: () => void
}

export function useAgentSessionProgress(
  sessionId: string | null,
  options: UseAgentSessionProgressOptions = {}
): UseAgentSessionProgressResult {
  const { autoConnect = true } = options

  const [progress, setProgress] = useState<AgentSessionProgress | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)

  // Clean up event source
  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    setProgress(prev => prev ? { ...prev, isConnected: false } : null)
  }, [])

  // Connect to SSE stream
  const connect = useCallback(() => {
    if (!sessionId) return

    // Close existing connection
    disconnect()

    setIsLoading(true)
    setError(null)

    const eventSource = new EventSource(api.agentSessions.streamUrl(sessionId))
    eventSourceRef.current = eventSource

    // Handle init event
    eventSource.addEventListener('init', (event) => {
      const data = JSON.parse(event.data)
      setProgress({
        id: data.id,
        sessionId: data.sessionId,
        agent: data.agent,
        phase: data.phase,
        taskPrompt: data.taskPrompt,
        stage: data.stage,
        progress: data.progress,
        currentStep: data.currentStep,
        logs: [],
        stageOutputs: data.stageOutputs || {},
        tokenUsage: data.tokenUsage,
        resourceMetrics: data.resourceMetrics,
        startedAt: data.startedAt,
        completedAt: data.completedAt,
        isConnected: true,
        isComplete: data.stage === 'completed' || data.stage === 'failed',
      })
      setIsLoading(false)
    })

    // Note: 'log' events are no longer used - all logs are stage-specific via 'stage-log' events

    // Handle progress events
    eventSource.addEventListener('progress', (event) => {
      const data = JSON.parse(event.data)
      setProgress(prev => {
        if (!prev) return null
        return {
          ...prev,
          stage: data.stage,
          progress: data.progress,
          currentStep: data.currentStep,
        }
      })
    })

    // Handle stage-log events
    eventSource.addEventListener('stage-log', (event) => {
      const data = JSON.parse(event.data)
      setProgress(prev => {
        if (!prev) return null
        const stageKey = data.stage as keyof typeof prev.stageOutputs
        const currentStageOutput = prev.stageOutputs?.[stageKey] || { logs: [] }
        return {
          ...prev,
          stageOutputs: {
            ...prev.stageOutputs,
            [stageKey]: {
              ...currentStageOutput,
              logs: [...currentStageOutput.logs, data.log],
            },
          },
        }
      })
    })

    // Handle stage-complete events
    eventSource.addEventListener('stage-complete', (event) => {
      const data = JSON.parse(event.data)
      setProgress(prev => {
        if (!prev) return null
        const stageKey = data.stage as keyof typeof prev.stageOutputs
        const currentStageOutput = prev.stageOutputs?.[stageKey] || { logs: [] }
        return {
          ...prev,
          stageOutputs: {
            ...prev.stageOutputs,
            [stageKey]: {
              ...currentStageOutput,
              completedAt: data.completedAt,
              duration: data.duration,
            },
          },
        }
      })
    })

    // Handle token usage updates
    eventSource.addEventListener('token-usage', (event) => {
      const data = JSON.parse(event.data) as ApiTokenUsage
      setProgress(prev => prev ? { ...prev, tokenUsage: data } : null)
    })

    // Handle resource metric updates
    eventSource.addEventListener('resource-metric', (event) => {
      const data = JSON.parse(event.data)
      setProgress(prev => {
        if (!prev) return null
        const existing = prev.resourceMetrics || { snapshots: [] }
        return {
          ...prev,
          resourceMetrics: {
            snapshots: [...existing.snapshots, data.snapshot],
            peakCpuPercent: data.peakCpuPercent,
            peakMemoryMb: data.peakMemoryMb,
            avgCpuPercent: data.avgCpuPercent,
            avgMemoryMb: data.avgMemoryMb,
          },
        }
      })
    })

    // Handle result events
    eventSource.addEventListener('result', (event) => {
      const data = JSON.parse(event.data)
      setProgress(prev => {
        if (!prev) return null
        return {
          ...prev,
          stage: data.stage,
          summary: data.summary,
          commitSha: data.commitSha,
          error: data.error,
          completedAt: data.completedAt,
          tokenUsage: data.tokenUsage ?? prev.tokenUsage,
          resourceMetrics: data.resourceMetrics ?? prev.resourceMetrics,
          isComplete: true,
        }
      })
      // Close connection after result
      eventSource.close()
      eventSourceRef.current = null
    })

    // Handle connection errors
    eventSource.onerror = () => {
      setError('Connection lost')
      setProgress(prev => prev ? { ...prev, isConnected: false } : null)
      eventSource.close()
      eventSourceRef.current = null
      setIsLoading(false)
    }
  }, [sessionId, disconnect])

  // Auto-connect when sessionId changes
  useEffect(() => {
    if (autoConnect && sessionId) {
      connect()
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
    }
  }, [sessionId, autoConnect, connect])

  return {
    progress,
    isLoading,
    error,
    connect,
    disconnect,
    reconnect: connect, // Alias for clarity when reconnecting after retry
  }
}

// Helper hook to fetch initial session data (for completed sessions)
export function useAgentSession(sessionId: string | null) {
  const [session, setSession] = useState<Awaited<ReturnType<typeof api.agentSessions.get>> | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!sessionId) {
      setSession(null)
      return
    }

    setIsLoading(true)
    setError(null)

    api.agentSessions.get(sessionId)
      .then(data => {
        setSession(data)
        setIsLoading(false)
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : 'Failed to fetch session')
        setIsLoading(false)
      })
  }, [sessionId])

  return { session, isLoading, error }
}
