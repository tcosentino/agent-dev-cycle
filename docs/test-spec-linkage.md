# Test-Spec Linkage System

> **Making specs executable** - A machine-readable connection between OpenSpec scenarios and test code.

## Table of Contents

- [Overview](#overview)
- [Why This Matters](#why-this-matters)
- [Quick Start](#quick-start)
- [Writing Specs with Scenario IDs](#writing-specs-with-scenario-ids)
- [Writing Tests with describeSpec](#writing-tests-with-describespec)
- [Generating Coverage Reports](#generating-coverage-reports)
- [Coverage Manifest Structure](#coverage-manifest-structure)
- [Best Practices](#best-practices)
- [AI Agent Integration](#ai-agent-integration)
- [Future: UI Visualization](#future-ui-visualization)
- [Troubleshooting](#troubleshooting)

## Overview

The Test-Spec Linkage System connects three layers:

```
OpenSpec Scenarios     →     Test Code          →     Coverage Reports
(WHEN/THEN requirements)     (describeSpec)           (coverage.json)
```

**What it does:**
- ✅ Links test code to spec scenarios via IDs
- 📊 Generates coverage manifests showing which scenarios have tests
- 🔍 Enables traceability: requirements → specs → tests → code
- 🤖 Provides clear patterns for AI agents to generate tests

**What it doesn't do:**
- ❌ Code coverage (use `vitest --coverage` for that)
- ❌ Mutation testing
- ❌ Performance testing

## Why This Matters

### For Developers
**Before:**
```typescript
describe('TaskForm', () => {
  it('should show form', () => { ... })
})
// ❓ Which spec does this test?
// ❓ Are all spec scenarios tested?
```

**After:**
```typescript
describeSpec({
  spec: 'openspec/specs/task-crud/spec.md',
  scenario: 'task-crud-001',
  requirement: 'Create task',
  title: 'User creates task with minimal fields',
  priority: 'high'
}, () => {
  it('should show form', () => { ... })
})
// ✅ Clear linkage to spec scenario
// ✅ Tracked in coverage reports
```

### For AI Agents
**Pattern Recognition:**
```
1. Read spec → Extract scenario IDs
2. For each scenario → Generate describeSpec() wrapper
3. For each WHEN/THEN → Generate it() test
4. Verify coverage → Update test status in spec
```

### For Project Management
- 📊 Track requirement coverage: "80% of critical scenarios tested"
- ⚠️ Identify gaps: "12 high-priority scenarios need tests"
- 📈 Measure progress: "Coverage increased from 60% to 75% this sprint"

## Quick Start

### 1. Install the Package

Already in workspace! No installation needed.

```bash
cd ~/repos/agent-dev-cycle
yarn install  # Installs @agentforge/testing-framework
```

### 2. Write a Spec with Scenario IDs

```markdown
## openspec/specs/my-feature/spec.md

#### Scenario: User creates widget
**ID:** `widget-001`
**Priority:** high
**Test Status:** ❌ uncovered

- **WHEN** user clicks "New Widget" button
- **THEN** widget form appears
- **WHEN** user enters name "My Widget"
- **AND** clicks "Create"
- **THEN** widget is created
- **AND** appears in widget list

**Test Coverage:**
- None yet
```

### 3. Write Tests with describeSpec

```typescript
// src/components/WidgetForm.test.tsx
import { describeSpec } from '@agentforge/testing-framework'
import { render, screen } from '@testing-library/react'
import { WidgetForm } from './WidgetForm'

describeSpec({
  spec: 'openspec/specs/my-feature/spec.md',
  scenario: 'widget-001',
  requirement: 'User creates widget',
  title: 'User creates widget',
  priority: 'high'
}, () => {
  it('should show form when clicking New Widget', async () => {
    render(<WidgetForm />)
    expect(screen.getByText('New Widget')).toBeInTheDocument()
  })

  it('should create widget with entered name', async () => {
    // Test implementation
  })
})
```

### 4. Generate Coverage Report

```bash
yarn coverage:spec
```

Output:
```
============================================================
📊 Test-Spec Coverage Summary
============================================================
Total Specs:       1
Total Scenarios:   1
✅ Covered:        1
❌ Uncovered:      0
📈 Coverage:       100%
============================================================
```

## Writing Specs with Scenario IDs

### Scenario ID Format

**Pattern:** `{feature-slug}-{number}`

**Examples:**
```
widget-001
widget-002
user-auth-001
payment-processing-042
```

**Rules:**
- Lowercase with dashes
- Number should be zero-padded (001, 002, ...)
- Unique within a spec file
- Sequential numbering recommended

### Complete Scenario Template

```markdown
#### Scenario: {Human-readable title}
**ID:** `{feature}-{number}`
**Priority:** {critical|high|medium|low}
**Test Status:** {✅ covered | ⏳ partial | ❌ uncovered}

- **WHEN** {condition or action}
- **THEN** {expected outcome}
- **WHEN** {next action}
- **THEN** {next outcome}

**Test Coverage:**
- `{relative/path/to/test.tsx}` → "{test name}"
- `{another/test.tsx}` → "{another test name}"
```

### Priority Levels

- **`critical`** - Must always work, system-breaking if fails
  - Example: User authentication, data integrity
- **`high`** - Important features, user-facing functionality
  - Example: Task creation, search
- **`medium`** - Standard features, nice-to-have
  - Example: Sorting options, advanced filters
- **`low`** - Edge cases, future enhancements
  - Example: Keyboard shortcuts, legacy data migration

### Test Status

- ✅ **`covered`** - Full test coverage for all WHEN/THEN steps
- ⏳ **`partial`** - Some steps tested, others missing
- ❌ **`uncovered`** - No tests yet

## Writing Tests with describeSpec

### Basic Usage

```typescript
import { describeSpec } from '@agentforge/testing-framework'

describeSpec({
  spec: 'openspec/specs/task-crud/spec.md',
  scenario: 'task-crud-001',
  requirement: 'Create new task',
  title: 'User creates task with minimal fields',
  priority: 'high'
}, () => {
  // Regular vitest tests
  it('should do something', () => {
    expect(true).toBe(true)
  })
})
```

### Using Variants

```typescript
// Skip this suite
describeSpec.skip({ ... }, () => { ... })

// Run only this suite
describeSpec.only({ ... }, () => { ... })

// Mark as TODO
describeSpec.todo({ ... })
```

### Multiple Scenarios Per File

```typescript
// TaskForm.test.tsx
describeSpec({ scenario: 'task-crud-001', ... }, () => {
  it('should show form', () => { ... })
})

describeSpec({ scenario: 'task-crud-002', ... }, () => {
  it('should validate input', () => { ... })
})

describeSpec({ scenario: 'task-crud-003', ... }, () => {
  it('should save task', () => { ... })
})
```

### Integrating with Existing Tests

**Non-breaking:** describeSpec works alongside regular `describe()`:

```typescript
// Old tests (keep working)
describe('WidgetList', () => {
  it('should render', () => { ... })
})

// New tests (with linkage)
describeSpec({ scenario: 'widget-005', ... }, () => {
  it('should filter by status', () => { ... })
})
```

## Generating Coverage Reports

### Run Coverage Script

```bash
yarn coverage:spec
```

### Output

**Console Summary:**
```
🔍 Scanning OpenSpec files...

✅ Coverage manifest written to openspec/changes/task-management-ui/coverage.json

============================================================
📊 Test-Spec Coverage Summary
============================================================
Total Specs:       3
Total Scenarios:   69
✅ Covered:        5
⏳ Partial:        0
❌ Uncovered:      64
📈 Coverage:       7%
============================================================

📋 Per-Spec Coverage:
  task-crud          [████░░░░░░░░░░░░░░░░] 19% (5/26)
  task-board         [░░░░░░░░░░░░░░░░░░░░] 0% (0/25)
  auto-key           [░░░░░░░░░░░░░░░░░░░░] 0% (0/18)

❌ Uncovered Scenarios (need tests):
  ⚠️ [task-crud] task-crud-003: Validation prevents empty title
  ⚠️ [task-crud] task-crud-008: User deletes task
     [task-crud] task-crud-010: Tasks displayed with key information
  ... and 61 more
```

**Generated File:** `openspec/changes/task-management-ui/coverage.json`

### Coverage Thresholds

By default, warns if coverage < 50%, but doesn't fail:

```bash
⚠️  Coverage 7% is below threshold 50%
   Consider adding more tests with describeSpec()
```

To enforce in CI (future):
```json
// package.json
{
  "scripts": {
    "coverage:spec": "tsx scripts/generate-spec-coverage.ts --strict"
  }
}
```

## Coverage Manifest Structure

### Example coverage.json

```json
{
  "generatedAt": "2026-02-11T08:30:00.000Z",
  "summary": {
    "totalSpecs": 3,
    "totalScenarios": 69,
    "coveredScenarios": 5,
    "partialScenarios": 0,
    "uncoveredScenarios": 64,
    "coveragePercent": 7
  },
  "specs": [
    {
      "specPath": "openspec/changes/task-management-ui/specs/task-crud/spec.md",
      "totalScenarios": 26,
      "coveredScenarios": 5,
      "partialScenarios": 0,
      "uncoveredScenarios": 21,
      "coveragePercent": 19,
      "scenarios": [
        {
          "scenarioId": "task-crud-001",
          "title": "User creates task with minimal fields",
          "priority": "high",
          "status": "covered",
          "testFiles": [
            {
              "filePath": "src/services/agentforge-ui/components/TasksPage/TasksPage.test.tsx",
              "testNames": [
                "should show task board and detail panel with same status initially"
              ]
            }
          ]
        },
        {
          "scenarioId": "task-crud-002",
          "title": "User creates task with all fields",
          "priority": "medium",
          "status": "uncovered",
          "testFiles": []
        }
      ]
    }
  ]
}
```

### Using Coverage Data

**In CI/CD:**
```yaml
# .github/workflows/test.yml
- name: Generate spec coverage
  run: yarn coverage:spec

- name: Upload coverage artifact
  uses: actions/upload-artifact@v3
  with:
    name: spec-coverage
    path: openspec/**/coverage.json
```

**In Scripts:**
```typescript
import { readFileSync } from 'fs'

const coverage = JSON.parse(
  readFileSync('openspec/changes/task-management-ui/coverage.json', 'utf-8')
)

console.log(`Coverage: ${coverage.summary.coveragePercent}%`)

// Find critical uncovered scenarios
const critical = coverage.specs
  .flatMap(s => s.scenarios)
  .filter(s => s.priority === 'critical' && s.status === 'uncovered')

console.log(`🚨 ${critical.length} critical scenarios need tests!`)
```

## Best Practices

### 1. One Scenario Per describeSpec

✅ **Good:**
```typescript
describeSpec({ scenario: 'task-001', ... }, () => {
  it('test 1', () => {})
  it('test 2', () => {})
})

describeSpec({ scenario: 'task-002', ... }, () => {
  it('test 3', () => {})
})
```

❌ **Bad:**
```typescript
describeSpec({ scenario: 'task-001', ... }, () => {
  it('tests scenario 001', () => {})
  it('tests scenario 002', () => {})  // Wrong scenario!
})
```

### 2. Match Test Names to Spec Steps

**Spec:**
```markdown
- **WHEN** user clicks "New Task"
- **THEN** form appears
```

**Test:**
```typescript
it('should show form when clicking New Task', () => {
  // Clear mapping to WHEN/THEN
})
```

### 3. Keep Scenario IDs Sequential

```markdown
task-crud-001  ✅
task-crud-002  ✅
task-crud-003  ✅

task-crud-042  ❌ (gap)
task-crud-001a ❌ (non-numeric)
```

### 4. Use Priority Levels Wisely

- **critical:** < 5% of scenarios (must never fail)
- **high:** ~20% (important features)
- **medium:** ~50% (standard features)
- **low:** ~25% (nice-to-have, edge cases)

### 5. Update Test Status as You Go

```markdown
**Test Status:** ❌ uncovered
```
↓ (after writing tests)
```markdown
**Test Status:** ✅ covered

**Test Coverage:**
- `TaskForm.test.tsx` → "should show form"
- `TaskForm.test.tsx` → "should create task"
```

## AI Agent Integration

### Pattern for Test Generation

**Step 1:** Parse spec file
```typescript
const scenarios = parseSpecFile('task-crud/spec.md')
// Returns: [{ id: 'task-crud-001', title: '...', whenSteps: [...], thenSteps: [...] }]
```

**Step 2:** Generate test stub
```typescript
for (const scenario of scenarios) {
  generateTest({
    spec: 'openspec/specs/task-crud/spec.md',
    scenario: scenario.id,
    requirement: scenario.requirement,
    title: scenario.title,
    priority: scenario.priority,
    steps: scenario.whenSteps.concat(scenario.thenSteps)
  })
}
```

**Step 3:** Output test code
```typescript
describeSpec({
  spec: 'openspec/specs/task-crud/spec.md',
  scenario: 'task-crud-001',
  requirement: 'Create new task',
  title: 'User creates task with minimal fields',
  priority: 'high'
}, () => {
  // TODO: Implement tests based on WHEN/THEN steps
  it('should show form when clicking New Task button', () => {
    // WHEN user clicks "New Task" button
    // THEN task creation form appears
  })
})
```

### Agent Workflow

```
1. Agent reads spec file
   ↓
2. Identifies scenarios without tests (status: uncovered)
   ↓
3. Prioritizes by priority level (critical → high → medium → low)
   ↓
4. Generates describeSpec() wrapper with metadata
   ↓
5. Generates it() tests for each WHEN/THEN step
   ↓
6. Writes test file
   ↓
7. Runs tests to verify
   ↓
8. Updates spec with test status and coverage references
```

## Future: UI Visualization

**Planned Features:**

1. **Spec File Viewer with Coverage Badges**
   ```
   📄 task-crud/spec.md              [████████████░░░░] 60%
   └── task-crud-001 ✅ covered
   └── task-crud-002 ❌ uncovered
   └── task-crud-003 ✅ covered
   ```

2. **Scenario Drill-Down**
   - Click scenario → See test files
   - Click test file → Jump to code
   - Visual diff: spec WHEN/THEN vs test assertions

3. **Coverage Dashboard**
   - Overall coverage trend chart
   - Per-feature breakdown
   - Critical scenario status
   - Coverage goals and progress

4. **Interactive Test Generation**
   - Select uncovered scenario
   - Click "Generate Test Stub"
   - AI generates describeSpec + it() blocks
   - Developer fills in implementation

## Troubleshooting

### "describeSpec is not defined"

**Problem:** Package not installed or imported

**Solution:**
```typescript
import { describeSpec } from '@agentforge/testing-framework'
```

If still not working:
```bash
cd ~/repos/agent-dev-cycle
yarn install
```

### "Coverage shows 0% but I have tests"

**Problem:** Tests using `describe()` instead of `describeSpec()`

**Solution:** Retrofit tests:
```typescript
// Before
describe('TaskForm', () => { ... })

// After
describeSpec({ scenario: 'task-crud-001', ... }, () => { ... })
```

### "Scenario ID not found in coverage report"

**Problem:** Typo or mismatch between spec and test

**Solution:** Check IDs match exactly:
```markdown
**ID:** `task-crud-001`  <!-- In spec -->
```
```typescript
scenario: 'task-crud-001'  // In test (must match!)
```

### "Coverage script fails to parse spec"

**Problem:** Malformed spec markdown

**Solution:** Ensure format:
```markdown
#### Scenario: Title here
**ID:** `scenario-001`
**Priority:** high
**Test Status:** ❌ uncovered
```

Note the exact spacing and backticks around ID.

---

**Questions or feedback?** Open an issue or discussion in the AgentForge repo.

**Next Steps:**
- Read the [example implementation](../examples/test-spec-example/)
- Explore the [architecture design](../openspec/changes/test-spec-linkage/design.md)
- Review [best practices](../openspec/changes/test-spec-linkage/specs/)
