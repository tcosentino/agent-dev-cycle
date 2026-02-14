## ADDED Requirements

### Requirement: Start agent chat session
The system SHALL allow users to start an AI agent chat session for a specific workload.

#### Scenario: User clicks "Ask an Agent" button
- **WHEN** user views workload detail page
- **AND** clicks "Ask an Agent" button
- **THEN** chat modal opens
- **AND** agent session is created
- **AND** welcome message displays with workload context summary

#### Scenario: Welcome message includes context
- **WHEN** agent session starts
- **THEN** welcome message includes workload ID
- **AND** displays current status (running/stopped/failed)
- **AND** displays current stage
- **AND** displays time since started
- **AND** offers to help with questions

#### Scenario: Session creation fails
- **WHEN** agent session creation fails
- **THEN** error message displays "Unable to start agent session"
- **AND** modal closes
- **AND** user can retry

### Requirement: Send messages to agent
The system SHALL allow users to send messages to the agent and receive responses.

#### Scenario: User sends message
- **WHEN** user types message in input field
- **AND** presses Enter or clicks Send button
- **THEN** message is added to chat history as user message
- **AND** input field clears
- **AND** message is sent to API
- **AND** agent typing indicator appears

#### Scenario: Agent responds
- **WHEN** agent processes user message
- **THEN** response streams in real-time via SSE
- **AND** message content appears incrementally
- **AND** typing indicator disappears when complete
- **AND** response is saved to chat history

#### Scenario: Agent uses tools
- **WHEN** agent searches logs or queries workload state
- **THEN** tool usage is transparent to user
- **AND** results are incorporated into agent response
- **AND** agent cites specific log lines or data points

#### Scenario: Send disabled while agent typing
- **WHEN** agent is composing response
- **THEN** input field is disabled
- **AND** send button is disabled
- **AND** typing indicator is visible

### Requirement: Display chat messages
The system SHALL display chat history with proper formatting.

#### Scenario: User messages right-aligned
- **WHEN** user message is displayed
- **THEN** message appears on right side
- **AND** has blue background
- **AND** shows timestamp

#### Scenario: Agent messages left-aligned
- **WHEN** agent message is displayed
- **THEN** message appears on left side
- **AND** has gray background
- **AND** shows timestamp
- **AND** renders markdown formatting

#### Scenario: Code blocks with syntax highlighting
- **WHEN** agent response includes code block
- **THEN** code is syntax highlighted
- **AND** has dark theme styling
- **AND** shows copy button on hover

#### Scenario: Inline code formatting
- **WHEN** agent response includes inline code
- **THEN** code has monospace font
- **AND** has distinct background color

#### Scenario: Auto-scroll to latest message
- **WHEN** new message is added
- **THEN** chat scrolls to bottom automatically
- **AND** shows latest message

### Requirement: Close agent session
The system SHALL allow users to close the chat session.

#### Scenario: User closes modal
- **WHEN** user clicks close button or outside modal
- **THEN** modal closes
- **AND** SSE connection is closed
- **AND** session remains in database for history

#### Scenario: Session timeout
- **WHEN** session is inactive for 30 minutes
- **THEN** session is automatically ended
- **AND** SSE connection is closed
- **AND** status is updated to "ended"

### Requirement: Chat history persistence
The system SHALL persist chat history for retrieval.

#### Scenario: Reload page with active session
- **WHEN** user refreshes page during active chat
- **THEN** chat modal can be reopened
- **AND** full chat history is restored
- **AND** user can continue conversation

#### Scenario: View historical sessions
- **WHEN** user opens agent chat for workload with previous sessions
- **THEN** option to view previous sessions is available
- **AND** clicking shows archived chat history
- **AND** user can start new session

### Requirement: Rate limiting
The system SHALL enforce rate limits to control costs and prevent abuse.

#### Scenario: Maximum sessions per hour exceeded
- **WHEN** user has started 10 sessions in past hour
- **AND** attempts to start another session
- **THEN** error message displays "Rate limit exceeded. Try again later."
- **AND** shows time until next session available

#### Scenario: Maximum messages per session exceeded
- **WHEN** session has 50 messages
- **AND** user attempts to send another message
- **THEN** error message displays "Message limit reached for this session"
- **AND** suggests starting new session

#### Scenario: Maximum concurrent sessions exceeded
- **WHEN** user has 3 active sessions
- **AND** attempts to start another session
- **THEN** error message displays "Too many active sessions"
- **AND** prompts to close an existing session

### Requirement: Error handling
The system SHALL handle errors gracefully.

#### Scenario: API connection failure
- **WHEN** API request fails
- **THEN** error message displays in chat "Connection error. Retrying..."
- **AND** system retries with exponential backoff
- **AND** user can manually retry

#### Scenario: Claude API error
- **WHEN** Claude API returns error
- **THEN** agent responds with "I'm having trouble processing that. Please try again."
- **AND** error is logged for debugging
- **AND** user can send new message

#### Scenario: SSE connection dropped
- **WHEN** SSE connection is lost
- **THEN** system attempts automatic reconnection
- **AND** reconnection indicator is shown
- **AND** chat history is preserved

### Requirement: Access control
The system SHALL restrict access to authorized users.

#### Scenario: User not project member
- **WHEN** user attempts to start agent session
- **AND** is not a member of the workload's project
- **THEN** error message displays "Access denied"
- **AND** session is not created

#### Scenario: Workload does not exist
- **WHEN** user attempts to start agent session
- **AND** workload ID is invalid
- **THEN** error message displays "Workload not found"
- **AND** modal closes
