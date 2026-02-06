import type {
  ModuleDefinition,
  ModuleType,
  DeploymentTarget,
  DeploymentArtifacts,
  TestDefinition,
  StageResult,
} from './types'

// Each module type implements this interface
export interface ModuleTypeHandler {
  type: ModuleType

  // Validate the module definition
  validate(module: ModuleDefinition): Promise<ValidationResult>

  // Generate Dockerfile if not provided
  generateDockerfile?(module: ModuleDefinition): string

  // Get tests to run after deployment
  getTests(module: ModuleDefinition, artifacts: DeploymentArtifacts): TestDefinition[]

  // Optional: Custom build logic
  build?(module: ModuleDefinition, target: DeploymentTarget): Promise<BuildResult>

  // Optional: Custom deploy logic
  deploy?(module: ModuleDefinition, target: DeploymentTarget, artifacts: DeploymentArtifacts): Promise<DeployResult>
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export interface BuildResult {
  success: boolean
  artifacts: Partial<DeploymentArtifacts>
  logs: string[]
  error?: string
}

export interface DeployResult {
  success: boolean
  artifacts: Partial<DeploymentArtifacts>
  logs: string[]
  error?: string
}

// Registry of module type handlers
const handlers = new Map<ModuleType, ModuleTypeHandler>()

export function registerModuleType(handler: ModuleTypeHandler) {
  handlers.set(handler.type, handler)
}

export function getModuleTypeHandler(type: ModuleType): ModuleTypeHandler | undefined {
  return handlers.get(type)
}

export function getRegisteredModuleTypes(): ModuleType[] {
  return Array.from(handlers.keys())
}
