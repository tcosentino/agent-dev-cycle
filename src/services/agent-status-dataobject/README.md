# Agent Status Data Object

Tracks the current state of each agent in a project.

## Fields

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Unique identifier (auto-generated) |
| projectId | uuid | Reference to parent project |
| role | enum | pm, engineer, qa, lead |
| status | enum | active, away, busy |
| currentTask | string | Task key being worked on (optional) |
| lastActiveAt | date | Last activity timestamp |

## Usage

Agent status is updated when agents start/stop working on tasks.

```typescript
import { agentStatusResource } from './agent-status-dataobject'

// Update agent to active with current task
await agentStatusResource.update(statusId, {
  status: 'active',
  currentTask: 'AF-2',
  lastActiveAt: new Date()
})

// Mark agent as away
await agentStatusResource.update(statusId, {
  status: 'away',
  currentTask: null
})
```
