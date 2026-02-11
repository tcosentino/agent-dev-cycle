## ADDED Requirements

### Requirement: Kanban board layout
The system SHALL display tasks in a kanban board with columns for each status.

#### Scenario: Board displays status columns
**ID:** `task-board-001`  
**Priority:** critical  
**Test Status:** ✅ covered

- **WHEN** user views task board
- **THEN** 5 columns are displayed:
  - "To Do" (status: todo)
  - "In Progress" (status: in-progress)
  - "Review" (status: review)
  - "Done" (status: done)
  - "Blocked" (status: blocked)

**Test Coverage:**
- `src/services/agentforge-ui/components/TasksPage/TasksPage.test.tsx` → "should show task board and detail panel with same status initially"

#### Scenario: Tasks are grouped by status
**ID:** `task-board-002`  
**Priority:** high  
**Test Status:** ❌ uncovered

- **GIVEN** 10 tasks with various statuses
- **WHEN** user views board
- **THEN** tasks appear in their respective status columns
- **AND** task count is shown in column header (e.g., "To Do (3)")

**Test Coverage:**
- None yet

#### Scenario: Empty columns display placeholder
**ID:** `task-board-003`  
**Priority:** low  
**Test Status:** ❌ uncovered

- **WHEN** column has no tasks
- **THEN** column shows "No tasks" placeholder
- **OR** shows drop zone hint "Drop tasks here"

**Test Coverage:**
- None yet

### Requirement: Drag-and-drop task status updates
The system SHALL allow users to drag tasks between columns to change status.

#### Scenario: User drags task to new column
**ID:** `task-board-004`  
**Priority:** critical  
**Test Status:** ✅ covered

- **GIVEN** task AF-5 is in "To Do" column
- **WHEN** user drags AF-5 to "In Progress" column
- **AND** drops it
- **THEN** task status updates to "in-progress"
- **AND** task appears in "In Progress" column
- **AND** API is called to update task status

**Test Coverage:**
- `src/services/agentforge-ui/components/TasksPage/TasksPage.test.tsx` → "BUG FIX: dragging task should update detail panel status via derived state"

#### Scenario: Optimistic update on drag
**ID:** `task-board-005`  
**Priority:** high  
**Test Status:** ✅ covered

- **WHEN** user drags task to new column
- **THEN** task immediately moves in UI (optimistic)
- **AND** API call is made in background
- **IF** API call fails
- **THEN** task reverts to original column
- **AND** error toast shows "Failed to update task status"

**Test Coverage:**
- `src/services/agentforge-ui/components/TasksPage/TasksPage.test.tsx` → "should handle update errors gracefully"

#### Scenario: Drag handles for accessibility
**ID:** `task-board-006`  
**Priority:** medium  
**Test Status:** ❌ uncovered

- **WHEN** task card is focused
- **THEN** drag handle is visible
- **WHEN** user presses Space on drag handle
- **THEN** drag mode activates
- **WHEN** user presses arrow keys
- **THEN** task moves between columns
- **WHEN** user presses Space again
- **THEN** task is dropped in new column

**Test Coverage:**
- None yet

### Requirement: Task card display
The system SHALL display task cards with essential information.

#### Scenario: Task card shows key information
**ID:** `task-board-007`  
**Priority:** high  
**Test Status:** ❌ uncovered

- **WHEN** task appears in board
- **THEN** card displays:
  - Task key (e.g., "AF-12") as header
  - Task title
  - Priority indicator (color-coded dot or badge)
  - Assignee avatar or initials (if assigned)
  - Type icon (backend, frontend, testing, etc.)

**Test Coverage:**
- None yet

#### Scenario: Card color coding by priority
**ID:** `task-board-008`  
**Priority:** medium  
**Test Status:** ❌ uncovered

- **WHEN** task has priority "critical"
- **THEN** card has red accent border
- **WHEN** task has priority "high"
- **THEN** card has orange accent
- **WHEN** task has priority "medium"
- **THEN** card has yellow accent
- **WHEN** task has priority "low"
- **THEN** card has gray accent

**Test Coverage:**
- None yet

#### Scenario: Hover shows additional details
**ID:** `task-board-009`  
**Priority:** low  
**Test Status:** ❌ uncovered

- **WHEN** user hovers over task card
- **THEN** tooltip appears with:
  - Full description (truncated to 100 chars)
  - Created date
  - Last updated date

**Test Coverage:**
- None yet

### Requirement: Board view controls
The system SHALL provide controls for filtering, sorting, and grouping tasks on the board.

#### Scenario: Filter board by assignee
**ID:** `task-board-010`  
**Priority:** high  
**Test Status:** ❌ uncovered

- **WHEN** user selects assignee filter "engineer"
- **THEN** only tasks assigned to "engineer" are shown across all columns
- **AND** column counts update to reflect filtered tasks

**Test Coverage:**
- None yet

#### Scenario: Filter board by priority
**ID:** `task-board-011`  
**Priority:** medium  
**Test Status:** ❌ uncovered

- **WHEN** user toggles priority filter "high" and "critical"
- **THEN** only high and critical priority tasks are displayed

**Test Coverage:**
- None yet

