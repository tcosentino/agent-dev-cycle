# @agentforge/testing-framework

**Test-Spec Linkage System** - Connect your test code to OpenSpec scenarios for complete traceability.

## Why This Exists

In AgentForge, we believe that **specs should be executable**. This package creates a machine-readable connection between:

- **OpenSpec scenarios** (WHEN/THEN requirements)
- **Test code** (vitest assertions)
- **Coverage reports** (what's tested, what's not)

This enables:
- ✅ **Traceability** - Track requirements → specs → tests → code
- 📊 **Visualization** - Show coverage in the UI
- 🤖 **AI-friendly** - Teach agents how to generate tests from specs
- 🔍 **Accountability** - Know exactly which scenarios have tests

## Installation

```bash
yarn add @agentforge/testing-framework
```

## Quick Start

### 1. Add Scenario IDs to Your Specs

Update your OpenSpec files to include scenario IDs:

```markdown
#### Scenario: User creates task with minimal fields
**ID:** `task-crud-001`
**Priority:** high

- **WHEN** user clicks "New Task" button
- **THEN** task creation form appears
```

### 2. Use `describeSpec` in Your Tests

Replace vitest's `describe` with `describeSpec`:

```typescript
import { describeSpec } from '@agentforge/testing-framework'
import { render, screen } from '@testing-library/react'
import { TaskForm } from './TaskForm'

describeSpec({
  spec: 'openspec/specs/task-management-ui/specs/task-crud/spec.md',
  scenario: 'task-crud-001',
  requirement: 'Create new task',
  title: 'User creates task with minimal fields',
  priority: 'high'
}, () => {
  it('should show form when clicking New Task button', async () => {
    render(<TaskForm />)
    expect(screen.getByText('New Task')).toBeInTheDocument()
  })

  it('should create task with auto-generated key', async () => {
    // Test implementation
  })
})
```

### 3. Generate Coverage Reports

```bash
yarn coverage:spec
```

This generates `coverage.json` showing which spec scenarios have tests.

## API Reference

### `describeSpec(metadata, testFn)`

Wrapper around vitest's `describe` that links tests to spec scenarios.

**Parameters:**
- `metadata: SpecMetadata` - Scenario information
  - `spec: string` - Path to spec file (relative to repo root)
  - `scenario: string` - Unique scenario ID
  - `requirement: string` - Requirement title
  - `title: string` - Scenario title
  - `priority?: 'critical' | 'high' | 'medium' | 'low'`
  - `status?: 'covered' | 'partial' | 'uncovered'`
