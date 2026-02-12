## ADDED Requirements

### Requirement: Stop running workload

The system SHALL allow users to stop a running workload container, releasing all associated resources (ports, containers, work directories) and updating the workload status to 'stopped'.

#### Scenario: Stop running workload via UI

- **WHEN** user clicks "Stop" button on a workload with stage 'running'
- **THEN** system transitions workload to 'graceful-shutdown' stage, stops the container, cleans up resources, and updates workload stage to 'stopped'

#### Scenario: Stop already stopped workload

- **WHEN** user attempts to stop a workload with stage 'stopped'
- **THEN** system returns error with message 'Cannot stop workload: already stopped'

#### Scenario: Stop workload in transitioning state

- **WHEN** user attempts to stop a workload with stage 'starting-container', 'cloning-repo', or 'starting-service'
- **THEN** system disables stop button in UI and returns error if API called directly

### Requirement: Restart workload

The system SHALL allow users to restart a workload, which performs a complete stop and start sequence including repository re-cloning and container rebuild.

#### Scenario: Restart running workload

- **WHEN** user clicks "Restart" button on a workload with stage 'running'
- **THEN** system stops the workload, cleans up resources, then starts a new workload instance with the same configuration

#### Scenario: Restart stopped workload

- **WHEN** user clicks "Restart" button on a workload with stage 'stopped'
- **THEN** system starts a new workload instance with the original deployment configuration

#### Scenario: Restart failed workload

- **WHEN** user clicks "Restart" button on a workload with stage 'failed'
- **THEN** system clears error state and starts a new workload instance

### Requirement: Display contextual controls

The system SHALL display workload control buttons contextually based on the current workload stage, showing only applicable actions.

#### Scenario: Controls for running workload

- **WHEN** workload stage is 'running'
- **THEN** system displays enabled "Stop" and "Restart" buttons

#### Scenario: Controls for stopped workload

- **WHEN** workload stage is 'stopped'
- **THEN** system displays enabled "Restart" button only

#### Scenario: Controls for transitioning workload

- **WHEN** workload stage is 'starting-container', 'cloning-repo', 'starting-service', or 'graceful-shutdown'
- **THEN** system displays all control buttons in disabled state

#### Scenario: Controls for failed workload

- **WHEN** workload stage is 'failed'
- **THEN** system displays enabled "Restart" button only

### Requirement: Real-time control feedback

The system SHALL provide real-time feedback for all control operations via the existing SSE deployment stream, updating workload stage and status for all connected clients.

#### Scenario: Stop operation updates stream

- **WHEN** user stops a workload
- **THEN** system emits 'workload-update' event with stage 'graceful-shutdown', followed by 'stopped' when complete

#### Scenario: Restart operation updates stream

- **WHEN** user restarts a workload
- **THEN** system emits 'workload-update' events for shutdown stages, followed by startup stages (starting-container, cloning-repo, starting-service, running)

#### Scenario: Failed control operation

- **WHEN** a control operation fails (e.g., container timeout)
- **THEN** system emits 'workload-update' event with stage 'failed' and error message

### Requirement: View workload logs

The system SHALL allow users to view complete workload logs, including all stage transitions and messages, in a dedicated log viewer interface.

#### Scenario: Open log viewer for workload

- **WHEN** user clicks "View Logs" button on any workload
- **THEN** system displays modal with formatted logs grouped by stage, showing timestamps and log levels

#### Scenario: Logs update in real-time

- **WHEN** workload is running and generating logs
- **THEN** log viewer updates automatically via SSE events without requiring modal refresh

#### Scenario: View logs for stopped workload

- **WHEN** user opens log viewer for a stopped workload
- **THEN** system displays all historical logs from start to stop
