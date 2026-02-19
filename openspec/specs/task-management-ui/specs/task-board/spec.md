## ADDED Requirements

### Requirement: Kanban board layout
The system SHALL display tasks in a kanban board with columns for each status.

#### Scenario: Board displays status columns
- **WHEN** user views task board
- **THEN** 5 columns are displayed:
  - "To Do" (status: todo)
  - "In Progress" (status: in-progress)
  - "Review" (status: review)
  - "Done" (status: done)
  - "Blocked" (status: blocked)

#### Scenario: Tasks are grouped by status
- **GIVEN** 10 tasks with various statuses
- **WHEN** user views board
- **THEN** tasks appear in their respective status columns
- **AND** task count is shown in column header (e.g., "To Do (3)")

#### Scenario: Empty columns display placeholder
- **WHEN** column has no tasks
- **THEN** column shows "No tasks" placeholder
- **OR** shows drop zone hint "Drop tasks here"

### Requirement: Drag-and-drop task status updates
The system SHALL allow users to drag tasks between columns to change status.

#### Scenario: User drags task to new column
- **GIVEN** task AF-5 is in "To Do" column
- **WHEN** user drags AF-5 to "In Progress" column
- **AND** drops it
- **THEN** task status updates to "in-progress"
- **AND** task appears in "In Progress" column
- **AND** API is called to update task status

#### Scenario: Optimistic update on drag
- **WHEN** user drags task to new column
- **THEN** task immediately moves in UI (optimistic)
- **AND** API call is made in background
- **IF** API call fails
- **THEN** task reverts to original column
- **AND** error toast shows "Failed to update task status"

#### Scenario: Drag handles for accessibility
- **WHEN** task card is focused
- **THEN** drag handle is visible
- **WHEN** user presses Space on drag handle
- **THEN** drag mode activates
- **WHEN** user presses arrow keys
- **THEN** task moves between columns
- **WHEN** user presses Space again
- **THEN** task is dropped in new column

### Requirement: Task card display
The system SHALL display task cards with essential information.

#### Scenario: Task card shows key information
- **WHEN** task appears in board
- **THEN** card displays:
  - Task key (e.g., "AF-12") as header
  - Task title
  - Priority indicator (color-coded dot or badge)
  - Assignee avatar or initials (if assigned)
  - Type icon (backend, frontend, testing, etc.)

#### Scenario: Card color coding by priority
- **WHEN** task has priority "critical"
- **THEN** card has red accent border
- **WHEN** task has priority "high"
- **THEN** card has orange accent
- **WHEN** task has priority "medium"
- **THEN** card has yellow accent
- **WHEN** task has priority "low"
- **THEN** card has gray accent

#### Scenario: Hover shows additional details
- **WHEN** user hovers over task card
- **THEN** tooltip appears with:
  - Full description (truncated to 100 chars)
  - Created date
  - Last updated date

### Requirement: Board view controls
The system SHALL provide controls for filtering, sorting, and grouping tasks on the board.

#### Scenario: Filter board by assignee
- **WHEN** user selects assignee filter "engineer"
- **THEN** only tasks assigned to "engineer" are shown across all columns
- **AND** column counts update to reflect filtered tasks

#### Scenario: Filter board by priority
- **WHEN** user toggles priority filter "high" and "critical"
- **THEN** only high and critical priority tasks are displayed

#### Scenario: Sort tasks within columns
- **WHEN** user selects sort option "Priority"
- **THEN** tasks within each column are sorted by priority (high to low)
- **WHEN** user selects sort option "Recent"
- **THEN** tasks are sorted by updated date (most recent first)

#### Scenario: Group by assignee (future)
- **WHEN** user selects "Group by assignee"
- **THEN** board shows swimlanes for each assignee
- **AND** columns are nested within each swimlane

### Requirement: Board interactions
The system SHALL support common task management interactions from the board.

#### Scenario: Click card to open detail view
- **WHEN** user clicks task card
- **THEN** task detail panel opens in right pane
- **AND** shows full task information
- **AND** allows inline editing

#### Scenario: Quick actions on card
- **WHEN** user right-clicks task card
- **THEN** context menu appears with:
  - "Edit"
  - "Assign to me"
  - "Change priority"
  - "Delete"
- **WHEN** user selects action
- **THEN** action is executed

#### Scenario: Create task from column
- **WHEN** user clicks "+" button in column header
- **THEN** task creation form appears
- **AND** status is pre-filled with column's status
- **WHEN** task is created
- **THEN** it appears in that column

### Requirement: Board performance
The system SHALL handle large numbers of tasks efficiently.

#### Scenario: Virtual scrolling for tall columns
- **GIVEN** column has 50+ tasks
- **WHEN** user scrolls column
- **THEN** only visible tasks are rendered
- **AND** scrolling is smooth (60fps)

#### Scenario: Lazy load task details
- **WHEN** board initially loads
- **THEN** only task key, title, and priority are fetched
- **WHEN** user opens task detail
- **THEN** full task data is fetched

#### Scenario: Board state persists
- **WHEN** user applies filters and sorts
- **AND** navigates away from board
- **AND** returns to board
- **THEN** filters and sort preferences are restored

### Requirement: Keyboard navigation
The system SHALL support full keyboard navigation of the board.

#### Scenario: Navigate between columns with arrow keys
- **WHEN** user presses Right arrow
- **THEN** focus moves to next column
- **WHEN** user presses Left arrow
- **THEN** focus moves to previous column

#### Scenario: Navigate tasks within column
- **WHEN** user presses Down arrow
- **THEN** focus moves to next task in column
- **WHEN** user presses Up arrow
- **THEN** focus moves to previous task

#### Scenario: Open task with Enter
- **WHEN** task card has focus
- **AND** user presses Enter
- **THEN** task detail panel opens

#### Scenario: Move task with keyboard
- **WHEN** user activates drag mode (Space on drag handle)
- **AND** presses Right arrow
- **THEN** task moves to next column
- **WHEN** user presses Space again
- **THEN** task is dropped and status updates

### Requirement: Mobile responsiveness
The system SHALL adapt board layout for smaller screens.

#### Scenario: Board stacks on mobile
- **WHEN** viewport width < 768px
- **THEN** columns stack vertically
- **AND** drag-and-drop still works (swipe to move)

#### Scenario: Compact card view on mobile
- **WHEN** screen is small
- **THEN** task cards show minimal info (key + title only)
- **AND** tap to expand for more details
