## Context

The AgentForge UI currently has:
- **Static session viewing** - Users must manually refresh to see updates
- **No execution controls** - Can't pause, cancel, or retry sessions
- **No notification system** - No alerts for important events
- **Limited error handling** - Errors can crash the entire UI

The backend API (`@agentforge/server`) provides:
- RESTful endpoints for agent sessions (`/api/agentSessions`)
- Session dataobject with status tracking
- Agent session integration with runner orchestration

The runner (`runner/`) handles:
- Agent execution via Claude Code CLI
- Git workspace management
- Progress tracking and logging

**Current limitations:**
- Runner has no mechanism to pause/resume (stateless execution)
- No real-time update delivery (polling or WebSocket)
- No retry logic (must manually create new session)
- Error handling is minimal (console logs only)

## Goals / Non-Goals

**Goals:**
- Add real-time session updates via efficient polling (WebSocket is future enhancement)
- Implement cancel and retry controls (pause/resume deferred to future)
- Build reusable toast notification system
- Add error boundaries for graceful failure handling
- Maintain backward compatibility with existing session viewing

**Non-Goals:**
- WebSocket implementation (start with polling, upgrade later)
- Pause/resume support in runner (requires state serialization, deferred)
- Multi-user real-time collaboration (future)
- Notification persistence across page reloads (future)
- Analytics/error tracking service integration (future)

## Decisions

### Decision 1: Polling vs WebSocket for real-time updates
**Choice:** Use HTTP polling (every 3-5 seconds) for initial implementation

**Rationale:**
- Simpler to implement and debug
- No additional infrastructure needed (works with existing REST API)
- Good enough for current scale (typically 1-3 concurrent sessions)
- Easy to upgrade to WebSocket later without changing UI code

**Alternative considered:** Server-Sent Events (SSE) or WebSocket
- Better performance and lower latency
- Requires new server infrastructure
- More complex error handling (connection drops, reconnection)
- Overkill for current usage patterns

**Implementation details:**
- Poll `/api/agentSessions/:id` every 3 seconds while session is running
- Use `useEffect` cleanup to stop polling when component unmounts
- Exponential backoff on errors (3s → 6s → 12s)
- Stop polling when session reaches terminal state (completed, failed, cancelled)

### Decision 2: Cancel implementation approach
**Choice:** Add `POST /api/agentSessions/:id/cancel` endpoint, mark session as cancelled in DB

**Rationale:**
- Cancel is a state transition, not a runtime control
- Runner may have already completed before cancel signal arrives
- Graceful degradation: if runner finished, session still marked cancelled
- No runner modifications needed (runner exits naturally)

**Alternative considered:** Send signal to runner process
- Requires process management (PID tracking)
- Runner must handle signals gracefully
- Risk of orphaned processes
- More complex infrastructure

**Implementation details:**
- API updates session status to "cancelling" → "cancelled"
- If runner is still active, attempt to send SIGTERM (best effort)
- If runner already completed, just mark cancelled in DB
- Session summary shows partial completion

### Decision 3: Retry implementation approach
**Choice:** Create new session with same config, link via `retriedFrom` field

**Rationale:**
- Clean separation: each retry is a distinct session
- Preserves history (can see all retry attempts)
- Simplifies UI (no complex retry state management)
- Enables retry limit enforcement (count retries via `retriedFrom` chain)

**Alternative considered:** Reuse same session ID, increment attempt count
- More compact database (one record vs multiple)
- Harder to track individual retry history
- Complicates session lifecycle state machine

**Implementation details:**
- `POST /api/agentSessions/:id/retry` creates new session with:
  - New ID and runId
  - Same projectId, agent, phase, taskPrompt, assignedTasks
  - `retriedFrom` field pointing to original session ID
- UI follows `retriedFrom` chain to count retries
- Limit: 3 retries max (4 total attempts)

### Decision 4: Notification system architecture
**Choice:** React Context + custom hook (`useNotification`) for global toast management

**Rationale:**
- Centralized state for all notifications
- Components can trigger notifications from anywhere
- Easy to manage queue, auto-dismiss, and stacking
- Aligns with React best practices

**Alternative considered:** Redux or external state management
- Overkill for notification state
- Adds dependency and complexity
- Context is sufficient for this use case

**Implementation details:**
- `NotificationProvider` wraps app root
- `useNotification()` hook returns `{ showNotification, dismissNotification }`
- `ToastContainer` component renders active toasts (top-right corner)
- Max 3 visible toasts, FIFO queue for overflow
- Preferences stored in localStorage

### Decision 5: Error boundary granularity
**Choice:** Add error boundaries at two levels: (1) App root, (2) Major panels (session panel, file tree, etc.)

**Rationale:**
- App-level boundary catches catastrophic errors (prevents blank screen)
- Panel-level boundaries isolate failures (rest of app keeps working)
- User can recover from panel errors without full reload

**Alternative considered:** Error boundary per component
- Too granular, creates complexity
- Many components don't need isolation
- Harder to provide meaningful recovery UI

**Implementation details:**
- `AppErrorBoundary` wraps `<ProjectViewer />`
  - Shows full-page error with "Reload" button
- `PanelErrorBoundary` wraps major panels
  - Shows panel-level error with "Retry Panel" button
  - Rest of UI continues working

### Decision 6: Session status state machine
**Choice:** Extend session status enum to include transitional states

**Current states:** `running`, `completed`, `failed`

**New states:** `cancelling`, `cancelled`, `paused` (future), `resuming` (future)

