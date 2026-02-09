## ADDED Requirements

### Requirement: View deployment list
The system SHALL display all deployments for a project with key information.

#### Scenario: Deployments displayed with status
- **WHEN** user views deployment dashboard
- **THEN** all deployments for current project are listed
- **AND** each deployment shows service name, status, created date

#### Scenario: Deployment status badges
- **WHEN** deployment has status "running"
- **THEN** green badge displays "Running"
- **WHEN** deployment has status "stopped"
- **THEN** gray badge displays "Stopped"
- **WHEN** deployment has status "failed"
- **THEN** red badge displays "Failed"

### Requirement: View deployment details
The system SHALL show detailed information for each deployment.

#### Scenario: Click deployment to see details
- **WHEN** user clicks deployment card
- **THEN** detail panel opens showing all deployment fields
- **AND** lists associated workloads

### Requirement: View workload information
The system SHALL display workload details for each deployment.

#### Scenario: Workload list for deployment
- **WHEN** user views deployment details
- **THEN** all workloads for that deployment are listed
- **AND** each workload shows stage, status, container ID, port

### Requirement: Deployment lifecycle controls (future)
The system SHOULD allow starting, stopping, and restarting deployments.

#### Scenario: Start stopped deployment
- **WHEN** user clicks "Start" on stopped deployment
- **THEN** deployment starts and status changes to "running"

#### Scenario: Stop running deployment
- **WHEN** user clicks "Stop" on running deployment
- **THEN** deployment stops and status changes to "stopped"

#### Scenario: Restart deployment
- **WHEN** user clicks "Restart"
- **THEN** deployment stops and immediately starts again

**Note:** Deferred to future - requires runner/infrastructure integration.
