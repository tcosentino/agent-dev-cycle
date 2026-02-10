## 1. Setup and Dependencies

- [x] 1.1 Add @dnd-kit/core dependency to root package.json
- [x] 1.2 Add @dnd-kit/sortable dependency
- [x] 1.3 Add @dnd-kit/utilities dependency
- [x] 1.4 Install dependencies with yarn

## 2. API Client Functions

- [x] 2.1 Create getTasks(projectId) function in src/services/agentforge-ui/api.ts
- [x] 2.2 Create createTask(projectId, taskData) function
- [x] 2.3 Create updateTask(taskId, updates) function
- [x] 2.4 Create deleteTask(taskId) function
- [x] 2.5 Add TypeScript types for task API responses

## 3. Core UI Components - Task Card

- [x] 3.1 Create TaskCard component in packages/ui-components/src/components/TaskCard/
- [x] 3.2 Add TaskCard.tsx with props: task, onClick, onDelete
- [x] 3.3 Display task key, title, priority indicator, assignee
- [x] 3.4 Add CSS module for TaskCard styling
- [x] 3.5 Add priority color coding (critical=red, high=orange, medium=yellow, low=gray)
- [x] 3.6 Add type icon (backend, frontend, testing, etc.)
- [x] 3.7 Add hover effects
- [x] 3.8 Export TaskCard from ui-components index

## 4. Core UI Components - Task Form

- [x] 4.1 Create TaskForm component in packages/ui-components/src/components/TaskForm/
- [x] 4.2 Add form fields: title (required), description, type, priority, assignee
- [x] 4.3 Hide key field (auto-generated on server)
- [x] 4.4 Add field validation (title required, max length 200)
- [x] 4.5 Add CSS module for TaskForm styling
- [x] 4.6 Create controlled inputs with React state
- [x] 4.7 Add submit and cancel buttons
- [x] 4.8 Handle API errors and display error messages
- [x] 4.9 Emit onSubmit(taskData) and onCancel() callbacks
- [x] 4.10 Export TaskForm from ui-components index

## 5. Core UI Components - Task Board

- [ ] 5.1 Create TaskBoard component in packages/ui-components/src/components/TaskBoard/
- [ ] 5.2 Set up DndContext from @dnd-kit/core
- [ ] 5.3 Create TaskColumn sub-component for status columns
- [ ] 5.4 Create 5 columns: todo, in-progress, review, done, blocked
- [ ] 5.5 Display column headers with task count
- [ ] 5.6 Group tasks by status and render in columns
- [ ] 5.7 Add CSS module for TaskBoard layout (horizontal scroll)
- [ ] 5.8 Add empty state "No tasks" for empty columns
- [ ] 5.9 Export TaskBoard from ui-components index

## 6. Drag-and-Drop Functionality

- [ ] 6.1 Make TaskCard draggable with useDraggable hook
- [ ] 6.2 Make TaskColumn droppable with useDroppable hook
- [ ] 6.3 Implement onDragEnd handler in TaskBoard
- [ ] 6.4 Detect source and destination columns
- [ ] 6.5 Emit onTaskMove(taskId, newStatus) callback
- [ ] 6.6 Add drag overlay for visual feedback
- [ ] 6.7 Add drag handle icon to TaskCard
- [ ] 6.8 Add CSS for drag states (dragging, over drop zone)

## 7. Keyboard Accessibility for Drag-and-Drop

- [ ] 7.1 Add KeyboardSensor to DndContext
- [ ] 7.2 Enable keyboard dragging with Space key
- [ ] 7.3 Add arrow key navigation between columns
- [ ] 7.4 Add visual focus indicators
- [ ] 7.5 Add screen reader announcements for drag events
- [ ] 7.6 Test keyboard-only board navigation

## 8. Task Detail Panel

- [ ] 8.1 Create TaskDetailPanel component in packages/ui-components/src/components/
- [ ] 8.2 Display full task information (all fields)
- [ ] 8.3 Add "Edit" button to toggle edit mode
- [ ] 8.4 Implement inline editing for all fields
- [ ] 8.5 Add "Save" and "Cancel" buttons in edit mode
- [ ] 8.6 Add "Delete" button with confirmation
- [ ] 8.7 Display created and updated timestamps
- [ ] 8.8 Add CSS module for panel styling (slide-in animation)
- [ ] 8.9 Export TaskDetailPanel from ui-components index

