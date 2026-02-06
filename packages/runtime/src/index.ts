// Types
export type {
  // Workload types
  Workload,
  WorkloadStage,
  WorkloadTarget,
  WorkloadArtifacts,
  WorkloadEvent,
  StageResult,
  StageStatus,
  // Deployment types
  Deployment,
  DeploymentTrigger,
  DeploymentEvent,
  // Module types
  ModuleDefinition,
  ModuleType,
  BuildConfig,
  RuntimeConfig,
  HealthcheckConfig,
  ResourceLimits,
  // Test types
  TestDefinition,
  HttpTestConfig,
  ScriptTestConfig,
} from './types'

// Module type system
export {
  registerModuleType,
  getModuleTypeHandler,
  getRegisteredModuleTypes,
} from './module-types'
export type {
  ModuleTypeHandler,
  ValidationResult,
  BuildResult,
  DeployResult,
} from './module-types'

// Built-in handlers
export { apiResourceHandler } from './handlers/api-resource'

// Deployer
export { Deployer } from './deployer'
export type { DeployerOptions } from './deployer'

// Auto-register built-in handlers
import { registerModuleType } from './module-types'
import { apiResourceHandler } from './handlers/api-resource'

registerModuleType(apiResourceHandler)
