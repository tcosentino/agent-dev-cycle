## ADDED Requirements

### Requirement: GitHub OAuth authentication
The system SHALL authenticate users with GitHub to access repositories.

#### Scenario: User initiates GitHub authentication
- **WHEN** user reaches step 2 (GitHub Repository)
- **AND** is not yet authenticated with GitHub
- **THEN** "Connect GitHub" button is displayed
- **WHEN** user clicks "Connect GitHub"
- **THEN** GitHub OAuth flow opens in new window
- **AND** user authorizes AgentForge
- **AND** window closes
- **AND** user's GitHub repos are loaded

#### Scenario: User is already authenticated
- **WHEN** user has previously connected GitHub
- **THEN** repos list loads immediately
- **AND** "Connect GitHub" button shows "Connected as @username"

#### Scenario: User disconnects GitHub
- **WHEN** user clicks "Disconnect" on connected account
- **THEN** confirmation dialog appears
- **WHEN** user confirms
- **THEN** GitHub connection is removed
- **AND** manual URL input option is shown

### Requirement: List user's GitHub repositories
The system SHALL display user's accessible GitHub repositories for selection.

#### Scenario: Display repositories with metadata
- **WHEN** GitHub repos are loaded
- **THEN** each repo shows:
  - Repository name (owner/repo)
  - Description (if available)
  - Visibility badge (Public/Private)
  - Last updated date
  - Star count (if public)

#### Scenario: Filter repositories by name
- **WHEN** user types "todo" in search box
- **THEN** only repos containing "todo" are displayed
- **AND** search is case-insensitive

#### Scenario: Sort repositories
- **WHEN** user selects "Recently updated" sort
- **THEN** repos are sorted by last updated date (newest first)
- **WHEN** user selects "Most stars" sort
- **THEN** repos are sorted by star count (highest first)

#### Scenario: Paginate large repo lists
- **GIVEN** user has 50+ repositories
- **WHEN** repo list loads
- **THEN** first 20 repos are displayed
- **AND** "Load More" button appears
- **WHEN** user clicks "Load More"
- **THEN** next 20 repos are loaded and appended

### Requirement: Create new GitHub repository
The system SHALL create a new repository via GitHub API.

#### Scenario: Create public repository
- **WHEN** user enters repo name "my-todo-app"
- **AND** selects "Public" visibility
- **AND** clicks "Create Repository"
- **THEN** API creates repo at github.com/username/my-todo-app
- **AND** repo is initialized with README.md
- **AND** success message shows "Repository created successfully"

#### Scenario: Create private repository
- **WHEN** user selects "Private" visibility
- **AND** creates repository
- **THEN** repo is created as private
- **AND** only user has access

#### Scenario: Repository name collision
- **WHEN** user enters repo name that already exists
- **THEN** error shows "Repository 'my-todo-app' already exists"
- **AND** suggests alternative names (my-todo-app-2, etc.)

#### Scenario: Invalid repository name
- **WHEN** user enters name with invalid characters (!@#$)
- **THEN** error shows "Repository name can only contain letters, numbers, hyphens, and underscores"
- **AND** create button is disabled

### Requirement: Initialize .agentforge structure in repository
The system SHALL set up the AgentForge directory structure in the repository.

#### Scenario: Initialize structure for new repo
- **WHEN** new repository is created
- **THEN** AgentForge commits initial structure:
  - `.agentforge/PROJECT.md`
  - `.agentforge/ARCHITECTURE.md`
  - `.agentforge/TESTING.md`
  - `.agentforge/agents/` (with default agent configs)
  - `.gitignore` (with .agentforge/sessions/ entry)
- **AND** commit message is "Initialize AgentForge structure"

#### Scenario: Initialize structure for existing repo
- **WHEN** user selects existing repo
- **AND** clicks "Initialize AgentForge"
- **THEN** system checks if .agentforge/ exists
- **IF** exists:
  - Shows "AgentForge structure already exists. Overwrite?"
  - Requires confirmation
- **IF** doesn't exist:
  - Creates structure via new branch
  - Opens pull request for review (optional)
  - OR commits directly to main (if user chooses)

### Requirement: Repository permissions validation
The system SHALL verify user has required permissions on selected repository.

#### Scenario: User has write access
- **WHEN** user selects repo they own or are collaborator on
- **THEN** repo is marked as valid
- **AND** user can proceed

#### Scenario: User has read-only access
- **WHEN** user selects repo they only have read access to
- **THEN** warning shows "You don't have write access to this repository"
- **AND** options are:
  - "Fork repository" (creates fork under user's account)
  - "Select different repo"

#### Scenario: Repository is archived
- **WHEN** user selects archived repository
- **THEN** warning shows "This repository is archived and cannot be modified"
- **AND** user must select different repo

### Requirement: Clone and sync repository
The system SHALL clone the repository for agent operations.

#### Scenario: Clone repository on project creation
- **WHEN** project is created with GitHub repo
- **THEN** backend clones repo to AgentForge workspace
- **AND** stores clone path in project metadata

#### Scenario: Sync on agent session start
- **WHEN** agent session starts
- **THEN** system pulls latest changes from GitHub
- **AND** ensures working directory is up to date

### Requirement: Manual repository URL fallback
The system SHALL support manual Git URL entry if OAuth fails or user prefers.

#### Scenario: User enters manual Git URL
- **WHEN** user clicks "Use URL instead"
- **THEN** URL input field appears
- **WHEN** user enters "https://github.com/tcosentino/my-app.git"
- **AND** URL is valid
- **THEN** URL is saved
- **AND** user can proceed

#### Scenario: Validate Git URL format
- **WHEN** user enters invalid URL "not-a-url"
- **THEN** error shows "Invalid Git repository URL"
- **WHEN** user enters non-GitHub URL (e.g., GitLab)
- **THEN** warning shows "Non-GitHub URLs are supported but some features may not work"

#### Scenario: Private repo requires credentials
- **WHEN** user enters URL for private repo
- **THEN** prompt appears for GitHub personal access token
- **OR** offers to use OAuth instead
