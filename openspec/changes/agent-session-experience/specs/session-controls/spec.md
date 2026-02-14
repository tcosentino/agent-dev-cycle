## ADDED Requirements

### Requirement: Cancel running session
The system SHALL allow users to cancel a running agent session and mark it as cancelled.

#### Scenario: User cancels running session from progress panel
- **GIVEN** session is in "running" status
- **WHEN** user clicks "Cancel" button in session progress panel
- **AND** confirms cancellation in dialog
- **THEN** session status changes to "cancelling"
- **AND** API sends cancel signal to runner
- **AND** session transitions to "cancelled" status when runner acknowledges

#### Scenario: User cancels from session list
- **GIVEN** session is running
- **WHEN** user clicks cancel icon in session list
- **AND** confirms in dialog
- **THEN** session is cancelled

#### Scenario: Cancel button disabled when not running
- **WHEN** session status is "completed", "failed", or "cancelled"
- **THEN** cancel button is disabled/hidden

#### Scenario: Cancellation saves partial work
- **GIVEN** session has made partial progress (some tasks completed)
- **WHEN** user cancels session
- **THEN** completed work is preserved
- **AND** session summary shows which tasks were completed

### Requirement: Retry failed session
The system SHALL allow users to retry a failed session with the same configuration.

#### Scenario: User retries failed session
- **GIVEN** session has "failed" status
- **WHEN** user clicks "Retry" button
- **THEN** system creates new session with:
  - Same project, agent, phase
  - Same task prompt
  - Same assigned tasks
  - New session ID and run ID
- **AND** new session starts immediately
- **AND** UI navigates to new session view

#### Scenario: Retry button only shown for failed sessions
- **WHEN** session status is "completed", "running", or "cancelled"
- **THEN** retry button is not displayed
- **WHEN** session status is "failed"
- **THEN** retry button is displayed and enabled

#### Scenario: Retry increments retry count
- **WHEN** user retries a failed session
- **THEN** new session has `retriedFrom` field pointing to original session ID
- **AND** UI shows "Retry 1 of original-session-id"

#### Scenario: Retry limit enforced
- **GIVEN** session has been retried 3 times already
- **WHEN** latest retry fails
- **THEN** retry button is disabled
- **AND** message shows "Maximum retries reached (3)"

### Requirement: Pause running session (future enhancement)
The system SHOULD support pausing and resuming agent sessions.

#### Scenario: User pauses running session
- **GIVEN** session is running
- **WHEN** user clicks "Pause" button
- **THEN** session status changes to "pausing"
- **AND** runner receives pause signal
- **AND** session transitions to "paused" when runner acknowledges
- **AND** "Resume" button becomes available

#### Scenario: User resumes paused session
- **GIVEN** session is paused
- **WHEN** user clicks "Resume" button
- **THEN** session status changes to "resuming"
- **AND** runner receives resume signal
- **AND** session transitions back to "running"

#### Scenario: Pause preserves state
- **GIVEN** session is paused mid-execution
- **WHEN** session resumes
- **THEN** agent continues from exact point where it paused
- **AND** no work is duplicated or lost

**Note:** Pause/resume is marked as future enhancement because it requires runner support for state serialization. Initial implementation focuses on cancel and retry.

### Requirement: Control button visibility and state
The system SHALL display appropriate control buttons based on current session state.

#### Scenario: Running session shows cancel
- **WHEN** session status is "running"
- **THEN** "Cancel" button is visible and enabled
- **AND** other action buttons are hidden

#### Scenario: Failed session shows retry
- **WHEN** session status is "failed"
- **THEN** "Retry" button is visible and enabled
- **AND** cancel button is hidden

#### Scenario: Completed session shows no controls
- **WHEN** session status is "completed"
- **THEN** no action buttons are displayed
- **AND** view is read-only

#### Scenario: Transitional states show loading
- **WHEN** session status is "cancelling", "pausing", "resuming"
- **THEN** relevant button shows loading spinner
- **AND** other buttons are disabled

### Requirement: Confirmation dialogs for destructive actions
The system SHALL require confirmation before executing destructive session operations.

#### Scenario: Cancel confirmation dialog
- **WHEN** user clicks "Cancel" on running session
- **THEN** dialog appears with:
  - Title: "Cancel session?"
  - Message: "This will stop the agent. Completed work will be preserved."
  - Actions: "Cancel Session" (danger), "Keep Running" (secondary)
- **WHEN** user clicks "Cancel Session"
- **THEN** session is cancelled
- **WHEN** user clicks "Keep Running" or closes dialog
- **THEN** dialog closes and session continues

#### Scenario: No confirmation for retry
- **WHEN** user clicks "Retry" on failed session
- **THEN** new session starts immediately without confirmation
- **AND** user can cancel the new session if needed

### Requirement: API endpoints for session control
The system SHALL provide RESTful endpoints for session lifecycle operations.

#### Scenario: POST /api/agentSessions/:id/cancel endpoint
- **WHEN** client sends `POST /api/agentSessions/:id/cancel`
- **THEN** server validates session is in "running" state
- **AND** returns 400 if session is not running
- **AND** updates session status to "cancelling"
- **AND** sends cancel signal to runner
- **AND** returns 200 with updated session object

#### Scenario: POST /api/agentSessions/:id/retry endpoint
- **WHEN** client sends `POST /api/agentSessions/:id/retry`
- **THEN** server validates session is in "failed" state
- **AND** returns 400 if session is not failed
- **AND** creates new session with same configuration
- **AND** returns 201 with new session object

#### Scenario: Control endpoints require authentication
- **WHEN** unauthenticated user calls control endpoint
- **THEN** server returns 401 Unauthorized
- **WHEN** authenticated user calls control endpoint for another user's session
- **THEN** server returns 403 Forbidden (future: multi-user support)
