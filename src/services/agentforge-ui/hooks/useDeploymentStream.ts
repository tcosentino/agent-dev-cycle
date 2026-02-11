import { useState, useEffect, useRef, useCallback } from 'react'
import { api } from '../api'
import type { Deployment, Workload } from '../types'

export interface DeploymentWithWorkloads extends Deployment {
  workloads: Workload[]
}

export interface WorkloadUpdate {
  workloadId: string
  deploymentId: string
  projectId: string
  currentStage: string
  status: string
  stages: Array<{
    stage: string
    status: string
    startedAt?: string
    completedAt?: string
    duration?: number
    logs: string[]
    error?: string
  }>
  updatedAt: string
}

export interface UseDeploymentStreamResult {
  deployments: DeploymentWithWorkloads[]
  isLoading: boolean
  isConnected: boolean
  error: string | null
  reconnect: () => void
}

function updateWorkloadInDeployments(
  deployments: DeploymentWithWorkloads[],
  update: WorkloadUpdate
): DeploymentWithWorkloads[] {
  return deployments.map(deployment => {
    if (deployment.id !== update.deploymentId) {
      return deployment
    }

    return {
      ...deployment,
      workloads: deployment.workloads.map(workload => {
        if (workload.id !== update.workloadId) {
          return workload
        }

        return {
          ...workload,
          currentStage: update.currentStage as any,
          status: update.status as any,
          stages: update.stages as any,
          updatedAt: update.updatedAt,
        }
      })
    }
  })
}

export function useDeploymentStream(
  projectId: string | null
): UseDeploymentStreamResult {
  const [deployments, setDeployments] = useState<DeploymentWithWorkloads[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    setIsConnected(false)
  }, [])

  const connect = useCallback(() => {
    if (!projectId) return

    disconnect()

    setIsLoading(true)
    setError(null)

    const streamUrl = `${api.projects.streamUrl(projectId)}`
    const eventSource = new EventSource(streamUrl)
    eventSourceRef.current = eventSource

    eventSource.addEventListener('init', (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'init') {
          setDeployments(data.deployments || [])
          setIsConnected(true)
          setIsLoading(false)
          reconnectAttemptsRef.current = 0
        }
      } catch (err) {
        console.error('Failed to parse init event:', err)
      }
    })

    eventSource.addEventListener('workload-update', (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'workload-update') {
          setDeployments(prev => updateWorkloadInDeployments(prev, data.update))
        }
      } catch (err) {
        console.error('Failed to parse workload-update event:', err)
      }
    })

    eventSource.addEventListener('deployment-deleted', (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'deployment-deleted') {
          setDeployments(prev => prev.filter(d => d.id !== data.deploymentId))
        }
      } catch (err) {
        console.error('Failed to parse deployment-deleted event:', err)
      }
    })

    eventSource.addEventListener('ping', () => {
      // Just to keep the connection alive
    })

    eventSource.onerror = () => {
      setError('Connection lost')
      setIsConnected(false)
      eventSource.close()
      eventSourceRef.current = null
      setIsLoading(false)

      // Exponential backoff for reconnection
      reconnectAttemptsRef.current++
      const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000)

      console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current})`)

      reconnectTimeoutRef.current = setTimeout(() => {
        if (projectId) {
          connect()
        }
      }, delay)
    }
  }, [projectId, disconnect])

  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0
    connect()
  }, [connect])

  useEffect(() => {
    if (projectId) {
      connect()
    } else {
      disconnect()
      setDeployments([])
      setIsLoading(false)
    }

    return () => {
      disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  return {
    deployments,
    isLoading,
    isConnected,
    error,
    reconnect,
  }
}
