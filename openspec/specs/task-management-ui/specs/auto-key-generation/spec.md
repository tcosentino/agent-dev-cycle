## ADDED Requirements

### Requirement: Auto-generate task keys from project prefix
The system SHALL automatically generate unique task keys using the project's key prefix.

#### Scenario: First task gets key PROJECT-1
- **GIVEN** project with key "AF"
- **AND** project has no tasks yet
- **WHEN** user creates first task
- **THEN** task key is auto-generated as "AF-1"

#### Scenario: Subsequent tasks increment
- **GIVEN** project has tasks AF-1, AF-2, AF-3
- **WHEN** user creates new task
- **THEN** task key is "AF-4"

#### Scenario: Key is generated on server-side
- **WHEN** user submits task creation form without specifying key
- **THEN** API generates key on server
- **AND** returns new task with generated key
- **AND** UI displays the generated key

#### Scenario: User cannot manually set task key
- **WHEN** task creation form is displayed
- **THEN** task key field is disabled or hidden
- **AND** displays "(Auto-generated)" placeholder

### Requirement: Handle concurrent task creation
The system SHALL handle race conditions when multiple tasks are created simultaneously.

#### Scenario: Two users create tasks simultaneously
- **GIVEN** last task is AF-10
- **WHEN** User A creates task (expects AF-11)
- **AND** User B creates task at same time (also expects AF-11)
- **THEN** first request gets AF-11
- **AND** second request gets AF-12
- **AND** no duplicate keys exist

#### Scenario: Unique constraint violation is handled
- **WHEN** server detects key collision (unique constraint)
- **THEN** server retries with next available key
- **AND** returns success with correct key

### Requirement: Respect project key prefix
The system SHALL use the correct project prefix for task keys.

#### Scenario: Different projects have different prefixes
- **GIVEN** project "AgentForge" with key "AF"
- **AND** project "TodoApp" with key "TODO"
- **WHEN** user creates task in AgentForge
- **THEN** task key is "AF-{N}"
- **WHEN** user creates task in TodoApp
- **THEN** task key is "TODO-{N}"

#### Scenario: Key prefix is validated
- **GIVEN** task dataobject defines autoIncrement config
- **WHEN** server generates key
- **THEN** it uses project.key field as prefix
- **AND** follows format "{prefix}-{number}"

### Requirement: Display key prominently
The system SHALL display the auto-generated key prominently throughout the UI.

#### Scenario: Key shown in task card
- **WHEN** task is displayed in board or list
- **THEN** key is shown as primary identifier
- **AND** appears before title (e.g., "AF-5: Implement feature")

#### Scenario: Key is copyable
- **WHEN** user clicks task key
- **THEN** key is copied to clipboard
- **AND** toast shows "Copied AF-5"

#### Scenario: Key is searchable
- **WHEN** user searches for "AF-5"
- **THEN** task with that key is found
- **AND** highlighted in results

### Requirement: Key uniqueness enforcement
The system SHALL ensure task keys are unique within a project.

#### Scenario: Database enforces unique constraint
- **WHEN** task is created with duplicate key
- **THEN** database rejects insertion with unique constraint error
- **AND** API returns 409 Conflict

#### Scenario: UI handles unique constraint errors
- **WHEN** rare collision occurs
- **THEN** API automatically retries with next key
- **AND** UI shows no error to user
- **AND** task is created successfully with valid key

### Requirement: Key format consistency
The system SHALL maintain consistent key format across all tasks.

#### Scenario: Key follows pattern PROJECT-NUMBER
- **WHEN** task key is generated
- **THEN** format is exactly "{PROJECT}-{NUMBER}"
- **AND** separator is hyphen (-)
- **AND** number has no leading zeros (5, not 05)

#### Scenario: Project key is uppercase
- **GIVEN** project key is "af" (lowercase)
- **WHEN** task key is generated
- **THEN** key uses uppercase prefix "AF-1"
- **OR** project key is stored as uppercase in database

#### Scenario: Maximum key number
- **GIVEN** project has 999 tasks (AF-1 through AF-999)
- **WHEN** user creates task 1000
- **THEN** key is "AF-1000" (no limit enforced)

### Requirement: Backfill keys for legacy tasks
The system SHOULD support backfilling keys for tasks created before auto-generation.

#### Scenario: Legacy task without key
- **GIVEN** task exists without key (null or empty)
- **WHEN** viewed in UI
- **THEN** placeholder is shown: "(No key)"
- **OR** system offers to auto-assign key

#### Scenario: Bulk assign keys to legacy tasks
- **WHEN** admin runs key backfill script
- **THEN** all tasks without keys are assigned sequential keys
- **AND** assignments are logged

**Note:** Backfill is low priority since AgentForge is greenfield (no legacy tasks).
