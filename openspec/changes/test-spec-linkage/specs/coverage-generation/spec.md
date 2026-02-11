# Spec: Coverage Manifest Generation

## Requirements

### Requirement: Scan and parse spec files
The system SHALL automatically discover and parse spec.md files to extract scenario metadata.

#### Scenario: Find all spec.md files recursively
**ID:** `coverage-001`  
**Priority:** critical  
**Test Status:** ❌ uncovered

- **WHEN** script runs with directory `openspec/specs/task-management-ui/`
- **THEN** all `spec.md` files are found:
  - `task-crud/spec.md`
  - `task-board/spec.md`
  - `auto-key-generation/spec.md`
- **AND** nested directories are scanned

#### Scenario: Parse scenario IDs from markdown
**ID:** `coverage-002`  
**Priority:** critical  
**Test Status:** ❌ uncovered

- **WHEN** script parses spec file
- **THEN** regex extracts: `**ID:** \`task-crud-001\``
- **AND** returns scenario ID "task-crud-001"
- **AND** handles multiple scenarios in one file

#### Scenario: Extract priority and title
**ID:** `coverage-003`  
**Priority:** high  
**Test Status:** ❌ uncovered

- **WHEN** parsing scenario block
- **THEN** extracts priority: "critical" | "high" | "medium" | "low"
- **AND** extracts title: "User creates task with minimal fields"
- **AND** returns structured object: `{ id, title, priority }`

### Requirement: Match scenarios with test registry
The system SHALL determine coverage by matching scenario IDs with registered tests.

#### Scenario: Covered scenario has test registration
**ID:** `coverage-004`  
**Priority:** critical  
**Test Status:** ❌ uncovered

- **GIVEN** scenario "task-crud-001" in spec
- **AND** describeSpec registered for "task-crud-001"
- **WHEN** coverage is calculated
- **THEN** scenario status is "covered"
- **AND** test file path is included

#### Scenario: Uncovered scenario has no registration
**ID:** `coverage-005`  
**Priority:** high  
**Test Status:** ❌ uncovered

- **GIVEN** scenario "task-crud-015" in spec
- **AND** no describeSpec for that scenario
- **WHEN** coverage is calculated
- **THEN** scenario status is "uncovered"
- **AND** testFiles array is empty

### Requirement: Calculate coverage statistics
The system SHALL compute coverage percentages and summaries.

#### Scenario: Per-spec coverage percentage
**ID:** `coverage-006`  
**Priority:** high  
**Test Status:** ❌ uncovered

- **GIVEN** spec with 10 scenarios
- **AND** 7 scenarios covered, 3 uncovered
- **WHEN** coverage is calculated
- **THEN** coveragePercent = 70%
- **AND** coveredScenarios = 7
- **AND** uncoveredScenarios = 3

#### Scenario: Overall summary across all specs
**ID:** `coverage-007`  
**Priority:** high  
**Test Status:** ❌ uncovered

- **GIVEN** 3 specs with 69 total scenarios
- **AND** 5 scenarios covered
- **WHEN** coverage manifest generated
- **THEN** summary.totalScenarios = 69
- **AND** summary.coveredScenarios = 5
- **AND** summary.coveragePercent = 7%

### Requirement: Generate JSON manifest
The system SHALL output structured JSON coverage reports.

#### Scenario: Manifest follows schema
**ID:** `coverage-008`  
**Priority:** critical  
**Test Status:** ❌ uncovered

- **WHEN** manifest is generated
- **THEN** JSON matches CoverageManifest interface
- **AND** includes generatedAt timestamp (ISO 8601)
- **AND** includes summary object
- **AND** includes specs array

#### Scenario: Write manifest to file
**ID:** `coverage-009`  
**Priority:** high  
**Test Status:** ❌ uncovered

- **WHEN** script completes successfully
- **THEN** writes `coverage.json` to spec directory
- **AND** file is valid JSON
- **AND** file is pretty-printed (2-space indent)

#### Scenario: Manifest includes test file paths
**ID:** `coverage-010`  
**Priority:** medium  
**Test Status:** ❌ uncovered

- **GIVEN** describeSpec registered with test file path
- **WHEN** manifest is generated
- **THEN** scenario.testFiles includes `filePath`
- **AND** filePath is relative to repo root
- **AND** format: "src/components/TaskForm.test.tsx"