#### Scenario: Sort tasks within columns
**ID:** `task-board-012`  
**Priority:** medium  
**Test Status:** ❌ uncovered

- **WHEN** user selects sort option "Priority"
- **THEN** tasks within each column are sorted by priority (high to low)
- **WHEN** user selects sort option "Recent"
- **THEN** tasks are sorted by updated date (most recent first)

**Test Coverage:**
- None yet

#### Scenario: Group by assignee (future)
**ID:** `task-board-013`  
**Priority:** low  
**Test Status:** ❌ uncovered

- **WHEN** user selects "Group by assignee"
- **THEN** board shows swimlanes for each assignee
- **AND** columns are nested within each swimlane

**Test Coverage:**
- None yet (future feature)

### Requirement: Board interactions
The system SHALL support common task management interactions from the board.

#### Scenario: Click card to open detail view
**ID:** `task-board-014`  
**Priority:** high  
**Test Status:** ✅ covered

- **WHEN** user clicks task card
- **THEN** task detail panel opens in right pane
- **AND** shows full task information
- **AND** allows inline editing

**Test Coverage:**
- `src/services/agentforge-ui/components/TasksPage/TasksPage.test.tsx` → "should show task board and detail panel with same status initially"

#### Scenario: Quick actions on card
**ID:** `task-board-015`  
**Priority:** medium  
**Test Status:** ❌ uncovered

- **WHEN** user right-clicks task card
- **THEN** context menu appears with:
  - "Edit"
  - "Assign to me"
  - "Change priority"
  - "Delete"
- **WHEN** user selects action
- **THEN** action is executed

**Test Coverage:**
- None yet

#### Scenario: Create task from column
**ID:** `task-board-016`  
**Priority:** high  
**Test Status:** ❌ uncovered

- **WHEN** user clicks "+" button in column header
- **THEN** task creation form appears
- **AND** status is pre-filled with column's status
- **WHEN** task is created
- **THEN** it appears in that column

**Test Coverage:**
- None yet

### Requirement: Board performance
The system SHALL handle large numbers of tasks efficiently.

#### Scenario: Virtual scrolling for tall columns
**ID:** `task-board-017`  
**Priority:** medium  
**Test Status:** ❌ uncovered

- **GIVEN** column has 50+ tasks
- **WHEN** user scrolls column
- **THEN** only visible tasks are rendered
- **AND** scrolling is smooth (60fps)

**Test Coverage:**
- None yet

#### Scenario: Lazy load task details
**ID:** `task-board-018`  
**Priority:** medium  
**Test Status:** ❌ uncovered

- **WHEN** board initially loads
- **THEN** only task key, title, and priority are fetched
- **WHEN** user opens task detail
- **THEN** full task data is fetched

**Test Coverage:**
- None yet

#### Scenario: Board state persists
**ID:** `task-board-019`  
**Priority:** low  
**Test Status:** ❌ uncovered

- **WHEN** user applies filters and sorts
- **AND** navigates away from board
- **AND** returns to board
- **THEN** filters and sort preferences are restored

**Test Coverage:**
- None yet

### Requirement: Keyboard navigation
The system SHALL support full keyboard navigation of the board.

#### Scenario: Navigate between columns with arrow keys
**ID:** `task-board-020`  
**Priority:** medium  
**Test Status:** ❌ uncovered

- **WHEN** user presses Right arrow
- **THEN** focus moves to next column
- **WHEN** user presses Left arrow
- **THEN** focus moves to previous column

**Test Coverage:**
- None yet

#### Scenario: Navigate tasks within column
**ID:** `task-board-021`  
**Priority:** medium  
**Test Status:** ❌ uncovered

- **WHEN** user presses Down arrow
- **THEN** focus moves to next task in column
- **WHEN** user presses Up arrow
- **THEN** focus moves to previous task

**Test Coverage:**
- None yet

#### Scenario: Open task with Enter
**ID:** `task-board-022`  
**Priority:** medium  
**Test Status:** ❌ uncovered

- **WHEN** task card has focus
- **AND** user presses Enter
- **THEN** task detail panel opens

**Test Coverage:**
- None yet

#### Scenario: Move task with keyboard
**ID:** `task-board-023`  
**Priority:** high  
**Test Status:** ❌ uncovered

- **WHEN** user activates drag mode (Space on drag handle)
- **AND** presses Right arrow
- **THEN** task moves to next column
- **WHEN** user presses Space again
- **THEN** task is dropped and status updates

**Test Coverage:**
- None yet

### Requirement: Mobile responsiveness
The system SHALL adapt board layout for smaller screens.

#### Scenario: Board stacks on mobile
**ID:** `task-board-024`  
**Priority:** medium  
**Test Status:** ❌ uncovered

- **WHEN** viewport width < 768px
- **THEN** columns stack vertically
- **AND** drag-and-drop still works (swipe to move)

**Test Coverage:**
- None yet

#### Scenario: Compact card view on mobile
**ID:** `task-board-025`  
**Priority:** low  
**Test Status:** ❌ uncovered

- **WHEN** screen is small
- **THEN** task cards show minimal info (key + title only)
- **AND** tap to expand for more details

**Test Coverage:**
- None yet
