# Agent Creation Spec

## ADDED Requirements

### Requirement: Create new agent via UI
The system SHALL allow users to create new agents through a guided UI flow.

#### Scenario: User creates agent with default template
**ID:** `agent-creation-001`
**Priority:** critical
**Test Status:** ❌ uncovered

- **WHEN** user clicks "New Agent" button in agents sidebar
- **THEN** modal opens with agent creation form
- **AND** agent name field is empty and focused
- **AND** prompt editor shows starter template
- **AND** template includes sections: Role, Responsibilities, Guidelines, Context, Tools, Communication Style
- **WHEN** user enters name "code-reviewer"
- **AND** edits prompt to customize Role section
- **AND** clicks "Create Agent" button
- **THEN** modal shows loading state
- **THEN** agent file is created at `agents/code-reviewer.md`
- **AND** file contains customized prompt
- **AND** changes are committed with message "Add code-reviewer agent"
- **AND** modal closes
- **AND** success notification appears "Agent 'code-reviewer' created"
- **AND** agents pane reloads
- **AND** new agent appears in agents list

#### Scenario: User customizes all sections
**ID:** `agent-creation-002`
**Priority:** high
**Test Status:** ❌ uncovered

- **GIVEN** user has opened Create Agent modal
- **WHEN** user enters name "test-writer"
- **AND** selects type "qa" from dropdown
- **AND** edits Role section
- **AND** edits Responsibilities section
- **AND** edits Guidelines section
- **AND** adds custom Context section
- **AND** clicks "Create Agent"
- **THEN** agent file contains all customized sections
- **AND** agent appears in list with "qa" type indicator

#### Scenario: User removes optional sections
**ID:** `agent-creation-003`
**Priority:** medium
**Test Status:** ❌ uncovered

- **GIVEN** user has opened Create Agent modal with starter template
- **WHEN** user deletes Tools section from template
- **AND** deletes Communication Style section
- **AND** keeps only Role and Responsibilities
- **AND** clicks "Create Agent"
- **THEN** agent file contains only Role and Responsibilities sections
- **AND** agent is created successfully

### Requirement: Validate agent name
The system SHALL validate agent names to prevent errors.

#### Scenario: Prevent empty agent name
**ID:** `agent-creation-004`
**Priority:** critical
**Test Status:** ❌ uncovered

- **GIVEN** user has opened Create Agent modal
- **WHEN** user leaves name field empty
- **AND** clicks "Create Agent"
- **THEN** form shows error "Agent name is required"
- **AND** modal remains open
- **AND** no agent file is created

#### Scenario: Prevent invalid characters in name
**ID:** `agent-creation-005`
**Priority:** high
**Test Status:** ❌ uncovered

- **GIVEN** user has opened Create Agent modal
- **WHEN** user enters name "Code Reviewer!" (with spaces and special chars)
- **AND** clicks "Create Agent"
- **THEN** form shows error "Agent name can only contain lowercase letters, numbers, hyphens, and underscores"
- **AND** modal remains open

#### Scenario: Convert uppercase to lowercase
**ID:** `agent-creation-006`
**Priority:** medium
**Test Status:** ❌ uncovered

- **GIVEN** user enters name "CodeReviewer"
- **WHEN** user tabs out of name field
- **THEN** name is automatically converted to "codereviewer"
- **OR** suggestion shown "Did you mean 'code-reviewer'?"

#### Scenario: Prevent duplicate agent names
**ID:** `agent-creation-007`
**Priority:** high
**Test Status:** ❌ uncovered

- **GIVEN** agent "code-reviewer" already exists in project
- **WHEN** user enters name "code-reviewer"
- **AND** clicks "Create Agent"
- **THEN** form shows error "Agent 'code-reviewer' already exists"
- **AND** suggests "code-reviewer-2" as alternative
- **AND** modal remains open

### Requirement: Handle Git operations
The system SHALL commit agent files to the project repository.

#### Scenario: Successful commit
**ID:** `agent-creation-008`
**Priority:** critical
**Test Status:** ❌ uncovered

- **GIVEN** user has filled valid agent form
- **WHEN** user clicks "Create Agent"
- **THEN** system creates file at `agents/{name}.md`
- **AND** system commits with message "Add {name} agent"
- **AND** commit succeeds
- **AND** modal closes with success notification

#### Scenario: Git commit fails
**ID:** `agent-creation-009`
**Priority:** high
**Test Status:** ❌ uncovered

- **GIVEN** user has filled valid agent form
- **AND** Git repository has permission issues
- **WHEN** user clicks "Create Agent"
- **THEN** system attempts to commit
- **AND** commit fails with error
- **THEN** modal shows error "Failed to commit agent: {error message}"
- **AND** provides retry button
- **AND** provides "Save Manually" option with file content for copy/paste

### Requirement: Reload agents list
The system SHALL refresh the agents list after creation.

#### Scenario: New agent appears in list
**ID:** `agent-creation-010`
**Priority:** critical
**Test Status:** ❌ uncovered

- **GIVEN** agents list shows 3 agents
- **WHEN** user successfully creates new agent "test-writer"
- **THEN** agents pane reloads
- **AND** agents list shows 4 agents
- **AND** "test-writer" appears in the list
- **AND** new agent is selectable

