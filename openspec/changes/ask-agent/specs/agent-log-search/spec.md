## ADDED Requirements

### Requirement: Search logs by keywords
The system SHALL provide an agent tool to search workload logs.

#### Scenario: Agent searches for single keyword
- **WHEN** agent uses search_logs tool with keyword "error"
- **THEN** all log lines containing "error" are returned
- **AND** maximum 50 results returned by default
- **AND** results include timestamp, line number, and content

#### Scenario: Agent searches for multiple keywords
- **WHEN** agent uses search_logs tool with keywords ["error", "failed"]
- **THEN** log lines containing either "error" OR "failed" are returned
- **AND** results are deduplicated
- **AND** sorted by timestamp descending (newest first)

#### Scenario: No matching logs found
- **WHEN** agent searches for keyword with no matches
- **THEN** empty result set is returned
- **AND** agent informs user "No logs found matching that criteria"

### Requirement: Filter logs by time range
The system SHALL allow agent to filter logs by time range.

#### Scenario: Search logs after specific time
- **WHEN** agent uses search_logs with startTime parameter
- **THEN** only logs after that timestamp are searched
- **AND** results are within specified time range

#### Scenario: Search logs before specific time
- **WHEN** agent uses search_logs with endTime parameter
- **THEN** only logs before that timestamp are searched
- **AND** results are within specified time range

#### Scenario: Search logs within time window
- **WHEN** agent uses search_logs with both startTime and endTime
- **THEN** only logs between those timestamps are searched
- **AND** results are within specified window

#### Scenario: Invalid time range
- **WHEN** agent provides startTime after endTime
- **THEN** error message "Invalid time range" is returned
- **AND** no search is performed

### Requirement: Limit search results
The system SHALL allow agent to control result size.

#### Scenario: Default result limit
- **WHEN** agent searches without specifying limit
- **THEN** maximum 50 results are returned
- **AND** agent is informed of total matches if more exist

#### Scenario: Custom result limit
- **WHEN** agent specifies limit parameter (e.g., 100)
- **THEN** maximum that many results are returned
- **AND** limit is capped at 500 for performance

#### Scenario: Limit exceeds available results
- **WHEN** agent requests limit of 100
- **AND** only 20 matching logs exist
- **THEN** all 20 results are returned
- **AND** no error or padding occurs

### Requirement: Log search performance
The system SHALL perform log searches efficiently.

#### Scenario: Search completes quickly
- **WHEN** agent searches large log file (10,000+ lines)
- **THEN** results are returned within 2 seconds
- **AND** search does not block other operations

#### Scenario: Search timeout
- **WHEN** search takes longer than 10 seconds
- **THEN** search is cancelled
- **AND** partial results are returned with timeout warning
- **AND** agent informs user of timeout

### Requirement: Log content formatting
The system SHALL return properly formatted log results.

#### Scenario: Log line includes metadata
- **WHEN** logs are returned to agent
- **THEN** each result includes timestamp
- **AND** includes line number
- **AND** includes full log content
- **AND** preserves original formatting

#### Scenario: Multi-line log entries
- **WHEN** log entry spans multiple lines (e.g., stack trace)
- **THEN** entire entry is returned as single result
- **AND** line breaks are preserved
- **AND** indentation is maintained

#### Scenario: Special characters in logs
- **WHEN** logs contain special characters or ANSI codes
- **THEN** characters are properly escaped
- **AND** ANSI color codes are stripped
- **AND** content is readable

### Requirement: Search security
The system SHALL protect sensitive information in logs.

#### Scenario: Sensitive data redacted
- **WHEN** logs contain passwords, tokens, or API keys
- **THEN** values are redacted in search results
- **AND** replaced with "***"
- **AND** keys remain visible (e.g., "password=***")

#### Scenario: Environment variables protected
- **WHEN** logs contain environment variable values
- **THEN** sensitive variables are redacted
- **AND** non-sensitive variables are visible
- **AND** redaction is consistent

### Requirement: Search query validation
The system SHALL validate search parameters.

#### Scenario: Empty keywords rejected
- **WHEN** agent provides empty keywords array
- **THEN** error message "Keywords required" is returned
- **AND** no search is performed

#### Scenario: Keywords too short
- **WHEN** agent provides keyword less than 2 characters
- **THEN** warning is returned
- **AND** search proceeds but may return many results

#### Scenario: Keywords too long
- **WHEN** agent provides keyword over 100 characters
- **THEN** error message "Keyword too long" is returned
- **AND** no search is performed

### Requirement: Search context
The system SHALL provide surrounding context for matches.

#### Scenario: Context lines before match
- **WHEN** keyword is found in logs
- **THEN** 2 lines before match are included (if available)
- **AND** marked as context lines

#### Scenario: Context lines after match
- **WHEN** keyword is found in logs
- **THEN** 2 lines after match are included (if available)
- **AND** marked as context lines

#### Scenario: Overlapping context
- **WHEN** multiple matches are close together
- **THEN** context is merged
- **AND** no duplicate lines are shown
