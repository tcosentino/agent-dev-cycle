export type FileCategory =
  | 'config'
  | 'briefing'
  | 'prompt'
  | 'memory'
  | 'session'
  | 'state'
  | 'source'
  | 'other'

export interface FileNode {
  name: string
  path: string
  type: 'file' | 'folder'
  category: FileCategory
  children?: FileNode[]
  extension?: string
  isService?: boolean  // True if this folder is a service (has service.json)
}

export type ProjectData = Record<string, Record<string, string>>

// Workload stage types (matches @agentforge/runtime)
export type WorkloadStage =
  | 'pending'
  | 'starting-container'
  | 'cloning-repo'
  | 'starting-service'
  | 'running'
  | 'graceful-shutdown'
  | 'stopped'
  | 'failed'

export type StageStatus = 'pending' | 'running' | 'success' | 'failed' | 'skipped'

export interface StageResult {
  stage: WorkloadStage
  status: StageStatus
  startedAt?: string
  completedAt?: string
  duration?: number
  logs: string[]
  error?: string
}

export interface WorkloadArtifacts {
  imageId?: string
  imageName?: string
  containerId?: string
  containerName?: string
  port?: number
  url?: string
}

export interface Workload {
  id: string
  deploymentId: string
  moduleId: string
  moduleName: string
  moduleType: string
  status: 'pending' | 'running' | 'success' | 'failed' | 'rolledback' | 'stopped'
  currentStage: WorkloadStage
  stages: StageResult[]
  artifacts?: WorkloadArtifacts
  createdAt: string
  updatedAt: string
  completedAt?: string
}

export interface DeploymentTrigger {
  type: 'manual' | 'agent' | 'git-push' | 'schedule'
  agentId?: string
  agentName?: string
  branch?: string
  commit?: string
  userId?: string
}

export interface Deployment {
  id: string
  projectId: string
  name: string
  description?: string
  trigger: DeploymentTrigger
  status: 'pending' | 'running' | 'success' | 'failed' | 'stopped'
  workloadIds: string[]
  createdAt: string
  updatedAt: string
  completedAt?: string
}

export interface DeploymentWithWorkloads extends Deployment {
  workloads: Workload[]
}

export interface DbSnapshot {
  projects: Record<string, unknown>[]
  tasks: Record<string, unknown>[]
  channels: Record<string, unknown>[]
  messages: Record<string, unknown>[]
  agentStatus: Record<string, unknown>[]
  sessions: Record<string, unknown>[]
  deployments: Deployment[]
  workloads: Workload[]
}

export type ProjectDbData = Record<string, DbSnapshot>

export type DbTableName = keyof DbSnapshot

// Service metadata (from service.json)
export interface ServiceField {
  name: string
  type: string
  required?: boolean
  auto?: boolean
  unique?: boolean
  min?: number
  max?: number
}

export interface ServiceEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  path: string
  description: string
}

export interface ServiceMetadata {
  name: string
  type: 'dataobject' | 'api' | 'worker' | 'ui'
  version: string
  description: string
  entry: string
  schema?: {
    fields: ServiceField[]
  }
  endpoints?: ServiceEndpoint[]
  dependencies?: string[]
  tags?: string[]
}

// Workload control types
export interface WorkloadControlResponse {
  success: true
  workloadId: string
  stage: WorkloadStage
}

export interface WorkloadControlError {
  error: 'NotFound' | 'InvalidState' | 'Conflict'
  message: string
  workloadId?: string
  currentStage?: WorkloadStage
}

export interface WorkloadLogEntry {
  timestamp: string
  stage: WorkloadStage
  message: string
  level: 'info' | 'warn' | 'error'
}

