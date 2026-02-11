## ADDED Requirements

### Requirement: Query current workload state
The system SHALL provide an agent tool to retrieve workload state.

#### Scenario: Agent queries workload status
- **WHEN** agent uses get_workload_state tool
- **THEN** current workload status is returned (running/stopped/failed)
- **AND** current stage is returned
- **AND** timestamps (startedAt, stoppedAt) are returned
- **AND** workload ID is returned

#### Scenario: Agent queries deployment info
- **WHEN** agent uses get_workload_state tool
- **THEN** deployment metadata is included
- **AND** includes project ID
- **AND** includes service path
- **AND** includes git branch and commit hash
- **AND** sensitive URLs are redacted

#### Scenario: Workload state changes during chat
- **WHEN** workload transitions to different state
- **AND** agent queries state again
- **THEN** updated state is returned
- **AND** agent can inform user of change

### Requirement: Analyze workload health
The system SHALL enable agent to assess workload health.

#### Scenario: Agent checks if workload is healthy
- **WHEN** agent queries workload state
- **AND** status is "running"
- **AND** stage is "running"
- **THEN** workload is considered healthy
- **AND** agent can confirm to user

#### Scenario: Agent detects unhealthy state
- **WHEN** agent queries workload state
- **AND** status is "failed"
- **OR** stage is "error"
- **THEN** workload is considered unhealthy
- **AND** agent proactively searches logs for errors

#### Scenario: Agent detects graceful shutdown
- **WHEN** agent queries workload state
- **AND** stage is "graceful-shutdown"
- **THEN** agent explains shutdown is normal
- **AND** indicates expected completion time

### Requirement: Compare workload stages
The system SHALL enable agent to understand stage transitions.

#### Scenario: Agent identifies current stage
- **WHEN** agent queries workload state
- **THEN** stage is one of: starting-container, cloning-repo, starting-service, running, graceful-shutdown, stopped
- **AND** agent can explain what that stage means

#### Scenario: Agent explains stage progression
- **WHEN** user asks "what stage is my workload in?"
- **THEN** agent queries current stage
- **AND** explains what that stage involves
- **AND** indicates expected next stages

#### Scenario: Agent detects stuck stage
- **WHEN** workload has been in same stage for extended time
- **AND** user asks about progress
- **THEN** agent identifies potential issue
- **AND** suggests checking logs or restarting

### Requirement: Analyze deployment configuration
The system SHALL enable agent to reference deployment settings.

#### Scenario: Agent identifies service path
- **WHEN** agent queries workload state
- **THEN** deployment service path is available
- **AND** agent can reference which service is deployed

#### Scenario: Agent identifies git branch
- **WHEN** agent queries workload state
- **THEN** git branch and commit hash are available
- **AND** agent can help debug branch-specific issues

#### Scenario: Agent references project context
- **WHEN** agent queries workload state
- **THEN** project ID is available
- **AND** agent can reference project-level settings

### Requirement: Analyze timing information
The system SHALL enable agent to analyze workload timing.

#### Scenario: Agent calculates uptime
- **WHEN** workload is running
- **AND** agent queries workload state
- **THEN** agent can calculate time since startedAt
- **AND** reports uptime to user

#### Scenario: Agent calculates run duration
- **WHEN** workload is stopped
- **AND** agent queries workload state
- **THEN** agent can calculate duration (stoppedAt - startedAt)
- **AND** reports total run time to user

#### Scenario: Agent identifies recent restart
- **WHEN** workload startedAt is within last 5 minutes
- **AND** user reports issues
- **THEN** agent suggests waiting for full startup
- **AND** checks if still in startup stages

### Requirement: Correlate state with logs
The system SHALL enable agent to correlate state and logs.

#### Scenario: Agent combines state and log analysis
- **WHEN** user asks "why did my deployment fail?"
- **THEN** agent queries workload state (sees status=failed)
- **AND** agent searches logs around stoppedAt timestamp
- **AND** identifies error messages near failure time
- **AND** provides comprehensive answer

#### Scenario: Agent identifies state transition
- **WHEN** agent finds "starting service" in logs
- **AND** workload state shows stage="running"
- **THEN** agent confirms successful transition
- **AND** indicates service started successfully

### Requirement: Provide actionable insights
The system SHALL enable agent to suggest actions based on state.

#### Scenario: Agent suggests restart for failed workload
- **WHEN** workload status is "failed"
- **AND** agent identifies recoverable error
- **THEN** agent suggests restarting deployment
- **AND** explains how to do it

#### Scenario: Agent suggests checking logs for errors
- **WHEN** workload is in unexpected state
- **THEN** agent suggests specific log searches
- **AND** performs searches automatically
- **AND** summarizes findings

#### Scenario: Agent confirms normal operation
- **WHEN** workload is healthy and running
- **AND** user asks if everything is ok
- **THEN** agent confirms normal operation
- **AND** cites state and recent logs as evidence

### Requirement: Handle missing or incomplete data
The system SHALL gracefully handle incomplete state information.

#### Scenario: Workload deleted during chat
- **WHEN** agent queries workload state
- **AND** workload no longer exists
- **THEN** agent receives "not found" error
- **AND** informs user workload was deleted
- **AND** suggests ending chat session

#### Scenario: Deployment info unavailable
- **WHEN** agent queries workload state
- **AND** deployment record is missing
- **THEN** agent works with available workload data
- **AND** informs user some context is unavailable

#### Scenario: Timestamps missing
- **WHEN** workload state has null stoppedAt
- **THEN** agent interprets as still running
- **AND** does not calculate end time
