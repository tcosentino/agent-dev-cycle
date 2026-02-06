# Task Data Object

Represents work items that agents create and complete.

## Fields

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Unique identifier (auto-generated) |
| projectId | uuid | Reference to parent project |
| key | string | Human-readable key (e.g., 'AF-1') |
| title | string | Task title |
| description | text | Detailed description |
| type | enum | epic, api, backend, frontend, testing, documentation, devops |
| priority | enum | critical, high, medium, low |
| status | enum | todo, in-progress, review, done, blocked |
| assignee | string | Agent role assigned to this task |
| createdAt | date | Creation timestamp (auto-generated) |
| updatedAt | date | Last update timestamp (auto-generated) |

## Usage

Tasks are created by PM agents and worked on by other agents.

```typescript
import { taskResource } from './task-dataobject'

// Create a new task
const task = await taskResource.create({
  projectId: 'proj-af',
  key: 'AF-1',
  title: 'Implement user authentication',
  type: 'backend',
  priority: 'high',
  assignee: 'engineer'
})

// Update task status
await taskResource.update(task.id, { status: 'in-progress' })
```
