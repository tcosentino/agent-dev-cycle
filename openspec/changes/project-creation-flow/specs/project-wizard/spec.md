## ADDED Requirements

### Requirement: Multi-step wizard navigation
The system SHALL guide users through project creation with a clear multi-step flow.

#### Scenario: Wizard opens on "New Project" click
- **WHEN** user clicks "New Project" button
- **THEN** project wizard modal opens
- **AND** shows step 1 of 4: "Project Basics"
- **AND** displays progress indicator (1/4)

#### Scenario: Next button advances to next step
- **WHEN** user completes step 1 fields
- **AND** clicks "Next"
- **THEN** wizard advances to step 2
- **AND** progress indicator updates (2/4)

#### Scenario: Back button returns to previous step
- **WHEN** user is on step 3
- **AND** clicks "Back"
- **THEN** wizard returns to step 2
- **AND** previously entered data is preserved

#### Scenario: Cancel button closes wizard with confirmation
- **WHEN** user clicks "Cancel"
- **THEN** confirmation dialog appears: "Discard project creation?"
- **WHEN** user confirms
- **THEN** wizard closes and no project is created

### Requirement: Step 1 - Project Basics
The system SHALL collect essential project information.

#### Scenario: User enters project name
- **WHEN** user enters project name "Todo App"
- **THEN** project key auto-generates as "TODO"
- **AND** key field updates in real-time

#### Scenario: User customizes project key
- **WHEN** auto-generated key is "TODO"
- **AND** user manually changes it to "TASK"
- **THEN** key is set to "TASK"
- **AND** validation ensures key is unique

#### Scenario: Project key validation
- **WHEN** user enters key "AF"
- **AND** project with key "AF" already exists
- **THEN** error shows "Project key already in use"
- **AND** Next button is disabled

#### Scenario: Description is optional
- **WHEN** user leaves description empty
- **THEN** Next button is still enabled
- **AND** user can proceed to step 2

### Requirement: Step 2 - GitHub Repository
The system SHALL enable connecting or creating a GitHub repository.

#### Scenario: User chooses to connect existing repo
- **WHEN** user selects "Connect Existing Repository"
- **THEN** list of user's GitHub repos appears
- **AND** search box allows filtering repos

#### Scenario: User selects existing repo
- **WHEN** user clicks repo "tcosentino/my-app"
- **THEN** repo is selected
- **AND** URL is displayed
- **AND** Next button is enabled

#### Scenario: User chooses to create new repo
- **WHEN** user selects "Create New Repository"
- **THEN** new repo form appears with:
  - Repository name (pre-filled from project name)
  - Description (optional)
  - Public/Private toggle (default: Private)
  - Initialize with README checkbox

#### Scenario: Create new repo validates name
- **WHEN** user enters repo name with spaces "my app"
- **THEN** error shows "Repository name cannot contain spaces"
- **AND** Next button is disabled

#### Scenario: User skips GitHub integration
- **WHEN** user clicks "Skip (use URL instead)"
- **THEN** manual repo URL field appears
- **WHEN** user enters valid GitHub URL
- **THEN** Next button is enabled

### Requirement: Step 3 - Initial Setup
The system SHALL help users define what to build.

#### Scenario: User describes project in free-form
- **WHEN** user enters "A todo app with priority levels and due dates"
- **THEN** description is captured
- **AND** preview shows "AI will generate PROJECT.md and initial tasks"

#### Scenario: User chooses from templates
- **WHEN** user clicks "Use Template" tab
- **THEN** template cards are displayed:
  - Todo App
  - REST API Server
  - Admin Dashboard
  - React Component Library
- **WHEN** user selects "Todo App"
- **THEN** template description is shown
- **AND** template is marked as selected

#### Scenario: Preview generated project structure
- **WHEN** user is on step 3
- **THEN** preview panel shows:
  - Proposed PROJECT.md outline
  - Suggested first 3-5 tasks
  - Agent roles that will be used

### Requirement: Step 4 - Review and Launch
The system SHALL show summary and initiate first agent session.

#### Scenario: Review project summary
- **WHEN** user reaches step 4
- **THEN** summary is displayed:
  - Project name and key
  - GitHub repo (URL or "New repo will be created")
  - Project description
  - Number of initial tasks to be created

#### Scenario: Edit previous steps from review
- **WHEN** user clicks "Edit" next to "Project Basics"
- **THEN** wizard returns to step 1
- **WHEN** user clicks "Next" through steps
- **THEN** wizard returns to step 4 review

#### Scenario: Create project and start first agent
- **WHEN** user clicks "Create Project & Start Building"
- **THEN** loading indicator shows "Creating project..."
- **THEN** loading shows "Setting up GitHub repository..."
- **THEN** loading shows "Generating PROJECT.md..."
- **THEN** loading shows "Creating initial tasks..."
- **THEN** loading shows "Starting first agent session..."
- **AND** wizard closes
- **AND** user is navigated to new project's agent session view

### Requirement: Progress persistence
The system SHALL save wizard progress to prevent data loss.

#### Scenario: Browser refresh preserves draft
- **GIVEN** user is on step 2 with data entered
- **WHEN** browser refreshes
- **THEN** wizard reopens on step 2
- **AND** all entered data is restored from localStorage

#### Scenario: Draft expires after 24 hours
- **GIVEN** user started wizard 25 hours ago
- **WHEN** user returns to site
- **THEN** wizard draft is cleared (expired)
- **AND** new wizard starts from step 1

### Requirement: Error handling
The system SHALL gracefully handle errors during project creation.

#### Scenario: GitHub API error
- **WHEN** GitHub API fails during repo creation
- **THEN** error message shows "Failed to create repository. Please try again or skip GitHub integration."
- **AND** user can retry or continue with manual URL

#### Scenario: Project creation API error
- **WHEN** project creation API fails
- **THEN** error toast shows specific error message
- **AND** wizard remains open with data preserved
- **AND** user can retry "Create Project"

#### Scenario: Validation errors are highlighted
- **WHEN** user tries to proceed with invalid data
- **THEN** invalid fields are highlighted in red
- **AND** specific error message appears below field
- **AND** focus moves to first invalid field
