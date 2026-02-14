# Project Settings Spec

## ADDED Requirements

### Requirement: Access project settings
The system SHALL provide a dedicated settings page for project configuration.

#### Scenario: User opens settings page
**ID:** `settings-001`
**Priority:** critical
**Test Status:** ❌ uncovered

- **WHEN** user clicks "Settings" button in ProjectViewer
- **THEN** navigates to `/project/:projectId/settings`
- **AND** settings page loads with multi-tab layout
- **AND** "General" tab is selected by default
- **AND** current project metadata is displayed

#### Scenario: User navigates between settings tabs
**ID:** `settings-002`
**Priority:** high
**Test Status:** ❌ uncovered

- **GIVEN** settings page is open on General tab
- **WHEN** user clicks "Runtime" tab
- **THEN** Runtime tab becomes active
- **AND** Runtime settings form is displayed
- **AND** URL updates to `/project/:projectId/settings?tab=runtime`

#### Scenario: Settings button visible in project view
**ID:** `settings-003`
**Priority:** high
**Test Status:** ❌ uncovered

- **GIVEN** user has a project selected
- **WHEN** viewing ProjectViewer
- **THEN** "Settings" button/menu item is visible
- **AND** clicking it navigates to settings page

### Requirement: Update project name
The system SHALL allow users to rename projects.

#### Scenario: User renames project successfully
**ID:** `settings-004`
**Priority:** critical
**Test Status:** ❌ uncovered

- **GIVEN** project named "MyProject" exists
- **AND** user is on General settings tab
- **WHEN** user edits project name to "SuperApp"
- **AND** clicks "Save Changes"
- **THEN** form shows loading state
- **THEN** project name updates in database
- **AND** success notification shows "Project renamed to 'SuperApp'"
- **AND** project name updates throughout UI (sidebar, header, breadcrumbs)
- **AND** form becomes pristine (no unsaved changes)

#### Scenario: Prevent duplicate project names
**ID:** `settings-005`
**Priority:** high
**Test Status:** ❌ uncovered

- **GIVEN** project named "ExistingProject" exists
- **AND** user is renaming different project
- **WHEN** user changes name to "ExistingProject"
- **AND** clicks "Save Changes"
- **THEN** form shows error "Project with name 'ExistingProject' already exists"
- **AND** suggests alternative name "ExistingProject-2"
- **AND** form remains in edit mode with error displayed

#### Scenario: Validate project name format
**ID:** `settings-006`
**Priority:** high
**Test Status:** ❌ uncovered

- **GIVEN** user is editing project name
- **WHEN** user enters empty name
- **AND** clicks "Save Changes"
- **THEN** form shows error "Project name is required"
- **WHEN** user enters name > 100 characters
- **THEN** form shows error "Project name must be 100 characters or less"

#### Scenario: Unsaved changes warning
**ID:** `settings-007`
**Priority:** medium
**Test Status:** ❌ uncovered

- **GIVEN** user has edited project name
- **AND** form is dirty (unsaved changes)
- **WHEN** user clicks browser back button or navigates away
- **THEN** confirmation dialog appears "You have unsaved changes. Discard changes?"
- **WHEN** user clicks "Discard"
- **THEN** navigates away without saving
- **WHEN** user clicks "Stay"
- **THEN** remains on settings page with edits intact

### Requirement: Update project description
The system SHALL allow users to edit project descriptions.

#### Scenario: User updates project description
**ID:** `settings-008`
**Priority:** high
**Test Status:** ❌ uncovered

- **GIVEN** project has description "Old description"
- **WHEN** user edits description to "New description explaining the project"
- **AND** clicks "Save Changes"
- **THEN** description updates successfully
- **AND** success notification appears
- **AND** updated description is visible in project metadata

#### Scenario: Description is optional
**ID:** `settings-009`
**Priority:** medium
**Test Status:** ❌ uncovered

- **GIVEN** project has a description
- **WHEN** user clears description field
- **AND** clicks "Save Changes"
- **THEN** description is removed (set to null/empty)
- **AND** save succeeds without error

#### Scenario: Validate description length
**ID:** `settings-010`
**Priority:** low
**Test Status:** ❌ uncovered

- **WHEN** user enters description > 500 characters
- **THEN** form shows character count "512 / 500"
- **AND** shows error "Description must be 500 characters or less"
- **AND** "Save Changes" button is disabled

### Requirement: Display read-only metadata
The system SHALL show project metadata that cannot be edited.

#### Scenario: Display project key
**ID:** `settings-011`
**Priority:** medium
**Test Status:** ❌ uncovered

- **GIVEN** user is on General settings tab
- **THEN** project key is displayed
- **AND** field is read-only (not editable)
- **AND** help text explains "Auto-generated identifier (cannot be changed)"

#### Scenario: Display repository URL
**ID:** `settings-012`
**Priority:** medium
**Test Status:** ❌ uncovered

- **GIVEN** project repository is at https://github.com/user/repo
- **THEN** repository URL is displayed as clickable link
- **AND** clicking link opens repository in new tab

