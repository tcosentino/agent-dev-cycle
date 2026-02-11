# Design: Test-Spec Linkage System

## Architecture Overview

The Test-Spec Linkage System consists of three main components:

```
┌─────────────────────────────────────────────────────┐
│              OpenSpec Scenarios                      │
│  (Markdown files with scenario IDs)                 │
└───────────────┬─────────────────────────────────────┘
                │
                │ Referenced by
                ▼
┌─────────────────────────────────────────────────────┐
│          @agentforge/testing-framework               │
│  • describeSpec() - Links tests to scenarios        │
│  • Coverage registry - Tracks mappings              │
│  • Types - Metadata interfaces                      │
└───────────────┬─────────────────────────────────────┘
                │
                │ Generates
                ▼
┌─────────────────────────────────────────────────────┐
│           Coverage Manifests (JSON)                  │
│  • Per-spec coverage stats                          │
│  • Scenario → test mappings                         │
│  • Coverage percentages                             │
└─────────────────────────────────────────────────────┘
```

## Component Design

### 1. Scenario ID Format

**Format:** `{feature}-{number}`

**Examples:**
- `task-crud-001`
- `task-crud-002`
- `auto-key-001`

**Rules:**
- Feature slug is lowercase, dash-separated
- Number is zero-padded to 3 digits
- IDs are unique within a spec file
- Sequential numbering recommended but not enforced

### 2. Spec Enhancement Schema

```markdown
#### Scenario: {Human-readable title}
**ID:** `{scenario-id}`
**Priority:** {critical|high|medium|low}
**Test Status:** {✅ covered | ⏳ partial | ❌ uncovered}

- **WHEN** {condition}
- **THEN** {expected outcome}

**Test Coverage:**
- `{test-file-path}` → "{test name}"
```

**Priority Levels:**
- `critical` - Must always work, system-breaking if fails
- `high` - Important features, user-facing functionality
- `medium` - Standard features, nice-to-have
- `low` - Edge cases, future enhancements

**Test Status:**
- ✅ `covered` - Full test coverage for all WHEN/THEN steps
- ⏳ `partial` - Some steps tested, others missing
- ❌ `uncovered` - No tests yet

### 3. describeSpec() Implementation

**Signature:**
```typescript
function describeSpec(
  metadata: SpecMetadata,
  testFn: () => void
): void
```

**Behavior:**
1. Wraps vitest's `describe()` with enhanced title: `[scenario-id] Title`
2. Registers metadata in global coverage registry
3. Executes test function normally
4. Returns void (transparent wrapper)

**Design Decision: Why Wrapper Over Annotation?**

✅ **Chosen: Function Wrapper**
```typescript
describeSpec({ spec, scenario, ... }, () => {
  it('test', () => {})
})
```

❌ **Rejected: Comment Annotation**
```typescript
// @spec task-crud-001
describe('TaskForm', () => {})
```

**Rationale:**
- Type-safe metadata
- Easier to parse and validate
- First-class API, not magic comments
- Better IDE support and autocomplete
- Refactoring-friendly

### 4. Coverage Registry

**Global State:**
```typescript
const testRegistry: Map<string, TestRegistration> = new Map()
```

**Key Format:** `{spec-path}::{scenario-id}`

**Example:**
```
"openspec/specs/task-crud/spec.md::task-crud-001" → {
  metadata: { spec, scenario, requirement, title, priority },
  testFile: "src/components/TaskForm.test.tsx",
  testNames: ["should show form", "should create task"]
}
```

**Lifetime:**
- Populated during test execution (in-memory)
- OR pre-populated by coverage script (static analysis)
- Cleared between test runs

### 5. Coverage Manifest Schema

```typescript
interface CoverageManifest {
  generatedAt: string              // ISO timestamp
  summary: {
    totalSpecs: number
    totalScenarios: number
    coveredScenarios: number
    partialScenarios: number
    uncoveredScenarios: number
    coveragePercent: number        // 0-100
  }
  specs: SpecCoverageStats[]
}

interface SpecCoverageStats {
  specPath: string                 // Relative to repo root
  totalScenarios: number
  coveredScenarios: number
  partialScenarios: number
  uncoveredScenarios: number
  coveragePercent: number
  scenarios: ScenarioCoverage[]
}

interface ScenarioCoverage {
  scenarioId: string
  title: string
  priority: ScenarioPriority
  status: TestStatus
  testFiles: TestFileCoverage[]
}

interface TestFileCoverage {
  filePath: string                 // Relative to repo root
  testNames: string[]              // Individual test descriptions
}
```