## 9. Tasks Page Integration

- [ ] 9.1 Create TasksPage component in src/services/agentforge-ui/components/
- [ ] 9.2 Add route for /project/:projectId/tasks in ProjectViewer
- [ ] 9.3 Add "Tasks" tab to main navigation
- [ ] 9.4 Fetch tasks on mount with GET /api/tasks?projectId={id}
- [ ] 9.5 Store tasks in React state
- [ ] 9.6 Pass tasks to TaskBoard component

## 10. Task Creation Flow

- [ ] 10.1 Add "New Task" button to TasksPage header
- [ ] 10.2 Show TaskForm in modal on button click
- [ ] 10.3 Create modal wrapper component (or reuse existing)
- [ ] 10.4 Handle form submission: POST /api/tasks
- [ ] 10.5 Add new task to local state (optimistic update)
- [ ] 10.6 Close modal on success
- [ ] 10.7 Show success toast "Task {key} created"
- [ ] 10.8 Handle API errors and show error toast

## 11. Task Update Flow

- [ ] 11.1 Implement onTaskMove handler in TasksPage
- [ ] 11.2 Update task status in local state (optimistic)
- [ ] 11.3 Call PATCH /api/tasks/{id} with new status
- [ ] 11.4 Revert local state if API call fails
- [ ] 11.5 Show error toast on failure
- [ ] 11.6 Implement inline edit for task title in TaskCard
- [ ] 11.7 Implement full edit in TaskDetailPanel
- [ ] 11.8 Handle field validation and API errors

## 12. Task Deletion Flow

- [ ] 12.1 Add delete button to TaskCard and TaskDetailPanel
- [ ] 12.2 Show confirmation dialog on delete click
- [ ] 12.3 Call DELETE /api/tasks/{id} on confirmation
- [ ] 12.4 Remove task from local state
- [ ] 12.5 Close detail panel if open
- [ ] 12.6 Show success toast "Task {key} deleted"
- [ ] 12.7 Handle API errors

## 13. Filtering and Search

- [ ] 13.1 Create TaskFilters component with filter dropdowns
- [ ] 13.2 Add assignee filter dropdown (pm, engineer, qa, lead)
- [ ] 13.3 Add priority filter checkboxes (critical, high, medium, low)
- [ ] 13.4 Add type filter (epic, api, backend, frontend, etc.)
- [ ] 13.5 Add search box for key/title/description search
- [ ] 13.6 Implement client-side filtering logic
- [ ] 13.7 Add "Clear filters" button
- [ ] 13.8 Display active filter count badge
- [ ] 13.9 Persist filter preferences to localStorage

## 14. View Mode Toggle

- [ ] 14.1 Create TaskList component (alternative to TaskBoard)
- [ ] 14.2 Display tasks in table/list format
- [ ] 14.3 Add view toggle button (board/list icons)
- [ ] 14.4 Store view preference in localStorage
- [ ] 14.5 Conditionally render TaskBoard or TaskList based on mode
- [ ] 14.6 Ensure all features work in both views

## 15. Sorting

- [ ] 15.1 Add sort dropdown to TasksPage header
- [ ] 15.2 Implement sort by priority (high to low)
- [ ] 15.3 Implement sort by created date (newest first)
- [ ] 15.4 Implement sort by updated date (most recent first)
- [ ] 15.5 Apply sort within each status column in board view
- [ ] 15.6 Apply global sort in list view

## 16. Auto-Key Generation UI

- [ ] 16.1 Display auto-generated key prominently in TaskCard header
- [ ] 16.2 Show key in format "AF-5: Task title"
- [ ] 16.3 Add click-to-copy functionality on task key
- [ ] 16.4 Show toast "Copied AF-5" on copy
- [ ] 16.5 Display key in task creation success toast
- [ ] 16.6 Make key searchable (search by "AF-5" finds task)

## 17. Empty States

