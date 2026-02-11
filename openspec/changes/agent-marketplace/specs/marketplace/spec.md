# Agent Marketplace Spec

## ADDED Requirements

### Requirement: Browse marketplace agents
The system SHALL allow users to browse community agents in a catalog.

#### Scenario: User opens marketplace
**ID:** `marketplace-001`
**Priority:** critical
**Test Status:** ❌ uncovered

- **WHEN** user clicks "Agent Marketplace" button in agents sidebar
- **THEN** navigates to `/marketplace` page
- **AND** page loads with agent catalog
- **AND** agents are grouped by category
- **AND** search bar is visible at top
- **AND** category filter is visible

#### Scenario: User views agents by category
**ID:** `marketplace-002`
**Priority:** high
**Test Status:** ❌ uncovered

- **GIVEN** marketplace page is open
- **WHEN** user clicks "Code Quality" category
- **THEN** agent list filters to show only Code Quality agents
- **AND** category is highlighted as active
- **AND** agent count is displayed
- **WHEN** user clicks "All Categories"
- **THEN** all agents are shown again

#### Scenario: User searches for agents
**ID:** `marketplace-003`
**Priority:** high
**Test Status:** ❌ uncovered

- **GIVEN** marketplace page shows all agents
- **WHEN** user types "test" in search bar
- **THEN** agent list filters to agents matching "test" in title or description
- **AND** results update as user types (debounced)
- **AND** shows "X results for 'test'" message

### Requirement: Preview agent details
The system SHALL allow users to view full agent details before installing.

#### Scenario: User views agent detail
**ID:** `marketplace-004`
**Priority:** critical
**Test Status:** ❌ uncovered

- **GIVEN** marketplace page shows agent cards
- **WHEN** user clicks on "Code Reviewer" agent card
- **THEN** agent detail view opens
- **AND** shows agent title and description
- **AND** shows category and tags
- **AND** shows full agent prompt in preview
- **AND** shows use cases list
- **AND** shows "Add to Project" button

#### Scenario: User previews agent prompt
**ID:** `marketplace-005`
**Priority:** high
**Test Status:** ❌ uncovered

- **GIVEN** agent detail view is open for "Code Reviewer"
- **THEN** prompt preview shows full markdown content
- **AND** markdown is rendered with syntax highlighting
- **AND** sections (Role, Responsibilities, etc.) are clearly visible
- **AND** prompt is scrollable if long

#### Scenario: User closes agent detail
**ID:** `marketplace-006`
**Priority:** medium
**Test Status:** ❌ uncovered

- **GIVEN** agent detail view is open
- **WHEN** user clicks back button or closes modal
- **THEN** returns to marketplace catalog
- **AND** maintains previous search/filter state

### Requirement: Install marketplace agent
The system SHALL allow users to install agents to their project.

#### Scenario: User installs agent with default name
**ID:** `marketplace-007`
**Priority:** critical
**Test Status:** ❌ uncovered

- **GIVEN** user has "MyProject" selected
- **AND** viewing "Code Reviewer" agent detail
- **WHEN** user clicks "Add to Project"
- **THEN** modal shows "Install to MyProject?"
- **AND** pre-fills agent name as "code-reviewer"
- **WHEN** user clicks "Install"
- **THEN** agent file is created at `agents/code-reviewer.md`
- **AND** file contains full agent prompt from marketplace
- **AND** changes are committed with message "Install code-reviewer from marketplace"
- **AND** success notification shows "Agent 'code-reviewer' installed"
- **AND** marketplace detail closes
- **AND** agents pane reloads
- **AND** new agent appears in agents list

#### Scenario: User installs agent with custom name
**ID:** `marketplace-008`
**Priority:** high
**Test Status:** ❌ uncovered

- **GIVEN** viewing "Code Reviewer" agent detail
- **WHEN** user clicks "Add to Project"
- **AND** changes name from "code-reviewer" to "my-reviewer"
- **AND** clicks "Install"
- **THEN** agent is installed as `agents/my-reviewer.md`
- **AND** agent appears with custom name in agents list

#### Scenario: Prevent installing duplicate agent
**ID:** `marketplace-009`
**Priority:** high
**Test Status:** ❌ uncovered

- **GIVEN** agent "code-reviewer" already exists in project
- **WHEN** user tries to install "Code Reviewer" from marketplace
- **AND** uses default name "code-reviewer"
- **THEN** form shows error "Agent 'code-reviewer' already exists"
- **AND** suggests alternative name "code-reviewer-2"
- **AND** allows user to change name or cancel

### Requirement: Display agent metadata
The system SHALL show relevant metadata for each agent.

#### Scenario: Agent card shows key information
**ID:** `marketplace-010`
**Priority:** high
**Test Status:** ❌ uncovered

- **GIVEN** marketplace catalog is displayed
- **WHEN** user views agent cards
- **THEN** each card shows:
  - Agent title
  - Short description (truncated if long)
  - Category badge
  - Tags (first 3)
  - Author name
- **AND** cards are clickable to view details

#### Scenario: Agent detail shows complete metadata
**ID:** `marketplace-011`
**Priority:** high
**Test Status:** ❌ uncovered

- **GIVEN** agent detail view is open
- **THEN** shows all metadata:
  - Title
  - Full description
  - Category
  - All tags
  - Author
  - Version
  - Created date
  - Last updated date
  - Download count (future)
  - Rating (future)

### Requirement: Handle marketplace errors
The system SHALL handle errors gracefully.

#### Scenario: Marketplace unavailable
**ID:** `marketplace-012`
**Priority:** high
**Test Status:** ❌ uncovered

