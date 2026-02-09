## ADDED Requirements

### Requirement: Display deployment health status
The system SHALL show health status for each deployment.

#### Scenario: Health badge on deployment card
- **WHEN** deployment is running and healthy
- **THEN** green health badge displays "Healthy"
- **WHEN** deployment is running but unhealthy
- **THEN** yellow badge displays "Degraded"
- **WHEN** deployment is stopped or failed
- **THEN** red badge displays "Unavailable"

#### Scenario: Last health check timestamp
- **WHEN** user views deployment details
- **THEN** last health check time is displayed
- **AND** shows "Checked 2 minutes ago"

### Requirement: Health check details
The system SHALL show health check results and history.

#### Scenario: View health check history
- **WHEN** user clicks health badge
- **THEN** health history panel shows recent checks
- **AND** displays timestamp, status, response time

#### Scenario: Health check error details
- **WHEN** health check fails
- **THEN** error message is displayed
- **AND** shows failure reason

### Requirement: Uptime tracking
The system SHALL track and display service uptime.

#### Scenario: Display uptime percentage
- **WHEN** user views deployment
- **THEN** uptime percentage is shown (e.g., "99.8% uptime")

**Note:** Basic implementation in MVP, advanced monitoring deferred to future.
