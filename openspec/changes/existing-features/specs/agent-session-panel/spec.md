## EXISTING Feature: Agent Session Progress Panel

### Requirement: Display session metadata
The system SHALL show key information about the agent session.

#### Scenario: Session header shows agent and phase
- **WHEN** session panel opens
- **THEN** header displays:
  - Agent role (pm, engineer, qa, lead)
  - Project phase (discovery, shaping, building, delivery)
  - Session ID
  - Task prompt (what agent is working on)

#### Scenario: Status badge reflects current state
- **WHEN** session status is "running"
- **THEN** blue badge shows "Running"
- **WHEN** session status is "completed"
- **THEN** green badge shows "Completed"
- **WHEN** session status is "failed"
- **THEN** red badge shows "Failed"
- **WHEN** session status is "pending"
- **THEN** gray badge shows "Pending"

#### Scenario: Session duration is displayed
- **WHEN** session is running
- **THEN** elapsed time is shown and updates (e.g., "2m 34s")
- **WHEN** session is complete
- **THEN** total duration is shown (e.g., "Completed in 5m 12s")

### Requirement: Display progress through stages
The system SHALL show agent progress through predefined execution stages.

#### Scenario: Five stages are displayed vertically
- **WHEN** session panel opens
- **THEN** five stages are shown:
  1. Clone (cloning repository)
  2. Load (loading agent configuration)
  3. Execute (agent working)
  4. Capture (capturing results)
  5. Commit (committing changes)

#### Scenario: Stages show visual status indicators
- **WHEN** stage has not started
- **THEN** stage is shown as "pending" (gray/inactive)
- **WHEN** stage is currently running
- **THEN** stage is shown as "active" (blue, with spinner or animation)
- **WHEN** stage has completed successfully
- **THEN** stage is shown as "complete" (green, with checkmark)
- **WHEN** stage failed
- **THEN** stage is shown as "failed" (red, with X or error icon)

#### Scenario: Active stage updates in real-time
- **GIVEN** session is on "Load" stage
- **WHEN** agent moves to "Execute" stage
- **THEN** "Load" changes to "complete"
- **AND** "Execute" changes to "active"
- **AND** transition happens automatically (no refresh needed)

#### Scenario: Stage duration is displayed after completion
- **WHEN** stage completes
- **THEN** duration is shown next to stage name (e.g., "Clone 1.2s")

### Requirement: Display stage-specific logs
The system SHALL show detailed logs for each execution stage.

#### Scenario: Click stage to view its logs
- **GIVEN** "Execute" stage has logs
- **WHEN** user clicks "Execute" stage
- **THEN** log viewer shows logs specific to Execute stage
- **AND** stage is highlighted as selected

#### Scenario: Stages without logs are not clickable
- **GIVEN** "Capture" stage has no logs yet
- **WHEN** user hovers over "Capture" stage
- **THEN** cursor does not change (not clickable)
- **AND** stage appears disabled/grayed out

#### Scenario: Selected stage remains highlighted
- **GIVEN** user clicked "Clone" stage
- **WHEN** new logs arrive
- **THEN** "Clone" stage remains selected
- **AND** Clone logs continue to be displayed
- **AND** user can click different stage to switch view

### Requirement: Display formatted logs
The system SHALL show session logs with timestamps and log levels.

#### Scenario: Log entries show timestamp, level, and message
- **WHEN** logs are displayed
- **THEN** each log entry shows:
  - Timestamp (HH:MM:SS format)
  - Log level ([INFO], [WARN], [ERROR], [DEBUG])
  - Log message

#### Scenario: Log levels have distinct colors
- **WHEN** log level is ERROR
- **THEN** log entry is styled in red
- **WHEN** log level is WARN
- **THEN** log entry is styled in yellow/orange
- **WHEN** log level is INFO
- **THEN** log entry is styled in default/blue
- **WHEN** log level is DEBUG
- **THEN** log entry is styled in gray

#### Scenario: Long log messages wrap
- **WHEN** log message is longer than panel width
- **THEN** message wraps to multiple lines
- **AND** timestamp and level remain on first line
- **AND** indentation indicates wrapped content

### Requirement: Auto-scroll new logs
The system SHALL automatically scroll to show new logs as they arrive.

#### Scenario: Auto-scroll when at bottom
- **GIVEN** log viewer is scrolled to bottom
- **WHEN** new log arrives
- **THEN** viewer automatically scrolls to show new log
- **AND** smooth scroll animation is used

#### Scenario: Disable auto-scroll when user scrolls up
- **GIVEN** auto-scroll is active
- **WHEN** user scrolls up to view older logs
- **THEN** auto-scroll is disabled
- **AND** new logs arrive without auto-scrolling
- **AND** user can manually scroll

#### Scenario: Re-enable auto-scroll when scrolling to bottom
- **GIVEN** auto-scroll is disabled (user scrolled up)
- **WHEN** user manually scrolls to bottom
- **THEN** auto-scroll re-enables
- **AND** future logs auto-scroll again

### Requirement: Copy logs to clipboard
The system SHALL allow users to copy session logs for sharing or debugging.

#### Scenario: Copy logs button copies all logs
- **WHEN** user clicks "Copy Logs" button
- **THEN** all logs are copied to clipboard in text format
- **AND** format is: `[timestamp] [LEVEL] message` per line
- **AND** toast notification shows "Logs copied!"

#### Scenario: Copy button shows success feedback
- **WHEN** logs are copied successfully
- **THEN** button text changes to "Copied!" briefly (2 seconds)
- **THEN** button reverts to "Copy Logs"

