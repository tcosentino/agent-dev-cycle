/**
 * Test-Spec Linkage: describeSpec
 *
 * A wrapper around vitest's `describe` that links test suites to OpenSpec scenarios.
 * Automatically registers coverage metadata for tracking and reporting.
 */

import { describe } from 'vitest'
import { registerCoverage } from './coverage'
import type { SpecMetadata } from './types'

/**
 * Describe a test suite that covers a specific spec scenario
 *
 * Works exactly like vitest's `describe()`, but also:
 * - Links the test suite to an OpenSpec scenario
 * - Registers coverage metadata for reporting
 * - Enables traceability from requirements → specs → tests
 *
 * @param metadata - Spec scenario metadata
 * @param testFn - Test suite function (same as vitest's describe)
 *
 * @example
 * ```typescript
 * import { describeSpec } from '@agentforge/testing-framework'
 *
 * describeSpec({
 *   spec: 'openspec/specs/task-management-ui/specs/task-crud/spec.md',
 *   scenario: 'task-crud-001',
 *   requirement: 'Create new task',
 *   title: 'User creates task with minimal fields',
 *   priority: 'high'
 * }, () => {
 *   it('should show form when clicking New Task button', async () => {
 *     // Test implementation
 *   })
 *
 *   it('should create task with auto-generated key', async () => {
 *     // Test implementation
 *   })
 * })
 * ```
 */
export function describeSpec(metadata: SpecMetadata, testFn: () => void): void {
  // Create a descriptive title for the test suite
  const suiteTitle = `[${metadata.scenario}] ${metadata.title}`

  // Register coverage immediately with the metadata
  // The test file path will be resolved by the coverage generation script
  const testFile = inferTestFilePath()
  
  // We'll collect test names during execution by wrapping the function
  const testNames: string[] = []
  
  // Call vitest's describe with enhanced title
  describe(suiteTitle, () => {
    // Execute the test function
    testFn()
    
    // Register coverage after suite is defined
    // Note: Test names will be resolved by the coverage script from the actual test file
    registerCoverage(metadata, testFile, testNames)
  })
}

/**
 * Infer the test file path from the current execution context
 *
 * Uses stack trace analysis to find the calling test file.
 * The coverage generation script will resolve the final paths during manifest generation.
 *
 * @returns Test file path (relative to repository root)
 */
function inferTestFilePath(): string {
  // Parse stack trace to find test file
  const stack = new Error().stack
  if (stack) {
    const lines = stack.split('\n')
    for (const line of lines) {
      // Look for .test.ts or .test.tsx files in the stack
      const match = line.match(/\((.*\.test\.tsx?):/)
      if (match) {
        let filepath = match[1]
        // Convert to relative path if it's absolute
        const repoRoot = process.cwd()
        if (filepath.startsWith(repoRoot)) {
          filepath = filepath.replace(repoRoot + '/', '')
        }
        return filepath
      }
    }
  }

  // Fallback: return placeholder
  // The coverage script will resolve this by analyzing imports
  return 'unknown-test-file.test.tsx'
}

/**
 * Re-export vitest's describe.skip, describe.only, etc. for convenience
 */
describeSpec.skip = (metadata: SpecMetadata, testFn: () => void) => {
  const suiteTitle = `[${metadata.scenario}] ${metadata.title}`
  describe.skip(suiteTitle, testFn)
}

describeSpec.only = (metadata: SpecMetadata, testFn: () => void) => {
  const suiteTitle = `[${metadata.scenario}] ${metadata.title}`
  describe.only(suiteTitle, testFn)
}

describeSpec.todo = (metadata: SpecMetadata) => {
  const suiteTitle = `[${metadata.scenario}] ${metadata.title}`
  describe.todo(suiteTitle)
}