- **GIVEN** community repository is unreachable
- **WHEN** user opens marketplace
- **THEN** shows error message "Unable to load marketplace. Please try again later."
- **AND** shows cached agents if available
- **AND** provides "Retry" button

#### Scenario: Agent installation fails
**ID:** `marketplace-013`
**Priority:** high
**Test Status:** ❌ uncovered

- **GIVEN** user clicks "Install" on marketplace agent
- **AND** Git commit fails
- **THEN** shows error "Failed to install agent: {error message}"
- **AND** provides "Retry" button
- **AND** provides "Save Manually" option with agent content

### Requirement: Organize agents by category
The system SHALL group agents into logical categories.

#### Scenario: Categories shown in navigation
**ID:** `marketplace-014`
**Priority:** high
**Test Status:** ❌ uncovered

- **GIVEN** marketplace page is open
- **THEN** category navigation shows:
  - All Categories (default selected)
  - Code Quality
  - Testing
  - Documentation
  - DevOps
  - Design
- **AND** each category shows agent count

#### Scenario: Category filter persists during search
**ID:** `marketplace-015`
**Priority:** medium
**Test Status:** ❌ uncovered

- **GIVEN** user has selected "Testing" category
- **WHEN** user searches for "generator"
- **THEN** results show only Testing agents matching "generator"
- **AND** category filter remains active

### Requirement: Support agent tags
The system SHALL display and filter by agent tags.

#### Scenario: Tags shown on agent cards
**ID:** `marketplace-016`
**Priority:** medium
**Test Status:** ❌ uncovered

- **GIVEN** marketplace catalog is displayed
- **THEN** each agent card shows up to 3 tags
- **AND** tags are styled as badges
- **AND** common tags are visible (e.g., "review", "quality", "automated")

#### Scenario: Filter by tag (future)
**ID:** `marketplace-017`
**Priority:** low
**Test Status:** ❌ uncovered

- **GIVEN** marketplace page is open
- **WHEN** user clicks on a tag badge
- **THEN** agent list filters to show agents with that tag
- **AND** tag filter is shown as active

### Requirement: Cache marketplace data
The system SHALL cache agent data for performance.

#### Scenario: Agents load from cache
**ID:** `marketplace-018`
**Priority:** medium
**Test Status:** ❌ uncovered

- **GIVEN** user previously loaded marketplace
- **AND** cache is valid (< 1 hour old)
- **WHEN** user opens marketplace again
- **THEN** agents load instantly from cache
- **AND** shows "(cached)" indicator
- **AND** provides "Refresh" button to fetch latest

#### Scenario: Manual refresh updates cache
**ID:** `marketplace-019`
**Priority:** medium
**Test Status:** ❌ uncovered

- **GIVEN** marketplace is showing cached agents
- **WHEN** user clicks "Refresh" button
- **THEN** shows loading state
- **AND** fetches latest agents from repository
- **AND** updates cache
- **AND** displays updated agent list

### Requirement: Responsive design
The system SHALL work on different screen sizes.

#### Scenario: Marketplace on desktop
**ID:** `marketplace-020`
**Priority:** high
**Test Status:** ❌ uncovered

- **GIVEN** marketplace is viewed on desktop (> 1024px)
- **THEN** shows category sidebar on left
- **AND** shows agent grid with 3-4 columns
- **AND** shows search bar in header

#### Scenario: Marketplace on mobile
**ID:** `marketplace-021`
**Priority:** medium
**Test Status:** ❌ uncovered

- **GIVEN** marketplace is viewed on mobile (< 768px)
- **THEN** category nav moves to horizontal tabs or dropdown
- **AND** agent grid shows 1 column
- **AND** search bar remains prominent

### Requirement: Empty states
The system SHALL handle cases with no results.

#### Scenario: No search results
**ID:** `marketplace-022`
**Priority:** medium
**Test Status:** ❌ uncovered

- **GIVEN** user searches for "asdfqwer"
- **WHEN** no agents match
- **THEN** shows "No agents found matching 'asdfqwer'"
- **AND** suggests "Try different keywords" or "Clear filters"
- **AND** provides "Clear Search" button

#### Scenario: Empty category
**ID:** `marketplace-023`
**Priority:** low
**Test Status:** ❌ uncovered

- **GIVEN** user selects a category with no agents
- **THEN** shows "No agents in this category yet"
- **AND** suggests exploring other categories

## Performance Requirements

### Requirement: Fast marketplace loading
Marketplace should load quickly for good UX.

**Targets:**
- Marketplace page loads in < 1 second (with cache)
- Agent list fetch in < 2 seconds (from repository)
- Agent detail loads in < 500ms
- Search results update in < 200ms (debounced)
- Agent installation completes in < 3 seconds

## Accessibility Requirements

### Requirement: Keyboard navigation
All marketplace features must be keyboard accessible.

- Tab navigates through agent cards
- Enter opens agent detail
- ESC closes agent detail
- Arrow keys navigate categories
- Search bar is reachable via keyboard

### Requirement: Screen reader support
Marketplace must be usable with screen readers.

- Agent cards have descriptive labels
- Categories announce current selection
- Search results announce count
- Loading states are announced
- Error messages are announced

## Security Requirements

### Requirement: Safe agent content
Agent content must be sanitized to prevent XSS.

- Markdown parsing uses safe renderer
- No executable code in agent content
- HTML tags are escaped or stripped
- Links are validated before rendering

### Requirement: Repository integrity
Community repository must be trusted and verified.

- Fetch from official `agentforge/community-agents` repo only
- Use HTTPS for all fetches
- Validate file structure and metadata
- Manual review for all agent submissions (future)