#### Scenario: Display creation and update dates
**ID:** `settings-013`
**Priority:** low
**Test Status:** ❌ uncovered

- **GIVEN** project was created on 2026-01-15
- **AND** last updated on 2026-02-13
- **THEN** "Created" shows formatted date "January 15, 2026"
- **AND** "Last Updated" shows relative time "2 days ago" or absolute date

### Requirement: Delete project safely
The system SHALL allow users to delete projects with strong confirmation.

#### Scenario: User deletes project with confirmation
**ID:** `settings-014`
**Priority:** critical
**Test Status:** ❌ uncovered

- **GIVEN** project named "MyProject" exists
- **AND** user is on settings page
- **WHEN** user scrolls to Danger Zone section
- **AND** clicks "Delete Project" button
- **THEN** confirmation modal appears
- **AND** modal shows warning "This action cannot be undone"
- **AND** modal explains "The Git repository will be preserved"
- **AND** modal has input field "Type 'MyProject' to confirm"
- **WHEN** user types "MyProject" correctly
- **AND** clicks "Delete Project" in modal
- **THEN** modal shows loading state
- **THEN** project is removed from AgentForge database
- **AND** user is redirected to projects list
- **AND** success notification shows "Project 'MyProject' deleted"
- **AND** project no longer appears in projects list
- **AND** Git repository remains on disk

#### Scenario: Prevent deletion with incorrect confirmation
**ID:** `settings-015`
**Priority:** high
**Test Status:** ❌ uncovered

- **GIVEN** delete confirmation modal is open for project "MyProject"
- **WHEN** user types "WrongName"
- **AND** clicks "Delete Project"
- **THEN** modal shows error "Please type 'MyProject' to confirm"
- **AND** project is NOT deleted
- **AND** modal remains open

#### Scenario: Cancel deletion
**ID:** `settings-016`
**Priority:** high
**Test Status:** ❌ uncovered

- **GIVEN** delete confirmation modal is open
- **WHEN** user clicks "Cancel" button
- **THEN** modal closes
- **AND** project is NOT deleted
- **AND** returns to settings page

#### Scenario: Delete button in Danger Zone styled prominently
**ID:** `settings-017`
**Priority:** medium
**Test Status:** ❌ uncovered

- **GIVEN** user views Danger Zone section
- **THEN** section has red/warning styling
- **AND** "Delete Project" button is red
- **AND** warning icon is visible
- **AND** clear explanation of consequences is shown

### Requirement: Handle settings errors
The system SHALL handle errors gracefully.

#### Scenario: Network error while saving
**ID:** `settings-018`
**Priority:** high
**Test Status:** ❌ uncovered

- **GIVEN** user has edited project name
- **AND** network connection fails
- **WHEN** user clicks "Save Changes"
- **THEN** form shows error "Failed to save changes. Please try again."
- **AND** provides "Retry" button
- **AND** form remains in edit mode with changes intact

#### Scenario: Server error while saving
**ID:** `settings-019`
**Priority:** high
**Test Status:** ❌ uncovered

- **GIVEN** user has edited settings
- **AND** server returns 500 error
- **WHEN** user clicks "Save Changes"
- **THEN** form shows error "An error occurred. Please try again or contact support."
- **AND** error details are logged for debugging
- **AND** form remains editable

#### Scenario: Settings load failure
**ID:** `settings-020`
**Priority:** high
**Test Status:** ❌ uncovered

- **GIVEN** user navigates to settings page
- **AND** API fails to load project metadata
- **THEN** error message appears "Failed to load settings"
- **AND** provides "Retry" button
- **AND** does not show empty/incorrect form data

### Requirement: Form state management
The system SHALL manage form state properly.

#### Scenario: Save button disabled when form is pristine
**ID:** `settings-021`
**Priority:** medium
**Test Status:** ❌ uncovered

- **GIVEN** settings page loads with current data
- **AND** user has not made any changes
- **THEN** "Save Changes" button is disabled
- **AND** button has tooltip "No changes to save"

#### Scenario: Save button enabled when form is dirty
**ID:** `settings-022`
**Priority:** medium
**Test Status:** ❌ uncovered

- **GIVEN** settings page is loaded
- **WHEN** user edits project name
- **THEN** "Save Changes" button becomes enabled
- **AND** form is marked as dirty (has unsaved changes)

#### Scenario: Reset form on successful save
**ID:** `settings-023`
**Priority:** medium
**Test Status:** ❌ uncovered

- **GIVEN** user has edited and saved settings
- **WHEN** save succeeds
- **THEN** form becomes pristine again
- **AND** "Save Changes" button disables
- **AND** no unsaved changes indicator

#### Scenario: Cancel button reverts changes
**ID:** `settings-024`
**Priority:** medium
**Test Status:** ❌ uncovered

