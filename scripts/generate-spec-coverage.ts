#!/usr/bin/env tsx
/**
 * Generate Test-Spec Coverage Manifest
 *
 * Scans OpenSpec files for scenarios, matches them with test code using describeSpec,
 * and generates coverage.json manifests showing which scenarios have tests.
 *
 * Usage:
 *   tsx scripts/generate-spec-coverage.ts
 *   yarn coverage:spec
 */

import * as fs from 'fs'
import * as path from 'path'
import { generateCoverageManifest } from '../packages/testing-framework/src/coverage'
import type { CoverageManifest } from '../packages/testing-framework/src/types'

interface Scenario {
  id: string
  title: string
  priority: string
}

interface SpecFile {
  path: string
  scenarios: Scenario[]
}

/**
 * Parse a spec markdown file and extract scenario metadata
 */
function parseSpecFile(filePath: string): SpecFile {
  const content = fs.readFileSync(filePath, 'utf-8')
  const scenarios: Scenario[] = []

  // Match scenario blocks with ID, priority, and title
  const scenarioRegex = /####\s+Scenario:\s+(.+?)\n\*\*ID:\*\*\s+`(.+?)`\s*\n\*\*Priority:\*\*\s+(\w+)/gs

  let match
  while ((match = scenarioRegex.exec(content)) !== null) {
    const [, title, id, priority] = match
    scenarios.push({
      id: id.trim(),
      title: title.trim(),
      priority: priority.trim(),
    })
  }

  return {
    path: filePath,
    scenarios,
  }
}

/**
 * Find all spec.md files in the openspec directory
 */
function findSpecFiles(dir: string): string[] {
  const specFiles: string[] = []

  function walk(currentDir: string) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name)

      if (entry.isDirectory()) {
        walk(fullPath)
      } else if (entry.isFile() && entry.name === 'spec.md') {
        specFiles.push(fullPath)
      }
    }
  }

  walk(dir)
  return specFiles
}

/**
 * Generate coverage manifest for a spec directory
 */
function generateCoverageForSpec(specDir: string): CoverageManifest | null {
  const specFiles = findSpecFiles(specDir)

  if (specFiles.length === 0) {
    console.log(`⚠️  No spec files found in ${specDir}`)
    return null
  }

  const specsMap = new Map<string, Array<{ id: string; title: string; priority?: string }>>()

  for (const specFilePath of specFiles) {
    const specFile = parseSpecFile(specFilePath)
    // Convert to relative path from repo root
    const relativePath = path.relative(process.cwd(), specFilePath)
    specsMap.set(relativePath, specFile.scenarios)
  }

  return generateCoverageManifest(specsMap)
}

/**
 * Write coverage manifest to a JSON file
 */
function writeCoverageManifest(manifest: CoverageManifest, outputPath: string): void {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2))
  console.log(`✅ Coverage manifest written to ${outputPath}`)
}

/**
 * Print coverage summary to console
 */
function printCoverageSummary(manifest: CoverageManifest): void {
  const { summary } = manifest

  console.log('\n' + '='.repeat(60))
  console.log('📊 Test-Spec Coverage Summary')
  console.log('='.repeat(60))
  console.log(`Total Specs:       ${summary.totalSpecs}`)
  console.log(`Total Scenarios:   ${summary.totalScenarios}`)
  console.log(`✅ Covered:        ${summary.coveredScenarios}`)
  console.log(`⏳ Partial:        ${summary.partialScenarios}`)
  console.log(`❌ Uncovered:      ${summary.uncoveredScenarios}`)
  console.log(`📈 Coverage:       ${summary.coveragePercent}%`)
  console.log('='.repeat(60))

  // Show per-spec breakdown
  console.log('\n📋 Per-Spec Coverage:')
  for (const spec of manifest.specs) {
    const specName = path.basename(path.dirname(spec.specPath))
    const bar = generateProgressBar(spec.coveragePercent)
    console.log(
      `  ${specName.padEnd(30)} ${bar} ${spec.coveragePercent}% (${spec.coveredScenarios}/${spec.totalScenarios})`
    )
  }

  // Show uncovered scenarios
  const uncoveredScenarios = manifest.specs.flatMap((spec) =>
    spec.scenarios
      .filter((s) => s.status === 'uncovered')
      .map((s) => ({ spec: path.basename(path.dirname(spec.specPath)), ...s }))
  )

  if (uncoveredScenarios.length > 0) {
    console.log('\n❌ Uncovered Scenarios (need tests):')
    uncoveredScenarios.slice(0, 10).forEach((s) => {
      const priority = s.priority === 'critical' || s.priority === 'high' ? '⚠️' : '  '
      console.log(`  ${priority} [${s.spec}] ${s.scenarioId}: ${s.title}`)
    })
    if (uncoveredScenarios.length > 10) {
      console.log(`  ... and ${uncoveredScenarios.length - 10} more`)
    }
  }

  console.log('')
}

/**
 * Generate a simple ASCII progress bar
 */
function generateProgressBar(percent: number, width: number = 20): string {
  const filled = Math.round((percent / 100) * width)
  const empty = width - filled
  return '[' + '█'.repeat(filled) + '░'.repeat(empty) + ']'
}

/**
 * Main execution
 */
async function main() {
  console.log('🔍 Scanning OpenSpec files...\n')

  // Generate coverage for task-management-ui specs
  const taskManagementSpecDir = path.join(
    process.cwd(),
    'openspec/changes/task-management-ui/specs'
  )

  if (!fs.existsSync(taskManagementSpecDir)) {
    console.error(`❌ Spec directory not found: ${taskManagementSpecDir}`)
    process.exit(1)
  }

  const manifest = generateCoverageForSpec(taskManagementSpecDir)

  if (!manifest) {
    console.error('❌ Failed to generate coverage manifest')
    process.exit(1)
  }

  // Write manifest to output file
  const outputPath = path.join(
    process.cwd(),
    'openspec/changes/task-management-ui/coverage.json'
  )
  writeCoverageManifest(manifest, outputPath)

  // Print summary
  printCoverageSummary(manifest)

  // Exit with error if coverage is below threshold
  const threshold = 50 // 50% coverage required
  if (manifest.summary.coveragePercent < threshold) {
    console.log(`⚠️  Coverage ${manifest.summary.coveragePercent}% is below threshold ${threshold}%`)
    console.log('   Consider adding more tests with describeSpec()')
    // Don't fail in CI for now - this is informational
    // process.exit(1)
  }

  console.log('✅ Coverage generation complete!\n')
}

// Run the script
main().catch((error) => {
  console.error('❌ Error generating coverage:', error)
  process.exit(1)
})
