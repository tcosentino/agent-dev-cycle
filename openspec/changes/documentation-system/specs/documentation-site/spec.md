# Documentation Site Spec

## ADDED Requirements

### Requirement: Documentation site accessible
The system SHALL provide a documentation site for all audiences.

#### Scenario: User accesses documentation homepage
**ID:** `docs-001`
**Priority:** critical
**Test Status:** ❌ uncovered

- **WHEN** user visits https://docs.agentforge.dev
- **THEN** homepage loads with hero section
- **AND** shows "Build software with autonomous AI agents" tagline
- **AND** displays quick start (3 steps)
- **AND** shows feature highlights
- **AND** navbar has: Docs, API, Community, Blog
- **AND** footer has links to GitHub, Discord, social media

#### Scenario: User navigates to User Guide
**ID:** `docs-002`
**Priority:** critical
**Test Status:** ❌ uncovered

- **GIVEN** user is on documentation homepage
- **WHEN** user clicks "Docs" in navbar
- **THEN** navigates to User Guide intro page
- **AND** sidebar shows User Guide navigation
- **AND** content displays "Getting Started" section

#### Scenario: User searches documentation
**ID:** `docs-003`
**Priority:** high
**Test Status:** ❌ uncovered

- **GIVEN** user is viewing documentation
- **WHEN** user presses Cmd+K (or Ctrl+K)
- **THEN** search modal opens
- **WHEN** user types "create agent"
- **THEN** search results appear instantly
- **AND** shows relevant docs with context (hierarchy)
- **WHEN** user clicks result
- **THEN** navigates to that page
- **AND** search term is highlighted

### Requirement: Multi-audience navigation
The system SHALL organize docs by audience.

#### Scenario: User browses User Guide sections
**ID:** `docs-004`
**Priority:** high
**Test Status:** ❌ uncovered

- **GIVEN** user is in User Guide
- **THEN** sidebar shows sections:
  - Getting Started
  - Tutorials
  - How-To Guides
  - Concepts
  - Reference
  - Troubleshooting
- **WHEN** user expands "Tutorials"
- **THEN** shows tutorial list
- **WHEN** user clicks "Build a Todo App"
- **THEN** navigates to that tutorial page

#### Scenario: Developer accesses Developer Guide
**ID:** `docs-005`
**Priority:** high
**Test Status:** ❌ uncovered

- **WHEN** developer clicks "Developer Guide" in navbar or sidebar
- **THEN** shows Developer Guide intro
- **AND** sidebar displays:
  - Contributing
  - Development Setup
  - Architecture
  - Testing
  - Release Process

#### Scenario: Agent accesses Agent Guide
**ID:** `docs-006`
**Priority:** high
**Test Status:** ❌ uncovered

- **WHEN** agent (or user) navigates to Agent Guide
- **THEN** shows agent-specific documentation:
  - Agent Best Practices
  - Prompt Engineering
  - Tool Catalog
  - File Conventions

### Requirement: API reference auto-generated
The system SHALL provide auto-generated API documentation.

#### Scenario: User views REST API reference
**ID:** `docs-007`
**Priority:** high
**Test Status:** ❌ uncovered

- **WHEN** user navigates to API Reference
- **THEN** shows auto-generated REST API docs
- **AND** docs are organized by resource (Projects, Agents, Tasks)
- **WHEN** user clicks "Projects API"
- **THEN** shows all project endpoints
- **AND** each endpoint shows:
  - HTTP method and path
  - Description
  - Request parameters
  - Request body (if applicable)
  - Response schema
  - Example request
  - Example response

#### Scenario: User tries API call in browser
**ID:** `docs-008`
**Priority:** medium
**Test Status:** ❌ uncovered

- **GIVEN** user is viewing API endpoint docs
- **WHEN** user clicks "Try it" button
- **THEN** interactive API explorer appears
- **WHEN** user fills in parameters
- **AND** clicks "Execute"
- **THEN** makes real API call
- **AND** displays response

### Requirement: Version-aware documentation
The system SHALL maintain docs for multiple versions.

#### Scenario: User selects documentation version
**ID:** `docs-009`
**Priority:** high
**Test Status:** ❌ uncovered

- **GIVEN** user is viewing docs for v1.0
- **WHEN** user clicks version dropdown in navbar
- **THEN** shows available versions: v2.0 (latest), v1.0, v0.9
- **WHEN** user selects v2.0
- **THEN** navigates to same page in v2.0 docs
- **AND** URL includes version (e.g., `/docs/2.0/user-guide/intro`)

#### Scenario: Latest version by default
**ID:** `docs-010`
**Priority:** medium
**Test Status:** ❌ uncovered

- **WHEN** user visits docs without version in URL
- **THEN** shows latest version (current/unreleased)
- **AND** version dropdown shows "Next" or "Latest"

#### Scenario: Search scoped to version
**ID:** `docs-011`
**Priority:** medium
**Test Status:** ❌ uncovered

- **GIVEN** user is viewing v1.0 docs
- **WHEN** user searches for "create project"
- **THEN** search results show only v1.0 docs
- **AND** user can toggle "Search all versions"

### Requirement: Content templates and examples
The system SHALL provide clear, consistent documentation.

#### Scenario: Tutorial follows standard format
**ID:** `docs-012`
**Priority:** high
**Test Status:** ❌ uncovered

- **GIVEN** user reads tutorial "Build a Todo App"
- **THEN** tutorial includes:
  - Time estimate (e.g., "20 minutes")
  - Level (Beginner/Intermediate/Advanced)
  - Prerequisites list
  - "What You'll Build" section
  - Numbered steps with code examples
  - "Next Steps" section with links

#### Scenario: How-To guide follows standard format
**ID:** `docs-013`
**Priority:** high
**Test Status:** ❌ uncovered

