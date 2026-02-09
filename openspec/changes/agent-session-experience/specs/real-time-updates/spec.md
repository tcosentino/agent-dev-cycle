## ADDED Requirements

### Requirement: Automatic session progress updates
The system SHALL automatically update the UI when an agent session's progress changes, without requiring manual refresh.

#### Scenario: User sees live progress updates
- **GIVEN** an agent session is running
- **AND** user is viewing the session progress panel
- **WHEN** agent completes a task step
- **THEN** progress bar and step list update automatically within 5 seconds

#### Scenario: User sees session completion
- **GIVEN** an agent session is running
- **AND** user is viewing the session list
- **WHEN** agent completes the session
- **THEN** session status changes from "running" to "completed" automatically
- **AND** completion time is displayed

#### Scenario: Multiple users see same updates
- **GIVEN** two users viewing the same session
- **WHEN** session progress updates
- **THEN** both users' UIs update within 5 seconds of each other

### Requirement: Live activity indicators
The system SHALL display visual indicators showing current agent activity state.

#### Scenario: Running indicator displays
- **WHEN** session status is "running"
- **THEN** session panel shows animated spinner or pulse indicator
- **AND** status badge shows "In Progress"

#### Scenario: Idle vs active states
- **GIVEN** session is running
- **WHEN** agent is actively executing (writing files, running commands)
- **THEN** activity indicator shows "active" state with animation
- **WHEN** agent is waiting (thinking, API call)
- **THEN** activity indicator shows "thinking" state

#### Scenario: Activity indicator stops on completion
- **WHEN** session completes or fails
- **THEN** activity animation stops
- **AND** final status is displayed (checkmark for success, X for failure)

### Requirement: Update delivery mechanism
The system SHALL deliver updates via polling or server-sent events with graceful degradation.

#### Scenario: Polling mode for updates
- **WHEN** WebSocket is unavailable
- **THEN** system polls `/api/agentSessions/:id` every 3 seconds while session is active
- **AND** stops polling when session is not running

#### Scenario: Efficient polling - no updates when inactive
- **WHEN** no sessions are running
- **THEN** polling is paused
- **WHEN** user navigates away from session view
- **THEN** polling continues but at reduced frequency (every 10s)

#### Scenario: Optimistic updates for user actions
- **WHEN** user triggers an action (pause, cancel)
- **THEN** UI updates immediately (optimistic)
- **AND** reverts if API call fails

### Requirement: Session list real-time updates
The system SHALL update the session list view when any session's status changes.

#### Scenario: New session appears in list
- **WHEN** a new session starts
- **THEN** it appears at the top of the session list within 5 seconds

#### Scenario: Session status changes in list
- **WHEN** any session's status changes (running → completed, failed, etc.)
- **THEN** the session list item updates its status badge and metadata

#### Scenario: Active session count updates
- **WHEN** number of active sessions changes
- **THEN** header shows updated count "3 active sessions"

### Requirement: Performance and resource management
The system SHALL manage real-time updates efficiently to avoid performance degradation.

#### Scenario: Polling stops when component unmounts
- **WHEN** user navigates away from session view
- **THEN** active polling intervals are cleared
- **AND** no memory leaks occur

#### Scenario: Stale data handling
- **WHEN** API returns data older than current UI state
- **THEN** UI ignores the stale update
- **AND** continues showing most recent data

#### Scenario: Error handling in polling
- **WHEN** API poll fails (network error, 500)
- **THEN** system retries up to 3 times with exponential backoff
- **AND** shows error notification if all retries fail
- **AND** continues polling other sessions
