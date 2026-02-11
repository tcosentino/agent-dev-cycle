import { createContext, useContext, ReactNode } from 'react'
import { useDeploymentStream } from '../hooks/useDeploymentStream'
import type { Deployment, Workload, DeploymentWithWorkloads } from '../types'

interface DeploymentContextValue {
  deployments: DeploymentWithWorkloads[]
  isLoading: boolean
  isConnected: boolean
  error: string | null
  reconnect: () => void
  getDeploymentById: (id: string) => Deployment | undefined
  getWorkloadById: (id: string) => Workload | undefined
  getWorkloadsByDeploymentId: (deploymentId: string) => Workload[]
}

const DeploymentContext = createContext<DeploymentContextValue | null>(null)

export function DeploymentProvider({
  projectId,
  children,
}: {
  projectId: string | null
  children: ReactNode
}) {
  const streamResult = useDeploymentStream(projectId)

  const getDeploymentById = (id: string) => {
    return streamResult.deployments.find(d => d.id === id)
  }

  const getWorkloadById = (id: string) => {
    for (const deployment of streamResult.deployments) {
      const workload = deployment.workloads.find(w => w.id === id)
      if (workload) return workload
    }
    return undefined
  }

  const getWorkloadsByDeploymentId = (deploymentId: string) => {
    const deployment = getDeploymentById(deploymentId)
    return deployment?.workloads || []
  }

  const value: DeploymentContextValue = {
    ...streamResult,
    getDeploymentById,
    getWorkloadById,
    getWorkloadsByDeploymentId,
  }

  return (
    <DeploymentContext.Provider value={value}>
      {children}
    </DeploymentContext.Provider>
  )
}

export function useDeployments() {
  const context = useContext(DeploymentContext)
  if (!context) {
    throw new Error('useDeployments must be used within a DeploymentProvider')
  }
  return context
}
