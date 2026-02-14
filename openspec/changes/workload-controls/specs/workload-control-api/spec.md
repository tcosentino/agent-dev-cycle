## ADDED Requirements

### Requirement: Stop workload endpoint

The system SHALL provide a REST API endpoint `POST /api/deployments/:deploymentId/workloads/:workloadId/stop` that stops a running workload and returns the updated workload state.

#### Scenario: Successful stop request

- **WHEN** client sends POST to `/api/deployments/:deploymentId/workloads/:workloadId/stop` for a running workload
- **THEN** system stops the workload and returns 200 with JSON `{ success: true, workloadId: string, stage: 'stopped' }`

#### Scenario: Stop non-running workload

- **WHEN** client sends POST to `/api/deployments/:deploymentId/workloads/:workloadId/stop` for a stopped workload
- **THEN** system returns 400 with JSON `{ error: 'InvalidState', message: 'Cannot stop workload: already stopped', workloadId: string, currentStage: string }`

#### Scenario: Stop non-existent workload

- **WHEN** client sends POST to `/api/deployments/:deploymentId/workloads/:workloadId/stop` with invalid workloadId
- **THEN** system returns 404 with JSON `{ error: 'NotFound', message: 'Workload not found' }`

### Requirement: Restart workload endpoint

The system SHALL provide a REST API endpoint `POST /api/deployments/:deploymentId/workloads/:workloadId/restart` that restarts a workload (stop + start sequence) and returns the new workload state.

#### Scenario: Successful restart request

- **WHEN** client sends POST to `/api/deployments/:deploymentId/workloads/:workloadId/restart` for any workload
- **THEN** system restarts the workload and returns 200 with JSON `{ success: true, workloadId: string, stage: string }`

#### Scenario: Restart during transition

- **WHEN** client sends POST to `/api/deployments/:deploymentId/workloads/:workloadId/restart` while workload is in 'starting-container', 'cloning-repo', or 'starting-service' stage
- **THEN** system returns 409 with JSON `{ error: 'Conflict', message: 'Cannot restart workload: operation in progress', workloadId: string, currentStage: string }`

#### Scenario: Restart non-existent workload

- **WHEN** client sends POST to `/api/deployments/:deploymentId/workloads/:workloadId/restart` with invalid workloadId
- **THEN** system returns 404 with JSON `{ error: 'NotFound', message: 'Workload not found' }`

### Requirement: Get workload logs endpoint

The system SHALL provide a REST API endpoint `GET /api/deployments/:deploymentId/workloads/:workloadId/logs` that returns complete workload logs with stage grouping and metadata.

#### Scenario: Fetch logs for existing workload

- **WHEN** client sends GET to `/api/deployments/:deploymentId/workloads/:workloadId/logs`
- **THEN** system returns 200 with JSON array of log entries `[{ timestamp: string, stage: string, message: string, level: string }]`

#### Scenario: Fetch logs for non-existent workload

- **WHEN** client sends GET to `/api/deployments/:deploymentId/workloads/:workloadId/logs` with invalid workloadId
- **THEN** system returns 404 with JSON `{ error: 'NotFound', message: 'Workload not found' }`

#### Scenario: Fetch logs with no entries

- **WHEN** client sends GET to `/api/deployments/:deploymentId/workloads/:workloadId/logs` for a workload with no logs
- **THEN** system returns 200 with empty JSON array `[]`

### Requirement: API authentication and authorization

The system SHALL require valid authentication for all workload control endpoints and verify that the user has access to the specified deployment's project.

#### Scenario: Authenticated request with project access

- **WHEN** authenticated client with project access calls any workload control endpoint
- **THEN** system processes the request normally

#### Scenario: Unauthenticated request

- **WHEN** unauthenticated client calls any workload control endpoint
- **THEN** system returns 401 with JSON `{ error: 'Unauthorized', message: 'Authentication required' }`

#### Scenario: Authenticated request without project access

- **WHEN** authenticated client without project access calls any workload control endpoint
- **THEN** system returns 403 with JSON `{ error: 'Forbidden', message: 'Access denied to this project' }`

### Requirement: Concurrent operation protection

The system SHALL prevent concurrent control operations on the same workload by implementing operation locking, ensuring only one control operation executes at a time per workload.

#### Scenario: Sequential control requests

- **WHEN** client sends stop request, waits for completion, then sends restart request
- **THEN** system processes both requests successfully

#### Scenario: Concurrent control requests

- **WHEN** client sends multiple control requests for the same workload simultaneously
- **THEN** system processes first request and returns 409 Conflict for subsequent requests with message 'Operation already in progress'

#### Scenario: Lock released after completion

- **WHEN** control operation completes (success or failure)
- **THEN** system releases operation lock and allows new control requests
