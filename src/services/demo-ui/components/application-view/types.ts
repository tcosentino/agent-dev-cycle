export type NodeStatus = 'idle' | 'active' | 'syncing' | 'error'

export type NodeType = 'source' | 'destination' | 'transform' | 'orchestrator'

export interface SystemNode {
  id: string
  label: string
  sublabel?: string
  type: NodeType
  status: NodeStatus
  icon?: 'hubspot' | 'connectwise' | 'transform' | 'sync' | 'database' | 'queue'
  position: { x: number; y: number }
}

export interface Connection {
  id: string
  from: string
  to: string
  active?: boolean
  label?: string
}

export interface DataPulse {
  id: string
  connectionId: string
  progress: number // 0 to 1
  type?: 'contact' | 'company' | 'ticket' | 'opportunity'
}

export interface ApplicationViewState {
  nodes: SystemNode[]
  connections: Connection[]
  pulses: DataPulse[]
  syncStatus?: {
    lastSync: string
    recordsProcessed: number
    status: 'idle' | 'running' | 'completed' | 'error'
  }
}

export interface ApplicationViewProps {
  state: ApplicationViewState
  title?: string
  subtitle?: string
}
