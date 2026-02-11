# Spec: describeSpec() Function

## Requirements

### Requirement: Wrap vitest describe with metadata
The system SHALL provide `describeSpec()` that wraps vitest's `describe()` while capturing spec metadata.

#### Scenario: Basic usage with required fields
**ID:** `describeSpec-001`  
**Priority:** critical  
**Test Status:** ❌ uncovered

- **WHEN** developer calls `describeSpec({ spec, scenario, requirement, title }, testFn)`
- **THEN** vitest `describe()` is called with enhanced title `[scenario] title`
- **AND** test function is executed normally
- **AND** metadata is registered in coverage registry

#### Scenario: Test names appear in vitest output
**ID:** `describeSpec-002`  
**Priority:** high  
**Test Status:** ❌ uncovered

- **GIVEN** describeSpec with scenario ID "task-crud-001"
- **WHEN** vitest runs tests
- **THEN** test output shows "[task-crud-001] User creates task"
- **AND** individual test names appear nested beneath

#### Scenario: Optional priority field defaults to medium
**ID:** `describeSpec-003`  
**Priority:** medium  
**Test Status:** ❌ uncovered

- **WHEN** metadata omits `priority` field
- **THEN** priority defaults to "medium"
- **AND** coverage manifest shows "medium" priority

### Requirement: Register test-spec mappings
The system SHALL register metadata in a global registry for coverage tracking.

#### Scenario: Metadata registered with unique key
**ID:** `describeSpec-004`  
**Priority:** critical  
**Test Status:** ❌ uncovered

- **WHEN** describeSpec is called
- **THEN** registry key is `{spec-path}::{scenario-id}`
- **AND** registration includes: metadata, testFile, testNames

#### Scenario: Multiple scenarios per file
**ID:** `describeSpec-005`  
**Priority:** high  
**Test Status:** ❌ uncovered

- **WHEN** test file contains 3 describeSpec calls
- **THEN** registry contains 3 separate entries
- **AND** each has unique scenario ID

### Requirement: Variants for skip/only/todo
The system SHALL support vitest's skip/only/todo modifiers.

#### Scenario: describeSpec.skip skips suite
**ID:** `describeSpec-006`  
**Priority:** medium  
**Test Status:** ❌ uncovered

- **WHEN** developer uses `describeSpec.skip(metadata, testFn)`
- **THEN** vitest skips the test suite
- **AND** metadata is still registered
- **AND** coverage report shows as "covered (skipped)"

#### Scenario: describeSpec.only runs only that suite
**ID:** `describeSpec-007`  
**Priority:** medium  
**Test Status:** ❌ uncovered

- **WHEN** developer uses `describeSpec.only(metadata, testFn)`
- **THEN** vitest runs only that suite
- **AND** other suites are skipped

#### Scenario: describeSpec.todo marks as TODO
**ID:** `describeSpec-008`  
**Priority:** low  
**Test Status:** ❌ uncovered

- **WHEN** developer uses `describeSpec.todo(metadata)`
- **THEN** vitest marks suite as TODO
- **AND** coverage shows as "uncovered (planned)"

### Requirement: Type safety and validation
The system SHALL enforce type-safe metadata with TypeScript.

#### Scenario: TypeScript validates required fields
**ID:** `describeSpec-009`  
**Priority:** high  
**Test Status:** ❌ uncovered

- **WHEN** developer omits required field (e.g., `scenario`)
- **THEN** TypeScript compilation fails
- **AND** IDE shows error immediately

#### Scenario: Priority must be valid enum value
**ID:** `describeSpec-010`  
**Priority:** medium  
**Test Status:** ❌ uncovered

- **WHEN** developer uses `priority: 'ultra-high'`
- **THEN** TypeScript error: Type '"ultra-high"' is not assignable to type 'ScenarioPriority'
- **AND** valid options are suggested: "critical" | "high" | "medium" | "low"

### Requirement: Zero breaking changes
The system SHALL work alongside existing vitest tests without modifications.

#### Scenario: Existing describe() tests still work
**ID:** `describeSpec-011`  
**Priority:** critical  
**Test Status:** ❌ uncovered

- **GIVEN** test file with existing `describe()` suites
- **WHEN** developer adds `describeSpec()` for new tests
- **THEN** both types of suites run successfully
- **AND** existing tests are unaffected

#### Scenario: No global state pollution
**ID:** `describeSpec-012`  
**Priority:** high  
**Test Status:** ❌ uncovered

- **WHEN** describeSpec registers metadata
- **THEN** it does not modify global vitest state
- **AND** vitest hooks (beforeEach, afterEach) work normally
- **AND** test isolation is maintained

### Requirement: Error handling
The system SHALL handle invalid inputs gracefully.

#### Scenario: Invalid spec path logs warning
**ID:** `describeSpec-013`  
**Priority:** medium  
**Test Status:** ❌ uncovered

- **WHEN** metadata.spec is empty string
- **THEN** warning is logged: "Invalid spec path"
- **AND** test suite still executes
- **AND** coverage shows as "uncovered (invalid)"

#### Scenario: Duplicate scenario ID logs warning
**ID:** `describeSpec-014`  
**Priority:** medium  
**Test Status:** ❌ uncovered

- **GIVEN** describeSpec already registered for "task-crud-001"
- **WHEN** another describeSpec uses same scenario ID
- **THEN** warning is logged: "Duplicate scenario ID: task-crud-001"
- **AND** latest registration overwrites previous

---

**Implementation Notes:**
- Use vitest's `describe()` as foundation
- Registry is a global Map (acceptable for testing context)
- Test file path inference uses stack traces or vitest internals