### 6. Coverage Generation Algorithm

**Input:** Spec directory (e.g., `openspec/specs/task-management-ui/`)

**Process:**
1. **Scan** - Find all `spec.md` files
2. **Parse** - Extract scenario IDs, titles, priorities using regex
3. **Match** - Look up each scenario in test registry
4. **Calculate** - Compute coverage percentages
5. **Generate** - Create JSON manifest
6. **Write** - Save to `coverage.json` in spec directory
7. **Report** - Print summary to console

**Regex Pattern:**
```regex
/####\s+Scenario:\s+(.+?)\n\*\*ID:\*\*\s+`(.+?)`\s*\n\*\*Priority:\*\*\s+(\w+)/gs
```

Captures:
1. Scenario title
2. Scenario ID
3. Priority level

## Data Flow

### Test Execution Flow

```
1. Test runner starts
   ↓
2. Test file imports describeSpec
   ↓
3. describeSpec() called with metadata
   ↓
4. Metadata registered in global registry
   ↓
5. vitest describe() executed
   ↓
6. Individual tests run (it/test)
   ↓
7. Registry contains all test-spec mappings
```

### Coverage Generation Flow

```
1. User runs `yarn coverage:spec`
   ↓
2. Script scans openspec/ directory
   ↓
3. Parses all spec.md files
   ↓
4. Extracts scenario metadata
   ↓
5. Matches with test registry (or spec annotations)
   ↓
6. Calculates coverage statistics
   ↓
7. Generates coverage.json manifests
   ↓
8. Prints summary report
```

## File Organization

```
packages/testing-framework/
├── src/
│   ├── index.ts           # Public API exports
│   ├── describeSpec.ts    # Main wrapper function
│   ├── coverage.ts        # Registry & manifest generation
│   └── types.ts           # TypeScript interfaces
├── package.json
├── tsconfig.json
└── README.md

scripts/
└── generate-spec-coverage.ts   # CLI tool for coverage reports

openspec/changes/{feature}/
├── proposal.md
├── design.md
├── tasks.md
├── coverage.json          # Generated manifest
└── specs/
    └── {spec-name}/
        └── spec.md        # Enhanced with scenario IDs
```

## Extension Points

### Future: Partial Coverage Detection

Currently: Binary covered/uncovered

Future: Track which WHEN/THEN steps are tested

```typescript
interface ScenarioCoverage {
  // ...
  steps: {
    whenSteps: Array<{ text: string, tested: boolean }>
    thenSteps: Array<{ text: string, tested: boolean }>
  }
}
```

### Future: UI Visualization

```
┌─────────────────────────────────────┐
│  TasksPage.tsx                      │
│  ================================   │
│  📋 Specs:                          │
│  ✅ task-crud (80% covered)         │
│  ⏳ task-board (40% covered)        │
│  ❌ auto-key (0% covered)           │
│                                     │
│  Click to see scenarios →           │
└─────────────────────────────────────┘
```

### Future: AI Test Generation

```typescript
// Agent reads spec
const spec = parseSpec('task-crud/spec.md')
const scenario = spec.scenarios[0]

// Agent generates test stub
const testCode = generateTest({
  spec: scenario.spec,
  scenario: scenario.id,
  whenSteps: scenario.whenSteps,
  thenSteps: scenario.thenSteps
})

// Output: describeSpec({ ... }, () => { ... })
```

## Performance Considerations

**Test Execution:**
- `describeSpec()` adds minimal overhead (~1ms per suite)
- Registry uses Map for O(1) lookups
- No I/O during test runs

**Coverage Generation:**
- File scanning is I/O bound (~100ms for 100 files)
- Regex parsing is fast (~1ms per file)
- JSON generation is negligible

**Scalability:**
- Handles 1000+ scenarios efficiently
- Manifest files stay small (<1MB for 1000 scenarios)
- No caching needed initially

## Security Considerations

**No security risks identified:**
- No user input processing
- No network calls
- No file writes outside project directory
- All paths are relative and validated

## Testing Strategy

**Unit Tests:**
- `describeSpec()` registration
- Coverage calculation logic
- Manifest generation
- Edge cases (missing IDs, invalid paths)

**Integration Tests:**
- End-to-end coverage generation
- Real spec file parsing
- Manifest validation

**Manual Testing:**
- Run on real AgentForge specs
- Verify output accuracy
- Check console output readability

---

**Status**: ✅ Complete  
**Last Updated**: 2026-02-11
