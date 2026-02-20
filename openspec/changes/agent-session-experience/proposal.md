## Why

When agents are executing tasks, users need real-time visibility into progress, the ability to control execution (pause, resume, cancel, retry), and immediate notification of errors or critical events. Currently, the UI requires manual refresh to see updates, provides no execution controls, and lacks a notification system—making it impossible to monitor or manage long-running agent sessions effectively.

This severely limits dogfooding and production use. Users can't:
- Know when an agent completes a task without checking manually
- Stop a runaway agent that's going in the wrong direction
- Retry a failed session without re-creating it
- Get alerted to critical failures that need immediate attention

## What Changes

Add three interconnected capabilities to transform agent session monitoring from static to dynamic:

### 1. Real-time Session Updates
- Automatic UI updates when agent makes progress (no manual refresh)
- Live activity indicators showing current agent state
- Progress streaming via WebSocket or polling
- Optimistic UI updates for instant feedback

### 2. Agent Session Controls
- **Pause** - Temporarily halt agent execution
- **Resume** - Continue paused session
- **Cancel** - Stop and mark session as cancelled
- **Retry** - Re-run failed session with same configuration
- Control buttons in session panel and session list

### 3. Error Handling & Notifications
- Toast notifications for events (session started, completed, failed)
- Error boundaries with recovery options
- Alert system for critical failures
- Notification preferences (enable/disable by type)
- Visual error states in UI

## Capabilities

### New Capabilities
- `real-time-updates`: Live session progress via WebSocket/polling
- `session-controls`: Pause, resume, cancel, retry operations
- `error-notifications`: Toast system + error boundaries

### Modified Capabilities
- `agent-session-panel`: Enhanced with controls and live updates
- `agent-session-list`: Add control buttons and real-time status

## Impact

**UI Changes:**
- `AgentSessionProgressPanel` - Add control buttons, connect to real-time updates
- `AgentSessionList` - Add inline controls, live status badges
- `useAgentSessionProgress` hook - WebSocket/polling integration
- New `NotificationProvider` context for toast system
- New `ErrorBoundary` component for graceful error handling

**API Changes:**
- `agent-session-integration` routes:
  - `POST /api/agentSessions/:id/pause` - Pause execution
  - `POST /api/agentSessions/:id/resume` - Resume execution
  - `POST /api/agentSessions/:id/cancel` - Cancel execution
  - `POST /api/agentSessions/:id/retry` - Retry failed session
  - `GET /api/agentSessions/:id/stream` - SSE/WebSocket endpoint (or extend polling)

**Backend Changes:**
- Runner must support pause/resume/cancel signals
- Session state machine: `running → paused → running | cancelled`
- Retry logic: clone failed session, create new session with same config

**No Breaking Changes:**
- All changes are additive
- Existing session viewing still works
- New features are opt-in (users can ignore controls)

## Risks & Mitigations

**[Risk]** Pause/resume may be hard to implement in Claude Code runner
→ **Mitigation:** Start with cancel/retry (easier), add pause/resume as enhancement if feasible

**[Risk]** WebSocket infrastructure adds complexity
→ **Mitigation:** Use simple polling (every 2-5s) first, upgrade to WebSocket later if needed

**[Risk]** Too many notifications could annoy users
→ **Mitigation:** Sensible defaults (only critical events), easy toggle in settings

**[Risk]** Retry could create infinite loops
→ **Mitigation:** Track retry count, limit to 3 retries max, require user confirmation
