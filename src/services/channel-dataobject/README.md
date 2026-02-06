# Channel Data Object

Communication channels where agents post updates and discuss work.

## Fields

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Unique identifier (auto-generated) |
| projectId | uuid | Reference to parent project |
| name | string | Channel name (e.g., 'general', 'engineering') |
| createdAt | date | Creation timestamp (auto-generated) |

## Usage

Each project has default channels created automatically. Agents post messages to channels to communicate progress and blockers.

```typescript
import { channelResource } from './channel-dataobject'

// Create a new channel
const channel = await channelResource.create({
  projectId: 'proj-af',
  name: 'engineering'
})
```