- **GIVEN** user reads How-To guide "Create an Agent"
- **THEN** guide includes:
  - "When to use" description
  - Prerequisites
  - Step-by-step instructions
  - Troubleshooting section
  - Related docs links

#### Scenario: API endpoint docs include examples
**ID:** `docs-014`
**Priority:** high
**Test Status:** ❌ uncovered

- **GIVEN** user views API endpoint documentation
- **THEN** each endpoint shows:
  - cURL example
  - JavaScript/TypeScript example
  - Response example (success)
  - Error response examples

### Requirement: Responsive and accessible
The system SHALL work on all devices and for all users.

#### Scenario: Docs on mobile
**ID:** `docs-015`
**Priority:** medium
**Test Status:** ❌ uncovered

- **GIVEN** user views docs on mobile (< 768px)
- **THEN** sidebar collapses to hamburger menu
- **AND** content is full-width and readable
- **AND** code blocks scroll horizontally
- **AND** search is accessible

#### Scenario: Keyboard navigation
**ID:** `docs-016`
**Priority:** high
**Test Status:** ❌ uncovered

- **GIVEN** user navigates docs with keyboard only
- **THEN** can Tab through all navigation links
- **AND** can Enter to select links
- **AND** can use arrow keys in sidebar
- **AND** focus indicators are visible

#### Scenario: Screen reader support
**ID:** `docs-017`
**Priority:** high
**Test Status:** ❌ uncovered

- **GIVEN** user with screen reader
- **THEN** navigation structure is announced
- **AND** headings are properly structured (h1 → h2 → h3)
- **AND** code blocks have labels
- **AND** images have alt text

### Requirement: Deploy to AWS
The system SHALL deploy to AWS infrastructure.

#### Scenario: Docs deploy on push to main
**ID:** `docs-018`
**Priority:** critical
**Test Status:** ❌ uncovered

- **GIVEN** developer merges PR updating docs
- **WHEN** code is pushed to main branch
- **THEN** GitHub Actions workflow triggers
- **AND** Docusaurus builds static site
- **AND** deploys to S3 bucket `agentforge-docs`
- **AND** invalidates CloudFront cache
- **AND** docs are live within 5 minutes

#### Scenario: Custom domain works
**ID:** `docs-019`
**Priority:** high
**Test Status:** ❌ uncovered

- **WHEN** user visits https://docs.agentforge.dev
- **THEN** loads documentation site
- **AND** HTTPS certificate is valid
- **AND** page loads quickly (< 2 seconds)

### Requirement: Agent context templates
The system SHALL provide templates for agent context files.

#### Scenario: New project includes templates
**ID:** `docs-020`
**Priority:** high
**Test Status:** ❌ uncovered

- **WHEN** user creates new AgentForge project
- **THEN** project includes template files:
  - PROJECT.md (project overview)
  - AGENTS.md (agent guidelines)
  - TOOLS.md (available tools)
  - MEMORY.md (project history)
- **AND** templates have placeholder content
- **AND** templates explain what to fill in

#### Scenario: Templates are documented
**ID:** `docs-021`
**Priority:** medium
**Test Status:** ❌ uncovered

- **GIVEN** user reads Agent Guide
- **THEN** docs explain purpose of each template file
- **AND** show examples of well-written files
- **AND** provide best practices for structuring content

### Requirement: Community contributions
The system SHALL support community documentation improvements.

#### Scenario: Edit on GitHub link
**ID:** `docs-022`
**Priority:** medium
**Test Status:** ❌ uncovered

- **GIVEN** user finds typo or outdated info in docs
- **WHEN** user clicks "Edit this page" link
- **THEN** opens GitHub editor for that markdown file
- **AND** user can make changes and submit PR

#### Scenario: Feedback on docs
**ID:** `docs-023`
**Priority:** low
**Test Status:** ❌ uncovered

- **GIVEN** user reads documentation page
- **WHEN** user scrolls to bottom
- **THEN** sees "Was this page helpful?" buttons
- **WHEN** user clicks "No"
- **THEN** optional feedback form appears
- **AND** feedback is collected for improvements

## Content Requirements

### Requirement: User Guide content
Essential content for end users.

**Must Have (MVP):**
- Getting Started → Installation
- Getting Started → First Project
- Getting Started → Core Concepts
- How-To → Create Agent
- How-To → Use Marketplace
- Concepts → Agents
- Concepts → Projects
- Concepts → OpenSpec
- Reference → CLI Commands
- Troubleshooting → Common Errors

**Nice to Have:**
- 3-5 tutorials
- 10-15 how-to guides
- Detailed reference sections

### Requirement: Developer Guide content
Essential content for contributors.

**Must Have (MVP):**
- CONTRIBUTING.md
- Development Setup
- Architecture Overview
- Testing Guide
- Release Process

**Nice to Have:**
- Deep architecture docs
- Design decision records
- Performance optimization guides

### Requirement: Agent Guide content
Essential content for AI agents.

**Must Have (MVP):**
- Agent Best Practices
- Tool Catalog
- File Conventions
- PROJECT.md template
- AGENTS.md template

**Nice to Have:**
- Advanced prompt engineering
- Multi-agent patterns
- Error handling strategies

## Performance Requirements

### Requirement: Fast page loads
Documentation should load quickly.

**Targets:**
- Homepage loads in < 1 second
- Doc pages load in < 2 seconds
- Search results appear in < 200ms
- Navigate between pages in < 500ms

## SEO Requirements

### Requirement: Search engine optimization
Docs should be discoverable via search engines.

- Proper meta tags (title, description)
- Sitemap generated automatically
- robots.txt allows crawling
- Structured data markup
- Open Graph tags for social sharing
