## Why

AgentForge has a robust `task` dataobject with auto-incrementing keys (AF-1, AF-2), priority, status, and assignment tracking, but no UI to create or manage tasks. Users currently must:
- Manually insert tasks via database tools
- Use API endpoints directly (not user-friendly)
- Have no visibility into task status or progress

This makes the task system effectively unusable for actual project management. For dogfooding and production use, we need a full task management UI that rivals tools like Linear, Jira, or GitHub Issues.

## What Changes

Add a complete task management interface with three main capabilities:

### 1. Task CRUD Interface
- Create new tasks with form (title, description, type, priority, assignee)
- Edit existing tasks inline or in modal
- Delete tasks with confirmation
- Auto-generate task keys (AF-1, AF-2, etc.) from project prefix
- Validate required fields and unique constraints

### 2. Task Board View
- Kanban-style board with columns for each status (todo, in-progress, review, done, blocked)
- Drag-and-drop tasks between columns to update status
- Filter by assignee, type, priority
- Sort by priority, created date, updated date
- Compact card view showing key, title, assignee, priority

### 3. Task Detail View
- Full task details with all fields visible
- Edit mode toggle for inline editing
- Link to assigned agent sessions
- Activity history (created, status changes, assignments)
- Quick actions (assign to me, mark done, etc.)

## Capabilities

### New Capabilities
- `task-crud`: Create, read, update, delete tasks
- `task-board`: Kanban board for visual task management
- `auto-key-generation`: Generate task keys from project prefix (AF-1, AF-2)

### Modified Capabilities
- `database-table-view`: Add tasks table to database views
- `project-viewer`: Add "Tasks" tab to main navigation

## Impact

**UI Changes:**
- New `TaskBoard` component with drag-and-drop
- New `TaskForm` component for create/edit
- New `TaskCard` component for board view
- New `TaskDetailPanel` component for full view
- Update `DatabaseTableView` to include tasks table
- Add "Tasks" navigation item in `ProjectViewer`

**API Changes:**
- No new endpoints needed (task dataobject already has full CRUD API)
- May need to extend `POST /api/tasks` to handle auto-key generation validation

**Backend Changes:**
- Auto-key generation already implemented in dataobject
- May need to enhance error messages for unique constraint violations

**No Breaking Changes:**
- All changes are additive
- Existing task API continues to work
- Database schema already supports all fields

## Risks & Mitigations

**[Risk]** Drag-and-drop may be complex to implement accessibly
→ **Mitigation:** Use proven library like `@dnd-kit/core`, ensure keyboard navigation works

**[Risk]** Kanban board could be slow with 100+ tasks
→ **Mitigation:** Virtual scrolling for columns, lazy load task details, filter/search to reduce visible tasks

**[Risk]** Auto-key generation could conflict if multiple users create simultaneously
→ **Mitigation:** Backend handles conflicts via unique constraint, retry with next key number

**[Risk]** Task updates could conflict with agent-generated tasks
→ **Mitigation:** Optimistic locking (future), clear UI indication of conflicts, manual resolution
