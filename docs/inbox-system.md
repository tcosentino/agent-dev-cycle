# Inbox System

An inbox that surfaces items needing human attention, separate from the full chat activity stream.

## Concept

Inspired by sports management games where coaches/staff send you actionable items while the match plays out. When you return after hours away, you want curated "things that need your attention" - not to scroll through activity logs.

**Two parallel views:**
- **Chat/Activity Feed** - Full history of what's happening (agent thoughts, tool calls, progress)
- **Inbox** - Curated items that need human attention or decision

## Data Model

```typescript
type InboxItemStatus = 'unread' | 'read'

type InboxItemType =
  | 'question'      // Agent needs clarification
  | 'approval'      // Decision needs sign-off
  | 'error'         // Something went wrong
  | 'milestone'     // Notable completion worth reviewing
  | 'warning'       // Potential issue flagged
  | 'fyi'           // Informational, no action needed

interface InboxItem {
  id: string
  type: InboxItemType
  title: string
  content: string
  sender: AgentRole
  timestamp: number
  status: InboxItemStatus

  // Context links
  taskRef?: string
  messageRef?: string

  // Response handling
  response?: string       // User's text reply
  respondedAt?: number
}
```

## Interaction Model

1. **Agents send to inbox** - Not everything goes here, only things worth surfacing
2. **Read/unread tracking** - Like email, items are unread until opened
3. **Text replies** - User can respond directly, reply goes back to agent context
4. **Context linking** - Can jump to related chat message or task

## Example Inbox Items

| Type | Example |
|------|---------|
| question | "Need clarification: Should user auth use JWT or sessions?" |
| milestone | "API integration complete - ready for review" |
| error | "Build failed: TypeScript errors in auth module" |
| warning | "Found 3 potential security issues in dependencies" |
| fyi | "Deployed staging build successfully" |

## UI Considerations

- Unread count badge visible from main workspace
- Filtering by type or status
- Bulk mark-as-read
- Layout TBD (tabs, side panel, or drawer)

## Async Workflow

This enables an async workflow where you can:
1. Kick off agent work
2. Leave for a while
3. Return and work through your inbox
4. Reply to questions, approve decisions, acknowledge milestones
5. Agents continue with your responses
