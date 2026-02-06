// =============================================================================
// WORKLOAD - Individual running instance of a module
// =============================================================================

// Pipeline stages a workload goes through
export type WorkloadStage =
  | 'pending'
  | 'validate'
  | 'build'
  | 'deploy'
  | 'healthcheck'
  | 'test'
  | 'complete'
  | 'failed'
  | 'rolledback'

export type StageStatus = 'pending' | 'running' | 'success' | 'failed' | 'skipped'

export interface StageResult {
  stage: WorkloadStage
  status: StageStatus
  startedAt?: string  // ISO string for JSON serialization
  completedAt?: string
  duration?: number   // ms
  logs: string[]
  error?: string
}

export interface Workload {
  id: string
  deploymentId: string  // Parent deployment
  moduleId: string
  moduleName: string
  moduleType: string

  status: 'pending' | 'running' | 'success' | 'failed' | 'rolledback' | 'stopped'
  currentStage: WorkloadStage
  stages: StageResult[]

  // Runtime info
  target: WorkloadTarget
  artifacts?: WorkloadArtifacts

  // Timestamps
  createdAt: string
  updatedAt: string
  completedAt?: string
}

export interface WorkloadTarget {
  type: 'docker-local' | 'docker-compose' | 'kubernetes'
  config: Record<string, unknown>
}

export interface WorkloadArtifacts {
  imageId?: string
  imageName?: string
  containerId?: string
  containerName?: string
  port?: number
  url?: string
}

// =============================================================================
// DEPLOYMENT - Collection of workloads deployed together
// =============================================================================

export interface Deployment {
  id: string
  projectId: string
  name: string          // e.g., "feature-auth-testing" or "main-preview"
  description?: string

  // What triggered this deployment
  trigger: DeploymentTrigger

  // Overall status (derived from workloads)
  status: 'pending' | 'running' | 'success' | 'failed' | 'stopped'

  // Workload IDs in this deployment
  workloadIds: string[]

  // Timestamps
  createdAt: string
  updatedAt: string
  completedAt?: string
}

export interface DeploymentTrigger {
  type: 'manual' | 'agent' | 'git-push' | 'schedule'
  // For agent triggers
  agentId?: string
  agentName?: string
  // For git triggers
  branch?: string
  commit?: string
  // For manual triggers
  userId?: string
}

// =============================================================================
// MODULE DEFINITION - What gets deployed as a workload
// =============================================================================

export interface ModuleDefinition {
  id: string
  name: string
  type: ModuleType
  version: string

  // Source files for this module
  sourceDir: string

  // Build configuration
  build: BuildConfig

  // Runtime configuration
  runtime: RuntimeConfig

  // Module-type-specific config
  config: Record<string, unknown>
}

export type ModuleType = 'api-resource' | 'background-job' | 'ui-page'

export interface BuildConfig {
  dockerfile?: string
  context?: string
  buildArgs?: Record<string, string>
}

export interface RuntimeConfig {
  port?: number
  env?: Record<string, string>
  healthcheck?: HealthcheckConfig
  resources?: ResourceLimits
}

export interface HealthcheckConfig {
  path: string
  interval: number
  timeout: number
  retries: number
}

export interface ResourceLimits {
  memory?: string
  cpu?: string
}

// =============================================================================
// TESTS - Run after workload deployment
// =============================================================================

export interface TestDefinition {
  name: string
  type: 'http' | 'script'
  config: HttpTestConfig | ScriptTestConfig
}

export interface HttpTestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  path: string
  headers?: Record<string, string>
  body?: unknown
  expect: {
    status?: number
    bodyContains?: string
    bodyJson?: Record<string, unknown>
  }
}

export interface ScriptTestConfig {
  command: string
  args?: string[]
  expectExitCode?: number
}

// =============================================================================
// EVENTS - Emitted during workload deployment
// =============================================================================

export type WorkloadEvent =
  | { type: 'stage-start'; workloadId: string; stage: WorkloadStage }
  | { type: 'stage-complete'; workloadId: string; stage: WorkloadStage; result: StageResult }
  | { type: 'log'; workloadId: string; stage: WorkloadStage; message: string }
  | { type: 'artifact'; workloadId: string; key: string; value: unknown }
  | { type: 'test-start'; workloadId: string; test: string }
  | { type: 'test-complete'; workloadId: string; test: string; passed: boolean; error?: string }
  | { type: 'workload-complete'; workloadId: string; status: 'success' | 'failed' }

export type DeploymentEvent =
  | { type: 'deployment-start'; deploymentId: string }
  | { type: 'workload-event'; deploymentId: string; event: WorkloadEvent }
  | { type: 'deployment-complete'; deploymentId: string; status: 'success' | 'failed' }

// Legacy aliases for backwards compatibility
/** @deprecated Use WorkloadStage */
export type DeploymentStage = WorkloadStage
/** @deprecated Use WorkloadArtifacts */
export type DeploymentArtifacts = WorkloadArtifacts
/** @deprecated Use WorkloadTarget */
export type DeploymentTarget = WorkloadTarget