#### Scenario: Copy failure shows error
- **WHEN** clipboard access fails
- **THEN** error toast shows "Failed to copy logs"

### Requirement: Session completion summary
The system SHALL display a summary when session completes.

#### Scenario: Completed session shows summary
- **WHEN** session status is "completed"
- **THEN** summary section displays:
  - Total duration
  - Number of files created/modified
  - Number of commits (if any)
  - Success message

#### Scenario: Failed session shows error summary
- **WHEN** session status is "failed"
- **THEN** error summary displays:
  - Stage where failure occurred
  - Error message (simplified, not full stack trace)
  - Retry button

#### Scenario: Summary shows commit information
- **WHEN** session completed and made commits
- **THEN** commit SHA is displayed (first 7 characters)
- **AND** commit message is shown
- **AND** commit is clickable (links to GitHub if repo configured)

### Requirement: Retry failed sessions
The system SHALL allow retrying failed agent sessions.

#### Scenario: Retry button appears for failed sessions
- **WHEN** session status is "failed"
- **THEN** "Retry" button is visible
- **AND** button is enabled (not disabled)

#### Scenario: Retry button does not appear for completed sessions
- **WHEN** session status is "completed"
- **THEN** "Retry" button is not shown

#### Scenario: Click retry creates new session
- **WHEN** user clicks "Retry" on failed session
- **THEN** loading indicator shows "Creating retry session..."
- **THEN** new session is created with same configuration:
  - Same project, agent, phase
  - Same task prompt
  - Same assigned tasks
- **AND** new session starts automatically
- **AND** UI navigates to new session view

#### Scenario: Retry shows relationship to original session
- **WHEN** retried session is created
- **THEN** new session shows "Retry of [original-session-id]"
- **OR** link to original failed session

### Requirement: Session progress persistence
The system SHALL remember session state across page refreshes.

#### Scenario: Refresh preserves session view
- **GIVEN** user is viewing session progress
- **WHEN** page refreshes
- **THEN** same session is displayed
- **AND** scroll position in logs is restored (approximately)
- **AND** selected stage is restored

### Requirement: Loading and error states
The system SHALL handle loading and error states gracefully.

#### Scenario: Loading state shows spinner
- **WHEN** session data is being fetched
- **THEN** loading spinner is displayed
- **AND** message shows "Loading session..."

#### Scenario: Error state shows helpful message
- **WHEN** session fails to load (404, 500, network error)
- **THEN** error message shows:
  - "Failed to load session"
  - Specific error reason (if available)
  - "Retry" button to refetch

#### Scenario: Session not found shows clear message
- **WHEN** session ID does not exist
- **THEN** message shows "Session not found"
- **AND** option to return to session list

### Requirement: Real-time updates
The system SHALL update session progress in real-time without manual refresh.

#### Scenario: Progress updates automatically
- **GIVEN** session is running
- **WHEN** agent completes a stage
- **THEN** UI updates within 5 seconds (via polling or WebSocket)
- **AND** stage status changes from active to complete
- **AND** next stage becomes active
- **AND** new logs appear

**Note:** Current implementation uses periodic polling. Real-time WebSocket is future enhancement (see PR #9).

### Requirement: Accessibility
The system SHALL ensure session panel is accessible to all users.

#### Scenario: Screen reader announces status changes
- **WHEN** session status changes (running → completed)
- **THEN** screen reader announces "Session completed"
- **AND** ARIA live region is updated

#### Scenario: Keyboard navigation through stages
- **WHEN** stage list has focus
- **AND** user presses Tab
- **THEN** focus moves to next stage
- **WHEN** user presses Enter on focused stage
- **THEN** stage logs are displayed

#### Scenario: Focus management on panel open
- **WHEN** session panel opens
- **THEN** focus moves to panel (not left on background)
- **AND** focus is on first interactive element (close button or first stage)

### Requirement: Panel layout and responsiveness
The system SHALL adapt panel layout to different screen sizes.

#### Scenario: Desktop shows vertical stage list on left
- **WHEN** viewport width ≥ 1024px
- **THEN** stage list is vertical on left side
- **AND** logs are on right side
- **AND** both are visible simultaneously

#### Scenario: Mobile stacks stages above logs
- **WHEN** viewport width < 768px
- **THEN** stages are horizontal across top
- **AND** logs are below stages
- **AND** panel is full-width

#### Scenario: Scrolling is independent
- **WHEN** logs scroll
- **THEN** stage list remains fixed (does not scroll)
- **AND** stage list is always visible

### Requirement: Close panel
The system SHALL allow closing the session panel.

#### Scenario: Close button closes panel
- **WHEN** user clicks close button (X)
- **THEN** panel closes
- **AND** user returns to previous view (project view or session list)

#### Scenario: Escape key closes panel
- **WHEN** panel is open
- **AND** user presses Escape
- **THEN** panel closes

### Requirement: Performance with long logs
The system SHALL handle sessions with thousands of log entries efficiently.

#### Scenario: Virtual scrolling for 1000+ logs
- **GIVEN** session has 1000+ log entries
- **WHEN** logs are displayed
- **THEN** only visible logs are rendered (virtual scrolling)
- **AND** scrolling is smooth (60fps)

**Note:** Current implementation may slow with very long logs. Virtual scrolling is future optimization.

### Requirement: Link to session detail (future)
The system SHOULD provide link to full session detail view.

#### Scenario: View full session link
- **WHEN** panel is displayed
- **THEN** "View Full Session" link is shown
- **WHEN** user clicks link
- **THEN** full session detail page opens
- **AND** shows additional info (commits, file diffs, full transcript)

**Note:** Full detail view not yet implemented.