- `testFn: () => void` - Test suite function (same as vitest's describe)

**Usage:**

```typescript
describeSpec({
  spec: 'openspec/specs/my-feature/spec.md',
  scenario: 'my-feature-001',
  requirement: 'Do something',
  title: 'User does something successfully'
}, () => {
  it('should do the thing', () => { ... })
})
```

**Variants:**

```typescript
describeSpec.skip({ ... }, () => { ... })   // Skip this suite
describeSpec.only({ ... }, () => { ... })   // Run only this suite
describeSpec.todo({ ... })                  // Mark as TODO
```

### `registerCoverage(metadata, testFile, testNames)`

Manually register test-spec coverage (if not using `describeSpec`).

**Parameters:**
- `metadata: SpecMetadata` - Spec scenario metadata
- `testFile: string` - Test file path (relative to repo root)
- `testNames: string[]` - Individual test names

**Usage:**

```typescript
import { registerCoverage } from '@agentforge/testing-framework'

registerCoverage(
  {
    spec: 'openspec/specs/task-crud/spec.md',
    scenario: 'task-crud-001',
    requirement: 'Create task',
    title: 'User creates minimal task'
  },
  'src/components/TaskForm.test.tsx',
  ['should show form', 'should save task']
)
```

### `generateCoverageManifest(specs)`

Generate a complete coverage manifest for a set of specs.

**Parameters:**
- `specs: Map<string, Scenario[]>` - Map of spec paths to scenarios

**Returns:** `CoverageManifest`

**Usage:**

```typescript
import { generateCoverageManifest } from '@agentforge/testing-framework'

const manifest = generateCoverageManifest(new Map([
  ['openspec/specs/task-crud/spec.md', [
    { id: 'task-crud-001', title: 'Create task', priority: 'high' },
    { id: 'task-crud-002', title: 'Edit task', priority: 'medium' }
  ]]
]))

console.log(`Coverage: ${manifest.summary.coveragePercent}%`)
```

### `getCoverageStats()`

Get overall coverage statistics for all registered tests.

**Returns:**

```typescript
{
  totalScenarios: number
  coveredScenarios: number
  uncoveredScenarios: number
  coveragePercent: number
}
```

## Integration with Existing Tests

### Non-Breaking Migration

`describeSpec` is fully compatible with existing vitest tests:

**Before:**
```typescript
describe('TaskForm', () => {
  it('should render', () => { ... })
})
```

**After:**
```typescript
describeSpec({
  spec: 'openspec/specs/task-crud/spec.md',
  scenario: 'task-crud-001',
  requirement: 'Create task',
  title: 'Task form renders'
}, () => {
  it('should render', () => { ... })
})
```

The test logic remains identical. Only the wrapper changes.

### Multiple Scenarios Per Test File

You can link multiple scenarios in one test file:

```typescript
import { describeSpec } from '@agentforge/testing-framework'

describeSpec({ /* scenario 1 */ }, () => {
  it('test 1', () => { ... })
})

describeSpec({ /* scenario 2 */ }, () => {
  it('test 2', () => { ... })
})
```

## Coverage Reports

The coverage manifest (`coverage.json`) structure:

```json
{
  "generatedAt": "2026-02-11T08:00:00.000Z",
  "summary": {
    "totalSpecs": 3,
    "totalScenarios": 15,
    "coveredScenarios": 12,
    "partialScenarios": 1,
    "uncoveredScenarios": 2,
    "coveragePercent": 80
  },
  "specs": [
    {
      "specPath": "openspec/specs/task-crud/spec.md",
      "totalScenarios": 5,
      "coveredScenarios": 4,
      "coveragePercent": 80,
      "scenarios": [
        {
          "scenarioId": "task-crud-001",
          "title": "User creates task",
          "priority": "high",
          "status": "covered",
          "testFiles": [
            {
              "filePath": "src/components/TaskForm.test.tsx",
              "testNames": ["should show form", "should create task"]
            }
          ]
        }
      ]
    }
  ]
}
```

## Best Practices

### 1. One Scenario Per Test Suite

Map each `describeSpec` to a single spec scenario:

```typescript
// ✅ Good: One describeSpec per scenario
describeSpec({ scenario: 'task-crud-001', ... }, () => {
  it('test 1', () => { ... })
  it('test 2', () => { ... })
})

describeSpec({ scenario: 'task-crud-002', ... }, () => {
  it('test 3', () => { ... })
})

// ❌ Bad: Multiple scenarios in one describeSpec
describeSpec({ scenario: 'task-crud-001', ... }, () => {
  it('tests both scenarios', () => { ... })
})
```

### 2. Match Spec WHEN/THEN to Test Descriptions

Keep test names aligned with spec scenarios:

**Spec:**
```markdown
#### Scenario: User creates task
- **WHEN** user clicks "New Task" button
- **THEN** form appears
```

**Test:**
```typescript
describeSpec({ scenario: 'task-crud-001', ... }, () => {
  it('should show form when clicking New Task button', () => { ... })
})
```

### 3. Use Consistent Scenario IDs

Follow a naming convention:
- Format: `<feature>-<number>`
- Example: `task-crud-001`, `task-crud-002`
- Sequential numbering within each spec

### 4. Set Priority Levels

Mark critical scenarios:

```typescript
describeSpec({
  scenario: 'auth-001',
  priority: 'critical',  // ⚠️ Must always work
  ...
}, () => { ... })
```

## Future Enhancements

- [ ] **UI Visualization** - Show coverage in AgentForge UI
- [ ] **AI Test Generation** - Generate test stubs from specs
- [ ] **Live Coverage** - Update coverage in real-time during test runs
- [ ] **Playwright Integration** - Support for E2E tests
- [ ] **Spec Validation** - Ensure all scenarios have IDs

## TypeScript Support

Fully typed with strict mode enabled. Exports all types:

```typescript
import type {
  SpecMetadata,
  TestStatus,
  ScenarioPriority,
  CoverageManifest
} from '@agentforge/testing-framework'
```

## Contributing

See the [main AgentForge repository](../../README.md) for contribution guidelines.

## License

MIT
