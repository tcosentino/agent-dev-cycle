## ADDED Requirements

### Requirement: Create new task
The system SHALL allow users to create tasks with auto-generated keys.

#### Scenario: User creates task with minimal fields
- **WHEN** user clicks "New Task" button
- **THEN** task creation form appears
- **WHEN** user enters title "Implement user authentication"
- **AND** clicks "Create"
- **THEN** task is created with auto-generated key (e.g., "AF-12")
- **AND** status defaults to "todo"
- **AND** form closes
- **AND** new task appears in task list

#### Scenario: User creates task with all fields
- **WHEN** user fills out task form with:
  - Title: "Add search functionality"
  - Description: "Implement full-text search across files"
  - Type: "backend"
  - Priority: "high"
  - Assignee: "engineer"
- **AND** clicks "Create"
- **THEN** task is created with all specified values
- **AND** auto-generated key respects project prefix

#### Scenario: Validation prevents empty title
- **WHEN** user submits task form with empty title
- **THEN** form shows error "Title is required"
- **AND** task is not created
- **AND** form remains open for correction

#### Scenario: Duplicate title is allowed
- **GIVEN** task with title "Fix bug" exists
- **WHEN** user creates another task with title "Fix bug"
- **THEN** task is created successfully
- **AND** receives unique key (AF-13 vs AF-12)

### Requirement: Edit existing task
The system SHALL allow users to modify task fields.

#### Scenario: User edits task title inline
- **GIVEN** task AF-5 exists with title "Old title"
- **WHEN** user clicks title in task card
- **AND** edits to "New title"
- **AND** presses Enter or clicks away
- **THEN** task title updates to "New title"
- **AND** updatedAt timestamp is refreshed

#### Scenario: User edits task in detail view
- **WHEN** user opens task detail panel
- **AND** clicks "Edit" button
- **THEN** all fields become editable
- **WHEN** user changes priority from "medium" to "high"
- **AND** clicks "Save"
- **THEN** task is updated with new priority
- **AND** detail panel shows updated values

#### Scenario: Cancel edit reverts changes
- **WHEN** user edits task description
- **AND** clicks "Cancel"
- **THEN** original description is restored
- **AND** no API call is made

### Requirement: Delete task
The system SHALL allow users to delete tasks with confirmation.

#### Scenario: User deletes task
- **WHEN** user clicks delete icon on task AF-8
- **THEN** confirmation dialog appears with:
  - Title: "Delete task?"
  - Message: "AF-8: Task title will be permanently deleted."
  - Actions: "Delete" (danger), "Cancel"
- **WHEN** user clicks "Delete"
- **THEN** task is deleted from database
- **AND** task is removed from UI
- **AND** success toast shows "Task AF-8 deleted"

#### Scenario: Cancel delete preserves task
- **WHEN** user clicks delete icon
- **AND** clicks "Cancel" in confirmation
- **THEN** task is not deleted
- **AND** dialog closes

### Requirement: Task list view
The system SHALL display all tasks for a project in a list view.

#### Scenario: Tasks displayed with key information
- **WHEN** user views task list
- **THEN** each task shows:
  - Task key (e.g., "AF-12")
  - Title
  - Status badge (todo, in-progress, etc.)
  - Priority indicator (color-coded)
  - Assignee (if set)
  - Created date

#### Scenario: Empty state for no tasks
- **WHEN** project has no tasks
- **THEN** empty state shows:
  - Illustration or icon
  - Message: "No tasks yet"
  - "Create Task" button

#### Scenario: Tasks sorted by default
- **WHEN** task list loads
- **THEN** tasks are sorted by:
  - Priority (critical > high > medium > low)
  - Then by created date (newest first)

### Requirement: Task filtering and search
The system SHALL allow users to filter and search tasks.

#### Scenario: Filter by status
- **WHEN** user selects "In Progress" filter
- **THEN** only tasks with status "in-progress" are displayed

#### Scenario: Filter by assignee
- **WHEN** user selects assignee filter "engineer"
- **THEN** only tasks assigned to "engineer" are shown

#### Scenario: Search by key or title
- **WHEN** user types "AF-5" in search box
- **THEN** only task AF-5 is displayed
- **WHEN** user types "authentication"
- **THEN** all tasks with "authentication" in title or description are shown

#### Scenario: Combined filters
- **WHEN** user filters by status="todo" AND assignee="qa"
- **THEN** only todo tasks assigned to qa are shown

#### Scenario: Clear filters
- **WHEN** user clicks "Clear filters"
- **THEN** all filters reset
- **AND** all tasks are displayed

### Requirement: Task form validation
The system SHALL validate task inputs and display helpful error messages.

#### Scenario: Title length validation
- **WHEN** user enters title longer than 200 characters
- **THEN** form shows error "Title must be 200 characters or less"
- **AND** character count is displayed (205/200)

#### Scenario: Task type validation
- **WHEN** user submits form without selecting type
- **THEN** type field is optional (allowed to be empty)

#### Scenario: Assignee validation
- **WHEN** user enters invalid assignee value
- **THEN** form shows error "Invalid assignee. Must be: pm, engineer, qa, or lead"

#### Scenario: API error handling
- **WHEN** API returns 400 error (validation failed)
- **THEN** form displays API error message
- **AND** highlights relevant field
- **WHEN** API returns 409 error (unique constraint)
- **THEN** form shows "Task key already exists" (unlikely due to auto-increment)
