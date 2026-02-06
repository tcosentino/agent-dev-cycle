# Session Data Object

Records of agent execution sessions.

## Fields

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Unique identifier (auto-generated) |
| projectId | uuid | Reference to parent project |
| runId | string | Unique run identifier (e.g., 'pm-001') |
| agent | enum | pm, engineer, qa, lead |
| phase | enum | shaping, building, stabilizing |
| summary | text | Summary of what was accomplished |
| startedAt | date | Session start time (auto-generated) |
| completedAt | date | Session completion time |

## Usage

Sessions track when agents run and what they accomplish.

```typescript
import { sessionResource } from './session-dataobject'

// Start a new session
const session = await sessionResource.create({
  projectId: 'proj-af',
  runId: 'eng-004',
  agent: 'engineer',
  phase: 'building'
})

// Complete the session
await sessionResource.update(session.id, {
  summary: 'Implemented authentication endpoints',
  completedAt: new Date()
})
```
