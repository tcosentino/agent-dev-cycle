## ADDED Requirements

### Requirement: Global keyboard shortcut registration
The system SHALL provide a mechanism to register and handle global keyboard shortcuts.

#### Scenario: Register keyboard shortcut
- **WHEN** component mounts and requests shortcut registration for Cmd+K
- **THEN** system adds event listener for that key combination

#### Scenario: Prevent default browser behavior
- **WHEN** registered shortcut is triggered
- **THEN** system prevents default browser action (e.g., browser search bar)

#### Scenario: Cleanup on unmount
- **WHEN** component unmounts
- **THEN** system removes event listeners to prevent memory leaks

### Requirement: Cross-platform key handling
The system SHALL handle keyboard shortcuts appropriately across different operating systems.

#### Scenario: Mac uses Cmd modifier
- **WHEN** user is on macOS
- **THEN** shortcuts use Cmd key (metaKey)

#### Scenario: Windows/Linux uses Ctrl modifier
- **WHEN** user is on Windows or Linux
- **THEN** shortcuts use Ctrl key (ctrlKey)

### Requirement: Shortcut conflict prevention
The system SHALL not interfere with native text input operations.

#### Scenario: Shortcuts work outside input fields
- **WHEN** user presses Cmd+K while focused on non-input element
- **THEN** command palette opens

#### Scenario: Shortcuts respect text input context
- **WHEN** user presses Cmd+K while typing in a text input or textarea
- **THEN** shortcut is ignored and text input receives the key event
