# Spec: Agent Task CLI

## Overview

The `agentforge` CLI provides agents with the ability to manage tasks and comments during execution. The CLI is pre-installed in agent Docker containers and uses the AgentForge REST API.

## Commands

### Task List
```bash
agentforge task list [--status <status>] [--assignee <agent>]
```

**Behavior**:
- Fetches all tasks for the current project
- Filters by status if `--status` provided (todo, in-progress, done, etc.)
- Filters by assignee if `--assignee` provided
- Displays table with columns: Key, Title, Status, Assignee, Type, Priority

**Example**:
```bash
$ agentforge task list --status todo
Key    Title                    Status  Assignee  Type     Priority
AF-12  Implement dark mode      todo    engineer  feature  high
AF-15  Fix login bug            todo    engineer  bug      critical
```

### Task Get
```bash
agentforge task get <key>
```

**Behavior**:
- Fetches single task by key (e.g., `AF-12`)
- Displays full task details as JSON
- Throws error if task not found

**Example**:
```bash
$ agentforge task get AF-12
{
  "id": "uuid-here",
  "key": "AF-12",
  "title": "Implement dark mode",
  "description": "Add dark mode toggle to settings",
  "status": "todo",
  "assignee": "engineer",
  "type": "feature",
  "priority": "high"
}
```

### Task Create
```bash
agentforge task create "<title>" [options]
```

**Options**:
- `--description <text>` - Task description
- `--type <type>` - Task type (feature, bug, chore, etc.)
- `--priority <priority>` - Priority (low, medium, high, critical)
- `--assignee <agent>` - Assign to agent role

**Behavior**:
- Creates new task with generated key
- Returns created task as JSON
- All fields except title are optional

**Example**:
```bash
$ agentforge task create "Fix login bug" --type bug --priority critical --assignee engineer
{
  "id": "uuid-here",
  "key": "AF-16",
  "title": "Fix login bug",
  "type": "bug",
  "priority": "critical",
  "assignee": "engineer",
  "status": "todo"
}
```

### Task Update
```bash
agentforge task update <key> [options]
```

**Options**:
- `--status <status>` - Update status
- `--title <title>` - Update title
- `--description <text>` - Update description
- `--assignee <agent>` - Reassign task
- `--priority <priority>` - Update priority
- `--type <type>` - Update type

**Behavior**:
- Updates specified fields only (partial update)
- Returns updated task as JSON
- Throws error if task not found

**Example**:
```bash
$ agentforge task update AF-12 --status in-progress --assignee engineer
{
  "id": "uuid-here",
  "key": "AF-12",
  "status": "in-progress",
  "assignee": "engineer"
}
```

### Task Delete
```bash
agentforge task delete <key>
```

**Behavior**:
- Deletes task by key
- Confirms deletion with message
- Throws error if task not found

**Example**:
```bash
$ agentforge task delete AF-12
Deleted task AF-12
```

### Comment List
```bash
agentforge task comment list <key>
```

**Behavior**:
- Lists all comments for a task
- Displays as JSON array
- Shows authorName for agent-created comments

**Example**:
```bash
$ agentforge task comment list AF-12
[
  {
    "id": "uuid-1",
    "taskId": "task-uuid",
    "content": "Started implementation",
    "authorName": "engineer",
    "createdAt": "2026-02-19T12:00:00Z"
  }
]
```

### Comment Add
```bash
agentforge task comment add <key> "<comment text>"
```

**Behavior**:
- Adds comment to task
- Sets `authorName` to current agent role (from `AGENTFORGE_AGENT_ROLE`)
- Returns created comment as JSON

**Example**:
```bash
$ agentforge task comment add AF-12 "Completed dark mode toggle component"
{
  "id": "uuid-here",
  "taskId": "task-uuid",
  "content": "Completed dark mode toggle component",
  "authorName": "engineer",
  "createdAt": "2026-02-19T12:30:00Z"
}
```

### Comment Delete
```bash
agentforge task comment delete <comment-id>
```

**Behavior**:
- Deletes comment by UUID
- Confirms deletion with message

**Example**:
```bash
$ agentforge task comment delete uuid-here
Deleted comment
```

## Environment Variables

The CLI requires these environment variables (automatically set by the runner):

- `AGENTFORGE_SERVER_URL` - API server URL (e.g., `http://host.docker.internal:3000`)
- `AGENTFORGE_PROJECT_ID` - Current project UUID
- `AGENTFORGE_RUN_ID` - Current run/session ID
- `AGENTFORGE_SESSION_ID` - (Optional) Current session UUID
- `AGENTFORGE_AGENT_ROLE` - (Optional) Agent role for comment attribution

## Error Handling

### Task Not Found
```bash
$ agentforge task get AF-999
Error: Task not found: AF-999
```

### Missing Environment Variables
```bash
$ agentforge task list
Error: AGENTFORGE_SERVER_URL not set
```

### API Errors
```bash
$ agentforge task create ""
Error: API request failed: 400 {"error": "Title is required"}
```

## Implementation Notes

### Key Resolution
- CLI accepts human-readable keys (e.g., `AF-12`)
- Internal API uses UUIDs
- `findTaskByKey()` helper fetches all project tasks and finds by key
- Throws error if key not found

### Agent Attribution
- Comments created by agents set `authorName` field
- `userId` is optional (agents have no user UUID)
- Agent role comes from `AGENTFORGE_AGENT_ROLE` env var

### API Client
- Uses `fetch` to call REST API
- Base URL from `AGENTFORGE_SERVER_URL`
- All requests include `Content-Type: application/json`
- Error responses include status code and message
