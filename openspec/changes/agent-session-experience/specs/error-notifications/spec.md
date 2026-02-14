## ADDED Requirements

### Requirement: Toast notification system
The system SHALL display toast notifications for important events and user actions.

#### Scenario: Success notification for session start
- **WHEN** agent session starts successfully
- **THEN** green toast appears with message "Agent session started: [session-id]"
- **AND** toast auto-dismisses after 4 seconds
- **AND** toast includes link to "View Session"

#### Scenario: Success notification for session completion
- **WHEN** agent session completes successfully
- **THEN** green toast appears with "Session completed: [session-id]"
- **AND** includes summary "5 tasks completed in 12m 34s"
- **AND** toast persists until manually dismissed

#### Scenario: Error notification for session failure
- **WHEN** agent session fails
- **THEN** red toast appears with "Session failed: [session-id]"
- **AND** includes error summary
- **AND** includes "Retry" button in toast
- **AND** toast persists until manually dismissed

#### Scenario: Info notification for user actions
- **WHEN** user cancels a session
- **THEN** blue info toast shows "Session cancelled"
- **AND** auto-dismisses after 3 seconds

#### Scenario: Multiple notifications stack
- **WHEN** multiple events occur in quick succession
- **THEN** toasts stack vertically (max 3 visible)
- **AND** older toasts auto-dismiss to make room for new ones
- **AND** dismiss queue follows FIFO (oldest dismissed first)

### Requirement: Toast notification types and styling
The system SHALL provide distinct visual styles for different notification types.

#### Scenario: Success toast styling
- **WHEN** success toast displays
- **THEN** background is green
- **AND** includes checkmark icon
- **AND** text is white

#### Scenario: Error toast styling
- **WHEN** error toast displays
- **THEN** background is red
- **AND** includes X icon or alert triangle
- **AND** text is white

#### Scenario: Info toast styling
- **WHEN** info toast displays
- **THEN** background is blue
- **AND** includes info icon
- **AND** text is white

#### Scenario: Warning toast styling
- **WHEN** warning toast displays
- **THEN** background is yellow/orange
- **AND** includes warning icon
- **AND** text is dark

### Requirement: Notification preferences
The system SHALL allow users to configure notification behavior.

#### Scenario: User disables session completion notifications
- **GIVEN** user opens settings
- **WHEN** user toggles "Notify on session completion" to off
- **THEN** preference is saved to localStorage
- **AND** future session completions do not show toast
- **AND** other notification types still appear

#### Scenario: User sets notification duration
- **GIVEN** user is in settings
- **WHEN** user sets "Auto-dismiss duration" to 6 seconds
- **THEN** auto-dismissing toasts stay visible for 6 seconds
- **AND** preference persists across sessions

#### Scenario: Default notification preferences
- **WHEN** user has not customized preferences
- **THEN** defaults are:
  - Session start: enabled, 4s auto-dismiss
  - Session complete: enabled, persist until dismissed
  - Session failed: enabled, persist until dismissed
  - User actions (cancel, retry): enabled, 3s auto-dismiss

### Requirement: Error boundaries for graceful failure handling
The system SHALL catch React errors and display recovery UI instead of blank screen.

#### Scenario: Component error caught by boundary
- **GIVEN** an error occurs in ProjectViewer component
- **WHEN** error is thrown during render
- **THEN** error boundary catches it
- **AND** displays fallback UI with:
  - Error message
  - "Reload Page" button
  - "Report Issue" link
- **AND** logs error to console
- **AND** sends error to analytics (future)

#### Scenario: Error boundary at session panel level
- **GIVEN** error in AgentSessionProgressPanel
- **WHEN** error occurs
- **THEN** only session panel shows error UI
- **AND** rest of application continues working
- **AND** user can reload just that panel

#### Scenario: User recovers from error
- **WHEN** user clicks "Reload Page" in error boundary
- **THEN** page refreshes
- **AND** application attempts to restore previous state from localStorage

#### Scenario: Error details shown in dev mode
- **WHEN** error boundary catches error
- **AND** app is in development mode
- **THEN** full error stack trace is displayed
- **WHEN** app is in production
- **THEN** generic error message is shown without stack

### Requirement: Critical failure alerts
The system SHALL display modal alerts for critical failures requiring immediate attention.

#### Scenario: API connection lost alert
- **WHEN** API becomes unreachable (multiple failed requests)
- **THEN** modal alert appears with:
  - Title: "Connection Lost"
  - Message: "Unable to reach server. Check your connection."
  - Actions: "Retry Connection", "Reload Page"
- **AND** polling/requests are paused

#### Scenario: Authentication expired alert
- **WHEN** API returns 401 (session expired)
- **THEN** modal alert shows "Session expired. Please log in again."
- **AND** user is redirected to login after dismiss

#### Scenario: Critical error in runner
- **WHEN** agent session fails with critical error (out of memory, crash)
- **THEN** modal alert shows error details
- **AND** includes "Download Logs" button
- **AND** includes "Report Bug" link

### Requirement: Notification provider context
The system SHALL provide a React context for managing notifications application-wide.

#### Scenario: Component triggers notification via context
- **GIVEN** component has access to NotificationContext
- **WHEN** component calls `showNotification({ type: 'success', message: 'Saved!' })`
- **THEN** toast appears at top-right of screen
- **AND** notification is added to queue

#### Scenario: Notification queue management
- **WHEN** 5 notifications are triggered rapidly
- **THEN** first 3 are displayed immediately
- **AND** remaining 2 are queued
- **AND** queue processes as earlier toasts dismiss

#### Scenario: Programmatic dismiss
- **WHEN** component calls `dismissNotification(notificationId)`
- **THEN** specified toast is removed from display
- **AND** next queued notification appears (if any)

### Requirement: Accessibility for notifications
The system SHALL ensure notifications are accessible to screen readers and keyboard users.

#### Scenario: Screen reader announces notification
- **WHEN** notification appears
- **THEN** screen reader announces message with appropriate role (alert, status)
- **AND** notification type is conveyed ("Error:", "Success:")

#### Scenario: Keyboard dismiss
- **WHEN** notification has focus
- **AND** user presses Escape
- **THEN** notification is dismissed

#### Scenario: Focus management
- **WHEN** notification with action button appears
- **AND** no other modal is open
- **THEN** focus moves to notification action button
- **WHEN** notification is dismissed
- **THEN** focus returns to previously focused element
