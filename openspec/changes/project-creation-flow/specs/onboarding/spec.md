## ADDED Requirements

### Requirement: Detect first-time project and trigger onboarding
The system SHALL recognize when a user is viewing a newly created project and initiate guided onboarding.

#### Scenario: Onboarding starts after project creation
- **WHEN** project wizard completes successfully
- **AND** user is navigated to project view
- **THEN** onboarding overlay appears
- **AND** welcome message displays: "Welcome to {PROJECT_NAME}! Let's watch your first agent in action."

#### Scenario: Skip onboarding option
- **WHEN** onboarding overlay appears
- **THEN** "Skip Tutorial" link is visible
- **WHEN** user clicks "Skip Tutorial"
- **THEN** confirmation appears: "Skip the tutorial? You can restart it anytime from settings."
- **WHEN** user confirms
- **THEN** onboarding closes and project view is fully interactive

#### Scenario: Resume onboarding later
- **WHEN** user skipped onboarding
- **AND** navigates to project settings
- **THEN** "Restart Tutorial" button is available
- **WHEN** user clicks it
- **THEN** onboarding restarts from beginning

### Requirement: Interactive tutorial overlays
The system SHALL provide contextual tips and explanations via overlay tooltips.

#### Scenario: Step 1 - Explain agent session panel
- **WHEN** onboarding starts
- **THEN** spotlight highlights agent session panel
- **AND** tooltip appears: "This is where you'll watch your agent work. It's starting its first task now!"
- **AND** "Next" button is shown

#### Scenario: Step 2 - Explain progress tracking
- **WHEN** user clicks "Next" on step 1
- **THEN** spotlight highlights progress indicator
- **AND** tooltip explains: "The progress bar shows which steps the agent is working through."

#### Scenario: Step 3 - Explain task list
- **WHEN** user clicks "Next" on step 2
- **THEN** spotlight highlights task list
- **AND** tooltip explains: "These are the initial tasks we created. You can add more anytime."

#### Scenario: Step 4 - Explain file tree
- **WHEN** user clicks "Next" on step 3
- **THEN** spotlight highlights file tree
- **AND** tooltip explains: "Watch files appear here as the agent creates them."

#### Scenario: Final step - Next actions
- **WHEN** user reaches final tutorial step
- **THEN** tooltip shows: "Great! The agent is working. Next steps:
  - Add more tasks
  - Customize agent prompts
  - Deploy your project"
- **AND** "Finish Tutorial" button is shown

### Requirement: Real-time progress narration
The system SHALL provide live commentary as the first agent works.

#### Scenario: Agent starts task
- **WHEN** first agent session starts
- **THEN** toast notification appears: "🚀 Agent started: Creating project README"
- **AND** auto-dismisses after 4 seconds

#### Scenario: Agent completes step
- **WHEN** agent completes a task step
- **THEN** subtle animation highlights the step
- **AND** (if onboarding active) tooltip appears briefly: "Step completed! ✓"

#### Scenario: Agent creates file
- **WHEN** agent creates a new file
- **THEN** file appears in tree with fade-in animation
- **AND** (if onboarding active) tooltip appears: "File created: {filename}"

#### Scenario: Agent commits changes
- **WHEN** agent commits to Git
- **THEN** commit badge appears in session panel
- **AND** (if onboarding active) tooltip: "Changes committed to repository ✓"

### Requirement: Success celebration on first task completion
The system SHALL celebrate when the first agent task completes successfully.

#### Scenario: First task completes successfully
- **WHEN** first agent session completes
- **AND** status is "completed"
- **THEN** celebration modal appears with:
  - Confetti animation
  - Message: "🎉 Your first agent task is complete!"
  - Summary: "{AGENT} successfully created {X} files and {Y} commits"
  - "View Results" button
  - "Create Next Task" button

#### Scenario: User views results
- **WHEN** user clicks "View Results" in celebration modal
- **THEN** modal closes
- **AND** session detail panel opens showing full session summary
- **AND** file tree highlights newly created files