### Requirement: Console output and reporting
The system SHALL print human-readable coverage summaries.

#### Scenario: Print coverage summary table
**ID:** `coverage-011`  
**Priority:** high  
**Test Status:** ❌ uncovered

- **WHEN** script completes
- **THEN** console shows:
  ```
  ============================================================
  📊 Test-Spec Coverage Summary
  ============================================================
  Total Specs:       3
  Total Scenarios:   69
  ✅ Covered:        5
  ❌ Uncovered:      64
  📈 Coverage:       7%
  ```

#### Scenario: Show per-spec breakdown with progress bars
**ID:** `coverage-012`  
**Priority:** medium  
**Test Status:** ❌ uncovered

- **WHEN** summary is printed
- **THEN** shows per-spec coverage:
  ```
  📋 Per-Spec Coverage:
    task-crud          [████████░░░░░░░░░░░░] 40% (10/25)
    task-board         [░░░░░░░░░░░░░░░░░░░░] 0% (0/25)
    auto-key           [░░░░░░░░░░░░░░░░░░░░] 0% (0/18)
  ```

#### Scenario: List high-priority uncovered scenarios
**ID:** `coverage-013`  
**Priority:** high  
**Test Status:** ❌ uncovered

- **WHEN** uncovered scenarios exist
- **THEN** prints first 10 with priority indicators:
  ```
  ❌ Uncovered Scenarios (need tests):
    ⚠️ [task-crud] task-crud-003: Validation prevents empty title
    ⚠️ [auto-key] auto-key-001: First task gets key PROJECT-1
       [task-board] task-board-009: Hover shows details
  ```
- **AND** critical/high priority marked with ⚠️
- **AND** if more than 10, shows "... and N more"

### Requirement: CI integration and thresholds
The system SHALL support coverage thresholds for CI/CD pipelines.

#### Scenario: Configurable coverage threshold
**ID:** `coverage-014`  
**Priority:** medium  
**Test Status:** ❌ uncovered

- **GIVEN** threshold set to 50%
- **AND** actual coverage is 40%
- **WHEN** script runs
- **THEN** prints warning: "Coverage 40% is below threshold 50%"
- **AND** exits with status code 0 (informational only, doesn't fail)

#### Scenario: Future: Fail CI on low coverage
**ID:** `coverage-015`  
**Priority:** low  
**Test Status:** ❌ uncovered

- **GIVEN** strict mode enabled
- **AND** coverage below threshold
- **WHEN** script runs in CI
- **THEN** exits with status code 1 (failure)
- **AND** CI pipeline stops

### Requirement: Incremental updates
The system SHALL support incremental coverage updates without full regeneration.

#### Scenario: Detect changed specs only (future)
**ID:** `coverage-016`  
**Priority:** low  
**Test Status:** ❌ uncovered

- **WHEN** script runs with `--incremental` flag
- **THEN** only parses specs modified since last run
- **AND** merges with existing coverage.json
- **AND** updates generatedAt timestamp

#### Scenario: Preserve manual annotations (future)
**ID:** `coverage-017`  
**Priority:** low  
**Test Status:** ❌ uncovered

- **GIVEN** coverage.json has manual notes: `{ note: "Tested manually" }`
- **WHEN** coverage is regenerated
- **THEN** manual notes are preserved
- **AND** computed fields are updated

### Requirement: Error handling
The system SHALL handle invalid or malformed spec files gracefully.

#### Scenario: Missing scenario ID logs warning
**ID:** `coverage-018`  
**Priority:** medium  
**Test Status:** ❌ uncovered

- **GIVEN** spec file with scenario missing ID field
- **WHEN** script parses file
- **THEN** logs warning: "Scenario missing ID: {title}"
- **AND** continues processing other scenarios
- **AND** skips invalid scenario in manifest

#### Scenario: Spec directory not found
**ID:** `coverage-019`  
**Priority:** high  
**Test Status:** ❌ uncovered

- **WHEN** script runs with non-existent directory
- **THEN** exits with error: "Spec directory not found: {path}"
- **AND** exits with status code 1

---

**Implementation Notes:**
- Use recursive directory traversal with Node.js `fs` module
- Regex for parsing scenario blocks (see design.md)
- Output to stdout for CI logging, write JSON file for persistence