- [ ] 17.1 Design empty state for TasksPage when no tasks exist
- [ ] 17.2 Show illustration, message "No tasks yet", and "Create Task" CTA
- [ ] 17.3 Design empty state for filtered results (no matches)
- [ ] 17.4 Show message "No tasks match filters" with "Clear filters" button

## 18. Loading and Error States

- [ ] 18.1 Show loading spinner while fetching tasks
- [ ] 18.2 Show error message if task fetch fails
- [ ] 18.3 Add "Retry" button for failed fetch
- [ ] 18.4 Show skeleton loaders for task cards while loading
- [ ] 18.5 Handle network errors gracefully

## 19. Responsive Design

- [ ] 19.1 Test TaskBoard on tablet (768px) - horizontal scroll
- [ ] 19.2 Test TaskBoard on mobile (375px) - stack columns vertically
- [ ] 19.3 Make TaskForm responsive (full-width on mobile)
- [ ] 19.4 Ensure TaskDetailPanel slides over on mobile
- [ ] 19.5 Add touch-friendly drag-and-drop on mobile
- [ ] 19.6 Test all interactions on touch devices

## 20. Accessibility

- [ ] 20.1 Add ARIA labels to all interactive elements
- [ ] 20.2 Ensure keyboard navigation works (Tab, Enter, Escape)
- [ ] 20.3 Add screen reader announcements for task creation/update/deletion
- [ ] 20.4 Ensure color contrast meets WCAG AA standards
- [ ] 20.5 Test with screen reader (VoiceOver, NVDA)
- [ ] 20.6 Add skip links for keyboard users
- [ ] 20.7 Ensure focus is managed correctly (modal open/close)

## 21. Performance Optimization

- [ ] 21.1 Implement virtual scrolling for columns with 50+ tasks
- [ ] 21.2 Lazy load task details (only fetch on detail panel open)
- [ ] 21.3 Debounce search input (300ms delay)
- [ ] 21.4 Memoize filtered/sorted task arrays with useMemo
- [ ] 21.5 Add loading states for drag-and-drop (prevent double-clicks)

## 22. Testing - Unit Tests

- [ ] 22.1 Test TaskCard rendering with different task data
- [ ] 22.2 Test TaskForm validation logic
- [ ] 22.3 Test TaskBoard grouping tasks by status
- [ ] 22.4 Test filtering logic (assignee, priority, search)
- [ ] 22.5 Test sorting logic
- [ ] 22.6 Test API client functions (getTasks, createTask, etc.)

## 23. Testing - Integration Tests (Playwright)

- [ ] 23.1 Test create task flow: open modal, fill form, verify task appears
- [ ] 23.2 Test drag-and-drop: drag task to new column, verify API called
- [ ] 23.3 Test edit task: click edit, change title, save, verify update
- [ ] 23.4 Test delete task: click delete, confirm, verify removed
- [ ] 23.5 Test filters: apply assignee filter, verify correct tasks shown
- [ ] 23.6 Test search: search by key, verify task found
- [ ] 23.7 Test keyboard navigation: navigate board with keyboard
- [ ] 23.8 Test view toggle: switch between board and list view

## 24. Documentation

- [ ] 24.1 Update component documentation for TaskBoard
- [ ] 24.2 Update component documentation for TaskForm
- [ ] 24.3 Update component documentation for TaskCard
- [ ] 24.4 Document task management workflow in user guide
- [ ] 24.5 Add screenshots to docs
- [ ] 24.6 Update ARCHITECTURE.md with task UI components

## 25. Polish and Edge Cases

- [ ] 25.1 Handle long task titles (truncate with ellipsis)
- [ ] 25.2 Handle long task descriptions (truncate in card, show full in panel)
- [ ] 25.3 Handle tasks with no assignee (show "Unassigned")
- [ ] 25.4 Handle tasks with no priority (default to "medium")
- [ ] 25.5 Handle rapid status changes (debounce API calls)
- [ ] 25.6 Test with 0 tasks, 1 task, 100 tasks
- [ ] 25.7 Test with very long project key (e.g., "VERYLONGPROJECTKEY-1")