#### Scenario: User creates next task
- **WHEN** user clicks "Create Next Task"
- **THEN** celebration modal closes
- **AND** task creation form opens
- **AND** (if onboarding active) tooltip appears: "Describe what you want to build next"

### Requirement: First task failure handling
The system SHALL provide helpful guidance if the first agent task fails.

#### Scenario: First task fails
- **WHEN** first agent session status is "failed"
- **THEN** helpful modal appears with:
  - Message: "The first task encountered an issue"
  - Error summary (simplified, not raw stack trace)
  - Suggested actions:
    - "Retry Task" - Restarts same task
    - "Modify Task" - Opens edit form
    - "View Logs" - Shows full error details
    - "Get Help" - Links to docs or support

#### Scenario: User retries failed task
- **WHEN** user clicks "Retry Task"
- **THEN** new agent session starts with same configuration
- **AND** toast shows "Retrying task..."

#### Scenario: User gets help
- **WHEN** user clicks "Get Help"
- **THEN** help panel opens with:
  - Common first-task issues and solutions
  - Link to Discord/support
  - Option to report issue

### Requirement: Onboarding progress persistence
The system SHALL track which onboarding steps user has completed.

#### Scenario: User refreshes during onboarding
- **GIVEN** user is on onboarding step 3
- **WHEN** page refreshes
- **THEN** onboarding resumes from step 3
- **AND** all tutorial state is preserved

#### Scenario: User navigates away and returns
- **GIVEN** user is mid-onboarding
- **WHEN** user navigates to different project
- **AND** returns to original project
- **THEN** onboarding resumes from last step
- **OR** offers to restart if > 1 hour has passed

#### Scenario: Onboarding completion is recorded
- **WHEN** user completes onboarding
- **THEN** user's profile is updated with `onboardingCompleted: true`
- **AND** future projects do not show onboarding by default
- **BUT** advanced features still show contextual tips on first use

### Requirement: Contextual tips for advanced features
The system SHALL show helpful tips when user encounters new features.

#### Scenario: First time opening task board
- **WHEN** user clicks "Tasks" tab for first time
- **AND** onboarding is complete
- **THEN** brief tooltip appears: "Drag tasks between columns to update status"
- **AND** auto-dismisses after 5 seconds

#### Scenario: First time viewing deployment
- **WHEN** user opens deployment dashboard for first time
- **THEN** tooltip explains: "Monitor your deployed services and view logs here"

#### Scenario: Dismiss all tips option
- **WHEN** user clicks "Don't show tips again" in any tooltip
- **THEN** all contextual tips are disabled
- **AND** user can re-enable in settings

### Requirement: Onboarding accessibility
The system SHALL ensure onboarding is accessible to all users.

#### Scenario: Keyboard navigation through tutorial
- **WHEN** onboarding is active
- **AND** user presses Tab
- **THEN** focus moves to "Next" button
- **WHEN** user presses Enter
- **THEN** tutorial advances to next step

#### Scenario: Screen reader announces tutorial steps
- **WHEN** tutorial step changes
- **THEN** screen reader announces step title and content
- **AND** ARIA live region is updated

#### Scenario: Pause onboarding for accessibility
- **WHEN** user presses Escape during onboarding
- **THEN** onboarding pauses
- **AND** modal appears: "Tutorial paused. Resume or skip?"
- **AND** user can resume or exit

### Requirement: Onboarding metrics tracking
The system SHALL track user behavior during onboarding for improvement.

#### Scenario: Track completion rate
- **WHEN** user starts onboarding
- **THEN** event is logged: "onboarding_started"
- **WHEN** user completes onboarding
- **THEN** event is logged: "onboarding_completed"
- **WHEN** user skips onboarding
- **THEN** event is logged: "onboarding_skipped" with step number

#### Scenario: Track time to first success
- **WHEN** user completes first agent task successfully
- **THEN** metric is recorded: time from project creation to task completion

**Note:** Tracking is privacy-respecting (no PII) and can be disabled in settings.
