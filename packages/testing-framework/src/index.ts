/**
 * @agentforge/testing-framework
 *
 * Test-Spec Linkage System for AgentForge
 *
 * Provides tools for connecting test code to OpenSpec scenarios,
 * enabling traceability, coverage visualization, and AI-friendly patterns.
 *
 * @example
 * ```typescript
 * import { describeSpec } from '@agentforge/testing-framework'
 *
 * describeSpec({
 *   spec: 'openspec/specs/task-crud/spec.md',
 *   scenario: 'task-crud-001',
 *   requirement: 'Create task',
 *   title: 'User creates minimal task',
 *   priority: 'high'
 * }, () => {
 *   it('should show task form', () => { ... })
 *   it('should save task', () => { ... })
 * })
 * ```
 */

// Core API
export { describeSpec } from './describeSpec'

// Coverage tracking
export {
  registerCoverage,
  getRegistry,
  clearRegistry,
  calculateSpecCoverage,
  getCoverageStats,
  generateCoverageManifest,
} from './coverage'

// Types
export type {
  SpecMetadata,
  ScenarioPriority,
  TestStatus,
  TestRegistration,
  SpecCoverageStats,
  ScenarioCoverage,
  TestFileCoverage,
  CoverageManifest,
} from './types'
