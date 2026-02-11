/**
 * Test-Spec Coverage Tracking
 *
 * Tracks the relationship between test code and spec scenarios,
 * generates coverage reports and manifests.
 */

import type {
  SpecMetadata,
  TestRegistration,
  SpecCoverageStats,
  CoverageManifest,
  ScenarioCoverage,
  TestStatus,
} from './types'

/**
 * Global registry of test-spec mappings
 */
const testRegistry: Map<string, TestRegistration> = new Map()

/**
 * Register a test suite's coverage of a spec scenario
 *
 * Called automatically by `describeSpec()`. Can also be called manually
 * for tracking test-spec relationships outside of vitest.
 *
 * @param metadata - Spec scenario metadata
 * @param testFile - Path to test file (relative to repo root)
 * @param testNames - Individual test names/descriptions
 *
 * @example
 * ```typescript
 * registerCoverage(
 *   {
 *     spec: 'openspec/specs/task-crud/spec.md',
 *     scenario: 'task-crud-001',
 *     requirement: 'Create task',
 *     title: 'User creates minimal task'
 *   },
 *   'src/components/TaskForm.test.tsx',
 *   ['should show form', 'should create task']
 * )
 * ```
 */
export function registerCoverage(
  metadata: SpecMetadata,
  testFile: string,
  testNames: string[] = []
): void {
  const key = `${metadata.spec}::${metadata.scenario}`

  testRegistry.set(key, {
    metadata,
    testFile,
    testNames,
  })
}

/**
 * Get all registered test-spec mappings
 *
 * @returns Map of scenario keys to test registrations
 */
export function getRegistry(): ReadonlyMap<string, TestRegistration> {
  return testRegistry
}

/**
 * Clear the test registry (useful for testing)
 */
export function clearRegistry(): void {
  testRegistry.clear()
}

/**
 * Calculate coverage statistics for a specific spec file
 *
 * @param specPath - Path to spec file
 * @param scenarios - List of scenario IDs in the spec
 * @returns Coverage statistics
 */
export function calculateSpecCoverage(
  specPath: string,
  scenarios: Array<{ id: string; title: string; priority?: string }>
): SpecCoverageStats {
  const scenarioCoverage: ScenarioCoverage[] = scenarios.map((scenario) => {
    const key = `${specPath}::${scenario.id}`
    const registration = testRegistry.get(key)

    const status: TestStatus = registration ? 'covered' : 'uncovered'
    const testFiles = registration
      ? [
          {
            filePath: registration.testFile,
            testNames: registration.testNames,
          },
        ]
      : []

    return {
      scenarioId: scenario.id,
      title: scenario.title,
      priority: (scenario.priority as any) || 'medium',
      status,
      testFiles,
    }
  })

  const totalScenarios = scenarios.length
  const coveredScenarios = scenarioCoverage.filter((s) => s.status === 'covered').length
  const partialScenarios = scenarioCoverage.filter((s) => s.status === 'partial').length
  const uncoveredScenarios = scenarioCoverage.filter((s) => s.status === 'uncovered').length
  const coveragePercent =
    totalScenarios > 0 ? Math.round((coveredScenarios / totalScenarios) * 100) : 0

  return {
    specPath,
    totalScenarios,
    coveredScenarios,
    partialScenarios,
    uncoveredScenarios,
    coveragePercent,
    scenarios: scenarioCoverage,
  }
}

/**
 * Get overall coverage statistics across all registered tests
 *
 * @returns Summary statistics
 */
export function getCoverageStats(): {
  totalScenarios: number
  coveredScenarios: number
  uncoveredScenarios: number
  coveragePercent: number
} {
  const totalScenarios = testRegistry.size
  const coveredScenarios = totalScenarios // All registered scenarios are considered covered
  const uncoveredScenarios = 0

  return {
    totalScenarios,
    coveredScenarios,
    uncoveredScenarios,
    coveragePercent: totalScenarios > 0 ? 100 : 0,
  }
}

/**
 * Generate a coverage manifest for a set of specs
 *
 * @param specs - Map of spec paths to their scenarios
 * @returns Complete coverage manifest
 *
 * @example
 * ```typescript
 * const manifest = generateCoverageManifest({
 *   'openspec/specs/task-crud/spec.md': [
 *     { id: 'task-crud-001', title: 'Create task', priority: 'high' },
 *     { id: 'task-crud-002', title: 'Edit task', priority: 'medium' }
 *   ]
 * })
 * ```
 */
export function generateCoverageManifest(specs: Map<
  string,
  Array<{ id: string; title: string; priority?: string }>
>): CoverageManifest {
  const specStats: SpecCoverageStats[] = []

  for (const [specPath, scenarios] of specs) {
    specStats.push(calculateSpecCoverage(specPath, scenarios))
  }

  const totalSpecs = specStats.length
  const totalScenarios = specStats.reduce((sum, s) => sum + s.totalScenarios, 0)
  const coveredScenarios = specStats.reduce((sum, s) => sum + s.coveredScenarios, 0)
  const partialScenarios = specStats.reduce((sum, s) => sum + s.partialScenarios, 0)
  const uncoveredScenarios = specStats.reduce((sum, s) => sum + s.uncoveredScenarios, 0)
  const coveragePercent =
    totalScenarios > 0 ? Math.round((coveredScenarios / totalScenarios) * 100) : 0

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      totalSpecs,
      totalScenarios,
      coveredScenarios,
      partialScenarios,
      uncoveredScenarios,
      coveragePercent,
    },
    specs: specStats,
  }
}