- **GIVEN** user has edited project name from "Old" to "New"
- **AND** form is dirty
- **WHEN** user clicks "Cancel" button
- **THEN** form reverts to original values ("Old")
- **AND** form becomes pristine
- **AND** no confirmation needed (changes not saved yet)

### Requirement: Tab navigation
The system SHALL support intuitive tab navigation.

#### Scenario: Active tab highlighted
**ID:** `settings-025`
**Priority:** medium
**Test Status:** ❌ uncovered

- **GIVEN** user is on Runtime tab
- **THEN** Runtime tab has active styling (highlighted, different color)
- **AND** other tabs have inactive styling
- **AND** active tab is clearly distinguishable

#### Scenario: Tab state persists in URL
**ID:** `settings-026`
**Priority:** low
**Test Status:** ❌ uncovered

- **GIVEN** user is on Authentication tab
- **WHEN** user copies URL
- **THEN** URL includes `?tab=authentication`
- **WHEN** user shares URL with teammate
- **AND** teammate opens URL
- **THEN** Authentication tab is active by default

#### Scenario: Invalid tab parameter defaults to General
**ID:** `settings-027`
**Priority:** low
**Test Status:** ❌ uncovered

- **GIVEN** URL has `?tab=nonexistent`
- **WHEN** settings page loads
- **THEN** defaults to General tab
- **AND** URL updates to remove invalid parameter

### Requirement: Responsive design
The system SHALL work on different screen sizes.

#### Scenario: Settings page on desktop
**ID:** `settings-028`
**Priority:** high
**Test Status:** ❌ uncovered

- **GIVEN** settings page viewed on desktop (> 1024px)
- **THEN** tabs shown in sidebar on left
- **AND** form content on right
- **AND** form fields have comfortable width

#### Scenario: Settings page on tablet
**ID:** `settings-029`
**Priority:** medium
**Test Status:** ❌ uncovered

- **GIVEN** settings page viewed on tablet (768-1024px)
- **THEN** tabs shown as horizontal tabs at top
- **AND** form content below
- **AND** form remains usable

#### Scenario: Settings page on mobile
**ID:** `settings-030`
**Priority:** medium
**Test Status:** ❌ uncovered

- **GIVEN** settings page viewed on mobile (< 768px)
- **THEN** tabs shown as dropdown or stacked list
- **AND** form fields are full width
- **AND** "Save Changes" button is full width
- **AND** text remains readable

### Requirement: Accessibility
The system SHALL be fully accessible.

#### Scenario: Keyboard navigation
**ID:** `settings-031`
**Priority:** high
**Test Status:** ❌ uncovered

- **GIVEN** user navigates settings with keyboard only
- **THEN** can Tab through all form fields
- **AND** can Tab through all tabs
- **AND** can Enter to submit form
- **AND** can Escape to cancel modal
- **AND** focus indicators are visible

#### Scenario: Screen reader support
**ID:** `settings-032`
**Priority:** high
**Test Status:** ❌ uncovered

- **GIVEN** user with screen reader
- **THEN** all fields have proper labels announced
- **AND** required fields indicated
- **AND** error messages announced
- **AND** save success/failure announced
- **AND** tab changes announced

#### Scenario: Focus management in modals
**ID:** `settings-033`
**Priority:** medium
**Test Status:** ❌ uncovered

- **WHEN** delete confirmation modal opens
- **THEN** focus moves to modal
- **AND** focus trapped within modal
- **WHEN** modal closes
- **THEN** focus returns to delete button

## Performance Requirements

### Requirement: Fast settings page load
Settings should load quickly to avoid frustration.

**Targets:**
- Settings page loads in < 500ms
- Tab switching in < 100ms
- Form save completes in < 1 second
- Validation feedback in < 100ms

## Security Requirements

### Requirement: Authorization
Only project owners/admins can access settings.

- Verify user has permission to edit project
- Check authentication before showing settings page
- Validate permissions on every API call
- Audit log for sensitive changes (future)

### Requirement: Safe delete
Project deletion must be intentional and confirmed.

- Require typing project name exactly
- Show clear warning of consequences
- Preserve Git repository
- Log deletion for audit trail
- Cannot be undone (irreversible action)

## Future Tab Requirements

### Runtime Tab (Deferred)

**Scenario: Configure Docker runtime**
- User selects "Docker" adapter
- Form shows Docker-specific options (image, volumes, ports)
- User configures and tests connection
- Configuration saved and used for agent execution

### Authentication Tab (Deferred)

**Scenario: Add Claude API key**
- User clicks "Add API Key"
- Form appears for key name and value
- User enters key
- Key is encrypted and stored
- Masked key shown in list (*****abc123)

### Collaboration Tab (Deferred)

**Scenario: Invite team member**
- User enters email address
- Selects role (Admin, Editor, Viewer)
- Sends invitation email
- Team member accepts and gains access

### Advanced Tab (Deferred)

**Scenario: Enable debug mode**
- User toggles "Debug Mode" switch
- Warning appears about verbose logging
- Debug mode enables
- All agent runs produce detailed logs