#### Scenario: Newly created agent is auto-selected
**ID:** `agent-creation-011`
**Priority:** low
**Test Status:** ❌ uncovered

- **GIVEN** user creates new agent "code-reviewer"
- **WHEN** modal closes after successful creation
- **THEN** agents pane reloads
- **AND** "code-reviewer" is automatically selected
- **AND** agent prompt is displayed in content pane

### Requirement: Handle modal interactions
The system SHALL manage modal state and user interactions properly.

#### Scenario: Cancel button closes modal without creating
**ID:** `agent-creation-012`
**Priority:** high
**Test Status:** ❌ uncovered

- **GIVEN** user has opened Create Agent modal
- **AND** entered agent name
- **WHEN** user clicks "Cancel" button
- **THEN** modal closes
- **AND** no agent file is created
- **AND** agents list remains unchanged

#### Scenario: Warn on unsaved changes
**ID:** `agent-creation-013`
**Priority:** medium
**Test Status:** ❌ uncovered

- **GIVEN** user has opened Create Agent modal
- **AND** edited the prompt template
- **WHEN** user clicks X button or clicks outside modal
- **THEN** confirmation dialog appears "You have unsaved changes. Discard changes?"
- **WHEN** user clicks "Discard"
- **THEN** modal closes without creating agent
- **WHEN** user clicks "Keep Editing"
- **THEN** modal remains open with edits intact

#### Scenario: ESC key closes modal
**ID:** `agent-creation-014`
**Priority:** low
**Test Status:** ❌ uncovered

- **GIVEN** user has opened Create Agent modal
- **AND** prompt has not been edited
- **WHEN** user presses ESC key
- **THEN** modal closes without warning

### Requirement: Provide starter template
The system SHALL provide a useful starter template with recommended structure.

#### Scenario: Template includes all recommended sections
**ID:** `agent-creation-015`
**Priority:** high
**Test Status:** ❌ uncovered

- **WHEN** user opens Create Agent modal
- **THEN** prompt editor contains template with sections:
  - `# {Agent Name}`
  - `## Role`
  - `## Responsibilities`
  - `## Guidelines`
  - `## Context`
  - `## Tools`
  - `## Communication Style`
- **AND** each section has placeholder text or example content

#### Scenario: Template name placeholder updates
**ID:** `agent-creation-016`
**Priority:** low
**Test Status:** ❌ uncovered

- **GIVEN** user has opened Create Agent modal
- **WHEN** user enters name "code-reviewer"
- **THEN** template header updates from `# {Agent Name}` to `# Code Reviewer`
- **AND** Role section updates to include agent name

### Requirement: Support agent types
The system SHALL allow users to optionally specify agent type.

#### Scenario: Select agent type from dropdown
**ID:** `agent-creation-017`
**Priority:** medium
**Test Status:** ❌ uncovered

- **GIVEN** user has opened Create Agent modal
- **WHEN** user clicks type dropdown
- **THEN** dropdown shows options:
  - Architect
  - Engineer
  - QA
  - Lead
  - PM
  - Designer
  - DevOps
  - (blank/none)
- **WHEN** user selects "Engineer"
- **AND** creates agent
- **THEN** agent metadata includes `type: "engineer"`

#### Scenario: Agent type is optional
**ID:** `agent-creation-018`
**Priority:** medium
**Test Status:** ❌ uncovered

- **GIVEN** user has opened Create Agent modal
- **WHEN** user leaves type dropdown blank
- **AND** creates agent
- **THEN** agent is created successfully without type
- **AND** agent appears in list without type indicator

### Requirement: Handle edge cases
The system SHALL handle edge cases gracefully.

#### Scenario: Very long agent prompt
**ID:** `agent-creation-019`
**Priority:** low
**Test Status:** ❌ uncovered

- **GIVEN** user enters prompt with 40,000 characters
- **WHEN** user clicks "Create Agent"
- **THEN** agent file is created with full content
- **AND** no truncation occurs

#### Scenario: Special characters in prompt
**ID:** `agent-creation-020`
**Priority:** medium
**Test Status:** ❌ uncovered

- **GIVEN** user enters prompt with emoji, Unicode, code blocks
- **WHEN** user creates agent
- **THEN** file is saved with UTF-8 encoding
- **AND** special characters are preserved

#### Scenario: Agents directory doesn't exist
**ID:** `agent-creation-021`
**Priority:** high
**Test Status:** ❌ uncovered

- **GIVEN** project repo has no `agents/` directory
- **WHEN** user creates first agent
- **THEN** system creates `agents/` directory
- **AND** creates agent file inside it
- **AND** commits both directory and file

## Performance Requirements

### Requirement: Fast agent creation
Agent creation should complete quickly to maintain good UX.

**Targets:**
- Modal opens in < 100ms
- Form validation in < 50ms  
- File creation + commit in < 2 seconds
- Agents list reload in < 500ms

## Accessibility Requirements

### Requirement: Keyboard navigation
All form controls must be keyboard accessible.

- Tab navigates through form fields in logical order
- Enter submits form (creates agent)
- ESC closes modal (with unsaved changes warning)
- Name field is auto-focused on modal open

### Requirement: Screen reader support
Form must be usable with screen readers.

- All form fields have proper labels
- Error messages are announced
- Loading states are announced
- Success notification is announced