**Rationale:**
- Explicit transitional states improve UX (show loading spinners)
- Makes state machine explicit and testable
- Prevents race conditions (can't cancel a cancelling session)

**State transitions:**
```
running → cancelling → cancelled
running → completed
running → failed
failed → (new session via retry)
```

**Future (pause/resume):**
```
running → pausing → paused
paused → resuming → running
```

## Architecture

### Component Changes

**New Components:**
- `NotificationProvider` (context provider)
- `ToastContainer` (renders toast stack)
- `Toast` (individual notification)
- `ErrorBoundary` (reusable error boundary)
- `ConfirmDialog` (confirmation modal for cancel)

**Modified Components:**
- `AgentSessionProgressPanel`
  - Add control buttons (Cancel, Retry)
  - Connect to real-time updates via polling hook
  - Display transitional states (cancelling, etc.)
- `AgentSessionList`
  - Add inline control buttons
  - Real-time status badge updates
- `useAgentSessionProgress` hook
  - Add polling logic
  - Handle errors gracefully
- `ProjectViewer`
  - Wrap in `AppErrorBoundary`
  - Provide `NotificationProvider`

### API Changes

**New Routes:**
- `POST /api/agentSessions/:id/cancel` - Cancel running session
- `POST /api/agentSessions/:id/retry` - Retry failed session
- *(Future) `POST /api/agentSessions/:id/pause`* - Pause running session
- *(Future) `POST /api/agentSessions/:id/resume`* - Resume paused session

**Modified Dataobject:**
- `agent-session-dataobject`
  - Add status: `cancelling`, `cancelled`, `paused`, `resuming`
  - Add field: `retriedFrom` (string, nullable, references another session ID)
  - Add field: `retryCount` (integer, default 0)

### Backend Integration Changes

**Agent Session Integration (`agent-session-integration`):**
- Implement cancel/retry route handlers
- Add retry count validation
- Link retried sessions via `retriedFrom`

**Runner (future enhancement):**
- Handle SIGTERM for graceful cancellation
- *(Future)* Implement state checkpointing for pause/resume

## Data Flow

### Real-time Updates Flow
```
UI Component
    ↓ (mount)
useAgentSessionProgress hook
    ↓ (starts polling)
setInterval(3000ms)
    ↓
GET /api/agentSessions/:id
    ↓
Compare current state vs new state
    ↓ (if changed)
Update React state
    ↓
UI re-renders with new progress
```

### Cancel Flow
```
User clicks "Cancel"
    ↓
Confirmation dialog appears
    ↓ (user confirms)
Optimistic UI update (status = "cancelling")
    ↓
POST /api/agentSessions/:id/cancel
    ↓ (API handler)
Update session status to "cancelling"
Send SIGTERM to runner (best effort)
Update session status to "cancelled"
    ↓
Return updated session
    ↓
UI confirms cancellation (via polling or immediate update)
Show success toast
```

### Retry Flow
```
User clicks "Retry" on failed session
    ↓
POST /api/agentSessions/:id/retry
    ↓ (API handler)
Validate session is "failed"
Validate retry count < 3
Clone session config (project, agent, phase, taskPrompt)
Create new session with retriedFrom = original ID
Start new session execution
    ↓
Return new session
    ↓
UI navigates to new session view
Show info toast "Session retried"
```

### Notification Flow
```
Event occurs (session completed, error, etc.)
    ↓
Component calls useNotification().showNotification(...)
    ↓
NotificationContext adds to queue
    ↓
ToastContainer re-renders
    ↓
Toast appears (animated slide-in)
    ↓ (if auto-dismiss)
setTimeout(durationMs)
    ↓
Toast removed (animated slide-out)
Next queued toast appears (if any)
```

## Risks / Trade-offs

**[Risk]** Polling every 3 seconds creates unnecessary API load
→ **Mitigation:** Only poll active sessions, stop when terminal state reached, reduce frequency when tab inactive

**[Risk]** Cancel may not reach runner in time (already completed)
→ **Acceptable:** Mark as cancelled anyway, UX is clear that cancel is best-effort

**[Risk]** Retry could create infinite loops if bug causes persistent failures
→ **Mitigation:** Hard limit of 3 retries, require manual retry (no auto-retry)

**[Risk]** Too many notifications annoy users
→ **Mitigation:** Sensible defaults (only critical events), easy to disable in settings

**[Trade-off]** Polling increases server load vs WebSocket's better performance
→ **Acceptable:** Current scale supports polling, can upgrade later without UI changes

**[Trade-off]** No pause/resume in MVP
→ **Acceptable:** Cancel + retry covers most use cases, pause/resume can be added when runner supports it

**[Trade-off]** Notifications lost on page reload
→ **Acceptable:** Transient notifications don't need persistence, important events have persistent UI (failed sessions, etc.)

## Testing Strategy

**Unit Tests:**
- `useNotification` hook behavior (queue management, auto-dismiss)
- Error boundary rendering and recovery
- Session control API endpoint validation

**Integration Tests (Playwright):**
- Real-time updates: Start session, verify UI updates within 5 seconds
- Cancel flow: Click cancel, verify confirmation dialog, verify session cancelled
- Retry flow: Retry failed session, verify new session created
- Notification display: Trigger event, verify toast appears and dismisses

**Manual Testing:**
- Long-running session: verify polling doesn't cause memory leaks
- Network failure: verify graceful degradation and error notifications
- Concurrent sessions: verify all update correctly
- Accessibility: verify screen reader announces notifications, keyboard navigation works

## Future Enhancements

1. **WebSocket for real-time updates** - Lower latency, better scalability
2. **Pause/resume support** - Requires runner state checkpointing
3. **Notification history** - Persistent log of past notifications
4. **Notification grouping** - Combine similar notifications ("3 sessions completed")
5. **Desktop notifications** - Browser Notification API for background alerts
6. **Error analytics** - Send errors to Sentry or similar service
7. **Rate limiting** - Prevent retry spam
