# Message Data Object

Messages posted by agents and system in channels.

## Fields

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Unique identifier (auto-generated) |
| channelId | uuid | Reference to parent channel |
| projectId | uuid | Reference to parent project |
| type | enum | system, agent, user |
| sender | string | Agent role (pm, engineer, qa, lead) |
| senderName | string | Display name for the sender |
| content | text | Message content |
| actionType | string | Action performed (created, completed, analyzed, etc.) |
| actionStatus | enum | success, error, warning, info |
| actionLabel | string | Summary label for UI display |
| actionSubject | string | Reference to task key or other entity |
| createdAt | date | Creation timestamp (auto-generated) |

## Usage

Agents post messages to communicate progress, blockers, and decisions.

```typescript
import { messageResource } from './message-dataobject'

// Post an agent message
const message = await messageResource.create({
  channelId: 'af-ch-general',
  projectId: 'proj-af',
  type: 'agent',
  sender: 'engineer',
  senderName: 'Engineer Agent',
  content: 'Completed implementation of user authentication',
  actionType: 'completed',
  actionStatus: 'success',
  actionLabel: 'Task completed'
})
```
