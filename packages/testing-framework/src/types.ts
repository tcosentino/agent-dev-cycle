/**
 * Test-Spec Linkage Types
 *
 * Type definitions for connecting test code to OpenSpec scenarios.
 */

/**
 * Priority level for a spec scenario
 */
export type ScenarioPriority = 'critical' | 'high' | 'medium' | 'low'

/**
 * Test coverage status for a scenario
 */
export type TestStatus = 'covered' | 'partial' | 'uncovered'

/**
 * Metadata linking a test suite to a spec scenario
 */
export interface SpecMetadata {
  /**
   * Relative path to the spec file from repository root
   * @example 'openspec/specs/task-management-ui/specs/task-crud/spec.md'
   */
  spec: string

  /**
   * Unique scenario identifier within the spec
   * @example 'task-crud-001'
   */
  scenario: string

  /**
   * Human-readable requirement title
   * @example 'Create new task'
   */
  requirement: string

  /**
   * Specific scenario title
   * @example 'User creates task with minimal fields'
   */
  title: string

  /**
   * Priority level (optional, defaults to 'medium')
   */
  priority?: ScenarioPriority

  /**
   * Test coverage status (optional, auto-detected if not provided)
   */
  status?: TestStatus
}

/**
 * Test registration entry tracked globally
 */
export interface TestRegistration {
  /**
   * Full spec metadata
   */
  metadata: SpecMetadata

  /**
   * Test file path (relative to repository root)
   */
  testFile: string

  /**
   * Individual test names/descriptions within the suite
   */
  testNames: string[]
}

/**
 * Coverage statistics for a spec file
 */
export interface SpecCoverageStats {
  /**
   * Spec file path
   */
  specPath: string

  /**
   * Total number of scenarios in the spec
   */
  totalScenarios: number

  /**
   * Number of scenarios with full test coverage
   */
  coveredScenarios: number

  /**
   * Number of scenarios with partial coverage
   */
  partialScenarios: number

  /**
   * Number of scenarios with no coverage
   */
  uncoveredScenarios: number

  /**
   * Coverage percentage (0-100)
   */
  coveragePercent: number

  /**
   * Detailed scenario coverage information
   */
  scenarios: ScenarioCoverage[]
}

/**
 * Coverage information for a single scenario
 */
export interface ScenarioCoverage {
  /**
   * Scenario ID
   */
  scenarioId: string

  /**
   * Scenario title
   */
  title: string

  /**
   * Priority level
   */
  priority: ScenarioPriority

  /**
   * Coverage status
   */
  status: TestStatus

  /**
   * Test files covering this scenario
   */
  testFiles: TestFileCoverage[]
}

/**
 * Test file coverage for a scenario
 */
export interface TestFileCoverage {
  /**
   * Test file path (relative to repository root)
   */
  filePath: string

  /**
   * Individual test names in this file
   */
  testNames: string[]
}

/**
 * Complete coverage manifest for a spec or set of specs
 */
export interface CoverageManifest {
  /**
   * Generation timestamp
   */
  generatedAt: string

  /**
   * Overall statistics
   */
  summary: {
    totalSpecs: number
    totalScenarios: number
    coveredScenarios: number
    partialScenarios: number
    uncoveredScenarios: number
    coveragePercent: number
  }

  /**
   * Per-spec coverage details
   */
  specs: SpecCoverageStats[]
}
