## 1. Backend: Extend Agent Session Dataobject

- [ ] 1.1 Add new status values to agentSessionStatusEnum: 'cancelling', 'cancelled', 'paused', 'resuming'
- [ ] 1.2 Add retriedFrom field to schema (string, optional, uuid reference)
- [ ] 1.3 Add retryCount field to schema (integer, default 0)
- [ ] 1.4 Run database migration to add new columns
- [ ] 1.5 Update TypeScript types for new fields

## 2. Backend: Implement Session Control API Endpoints

- [ ] 2.1 Add POST /api/agentSessions/:id/cancel route
- [ ] 2.2 Validate session is in 'running' state, return 400 if not
- [ ] 2.3 Update session status to 'cancelling', then 'cancelled'
- [ ] 2.4 (Optional) Send SIGTERM to runner process if available
- [ ] 2.5 Return updated session object with 200 status
- [ ] 2.6 Add POST /api/agentSessions/:id/retry route
- [ ] 2.7 Validate session is in 'failed' state, return 400 if not
- [ ] 2.8 Check retry count via retriedFrom chain, enforce max 3 retries
- [ ] 2.9 Clone session configuration (projectId, agent, phase, taskPrompt, assignedTasks)
- [ ] 2.10 Create new session with retriedFrom = original session ID
- [ ] 2.11 Increment retryCount in new session
- [ ] 2.12 Start new session execution
- [ ] 2.13 Return new session object with 201 status
- [ ] 2.14 Add error handling for invalid session IDs (404)
- [ ] 2.15 Add authentication checks (future: multi-user)

## 3. Frontend: Notification System - Core Components

- [ ] 3.1 Create NotificationProvider context in packages/ui-components/src/context/
- [ ] 3.2 Define notification types (success, error, info, warning)
- [ ] 3.3 Implement notification queue state management
- [ ] 3.4 Add showNotification function to context
- [ ] 3.5 Add dismissNotification function to context
- [ ] 3.6 Implement auto-dismiss logic with configurable duration
- [ ] 3.7 Create useNotification hook for easy consumption
- [ ] 3.8 Create Toast component in packages/ui-components/src/components/
- [ ] 3.9 Add CSS module for Toast (slide-in/out animations)
- [ ] 3.10 Style toast variants (success=green, error=red, info=blue, warning=yellow)
- [ ] 3.11 Add icons for each toast type (checkmark, X, info, warning)
- [ ] 3.12 Create ToastContainer component
- [ ] 3.13 Limit visible toasts to 3, queue overflow
- [ ] 3.14 Position ToastContainer at top-right of viewport
- [ ] 3.15 Add dismiss button (X) to each toast
- [ ] 3.16 Implement FIFO queue processing

## 4. Frontend: Notification System - Preferences

- [ ] 4.1 Create notification preferences schema
- [ ] 4.2 Add localStorage persistence for preferences
- [ ] 4.3 Add settings UI in SettingsPage for notification toggles
- [ ] 4.4 Add auto-dismiss duration setting (2-10 seconds)
- [ ] 4.5 Set sensible defaults (completion=persist, start=4s, cancel=3s)
- [ ] 4.6 Wire preferences to NotificationProvider

## 5. Frontend: Error Boundaries

- [ ] 5.1 Create ErrorBoundary component in packages/ui-components/src/components/
- [ ] 5.2 Implement componentDidCatch to catch render errors
- [ ] 5.3 Create error fallback UI with error message, reload button, report link
- [ ] 5.4 Show stack trace in development mode only
- [ ] 5.5 Log errors to console
- [ ] 5.6 Create AppErrorBoundary wrapper for ProjectViewer
- [ ] 5.7 Create PanelErrorBoundary for major panels
- [ ] 5.8 Add "Reload Panel" vs "Reload Page" recovery options
- [ ] 5.9 Test error boundary by throwing test error

## 6. Frontend: Real-time Updates - Polling Hook

- [ ] 6.1 Create useAgentSessionPolling custom hook
- [ ] 6.2 Accept sessionId and enabled flag as parameters
- [ ] 6.3 Set up polling interval (3 seconds for active sessions)
- [ ] 6.4 Call GET /api/agentSessions/:id on interval
- [ ] 6.5 Compare fetched data with current state, only update if changed
- [ ] 6.6 Stop polling when session reaches terminal state (completed, failed, cancelled)
- [ ] 6.7 Reduce polling frequency when tab is inactive (10 seconds)
- [ ] 6.8 Implement exponential backoff on API errors (3s → 6s → 12s)
- [ ] 6.9 Cleanup interval on unmount to prevent memory leaks
- [ ] 6.10 Return session data and loading/error states

## 7. Frontend: Real-time Updates - UI Integration

- [ ] 7.1 Update useAgentSessionProgress hook to use polling
- [ ] 7.2 Add polling to AgentSessionProgressPanel
- [ ] 7.3 Show live activity indicator (spinner/pulse) when session is running
- [ ] 7.4 Update progress bar and step list automatically
- [ ] 7.5 Add polling to AgentSessionList for status badge updates
- [ ] 7.6 Display "In Progress", "Completed", "Failed", "Cancelled" badges
- [ ] 7.7 Update active session count in list header
- [ ] 7.8 Add subtle animation to indicate live updates

## 8. Frontend: Session Controls - UI Components

- [ ] 8.1 Create ConfirmDialog component for cancel confirmation
- [ ] 8.2 Add "Cancel" button to AgentSessionProgressPanel
- [ ] 8.3 Show confirm dialog on cancel click
- [ ] 8.4 Add "Retry" button for failed sessions
- [ ] 8.5 Add control buttons to AgentSessionList inline actions
- [ ] 8.6 Disable buttons based on session state (cancel only if running)
- [ ] 8.7 Show loading spinner on buttons during API calls (cancelling, retrying)
- [ ] 8.8 Display transitional states ("Cancelling...", "Starting retry...")

## 9. Frontend: Session Controls - API Integration

- [ ] 9.1 Create cancelSession API function in api.ts
- [ ] 9.2 Create retrySession API function in api.ts
- [ ] 9.3 Wire cancel button to POST /api/agentSessions/:id/cancel
- [ ] 9.4 Implement optimistic UI update for cancel (immediate status change)
- [ ] 9.5 Revert optimistic update if API call fails
- [ ] 9.6 Wire retry button to POST /api/agentSessions/:id/retry
- [ ] 9.7 Navigate to new session view after successful retry
- [ ] 9.8 Show error toast if cancel/retry fails
- [ ] 9.9 Show success toast after cancel/retry completes

## 10. Frontend: Notification Triggers

- [ ] 10.1 Show notification when session starts (green toast, 4s auto-dismiss)
- [ ] 10.2 Show notification when session completes (green toast, persist, link to view)
- [ ] 10.3 Show notification when session fails (red toast, persist, retry button in toast)
- [ ] 10.4 Show notification when user cancels session (blue toast, 3s)
- [ ] 10.5 Show notification when session is retried (blue toast, 3s)
- [ ] 10.6 Show notification on API connection errors (red toast, persist, retry button)
- [ ] 10.7 Respect user preferences for each notification type

## 11. Frontend: Accessibility

- [ ] 11.1 Add ARIA role="alert" to error toasts
- [ ] 11.2 Add ARIA role="status" to info/success toasts
- [ ] 11.3 Ensure toasts are announced by screen readers
- [ ] 11.4 Add keyboard navigation (Tab, Escape to dismiss)
- [ ] 11.5 Manage focus when toast with action appears
- [ ] 11.6 Return focus to previous element when toast dismisses
- [ ] 11.7 Add alt text to notification icons
- [ ] 11.8 Ensure error boundary fallback UI is keyboard accessible

## 12. Testing: Unit Tests

- [ ] 12.1 Test NotificationProvider queue management
- [ ] 12.2 Test auto-dismiss timing
- [ ] 12.3 Test FIFO queue overflow handling
- [ ] 12.4 Test useNotification hook
- [ ] 12.5 Test ErrorBoundary error catching and fallback rendering
- [ ] 12.6 Test useAgentSessionPolling hook logic
- [ ] 12.7 Test cancel API endpoint (valid and invalid states)
- [ ] 12.8 Test retry API endpoint (valid and invalid states, retry limit)

## 13. Testing: Integration Tests (Playwright)

- [ ] 13.1 Test real-time updates: start session, verify UI updates within 5s
- [ ] 13.2 Test cancel flow: click cancel, confirm dialog, verify session cancelled
- [ ] 13.3 Test retry flow: retry failed session, verify new session created
- [ ] 13.4 Test notification display: trigger event, verify toast appears
- [ ] 13.5 Test notification auto-dismiss timing
- [ ] 13.6 Test notification stacking (multiple toasts)
- [ ] 13.7 Test error boundary: trigger error, verify fallback UI
- [ ] 13.8 Test polling cleanup: unmount component, verify no memory leaks
- [ ] 13.9 Test concurrent sessions: verify all update independently

## 14. Documentation

- [ ] 14.1 Update AgentSessionProgressPanel component documentation
- [ ] 14.2 Document notification system API (showNotification, dismissNotification)
- [ ] 14.3 Document session control API endpoints in API docs
- [ ] 14.4 Add notification preferences to user guide
- [ ] 14.5 Document error boundary usage for future components
- [ ] 14.6 Update ARCHITECTURE.md with notification and error handling flows

## 15. Polish and Edge Cases

- [ ] 15.1 Handle case where session completes while cancel is in-flight
- [ ] 15.2 Handle retry count validation edge cases (circular retriedFrom)
- [ ] 15.3 Test notification preferences with localStorage full/unavailable
- [ ] 15.4 Ensure polling doesn't hammer API when network is slow
- [ ] 15.5 Test notification queue with rapid-fire events (10+ in 1 second)
- [ ] 15.6 Verify cancel confirmation dialog can't be triggered multiple times
- [ ] 15.7 Test retry with malformed/missing session config
- [ ] 15.8 Add loading states for initial session fetch
