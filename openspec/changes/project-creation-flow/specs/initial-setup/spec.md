## ADDED Requirements

### Requirement: Generate PROJECT.md from description
The system SHALL use AI to generate a comprehensive PROJECT.md based on user input.

#### Scenario: Generate from free-form description
- **GIVEN** user enters description "A todo app with priority levels, due dates, and tags"
- **WHEN** system generates PROJECT.md
- **THEN** generated document includes:
  - Project Overview section
  - Problem statement (why this project exists)
  - Solution description
  - Key features list
  - Success metrics
  - Technical constraints (if inferable)

#### Scenario: Preview generated PROJECT.md before finalizing
- **WHEN** PROJECT.md is generated
- **THEN** preview is shown to user in wizard
- **AND** user can click "Edit" to modify
- **AND** user can click "Regenerate" if unsatisfied

#### Scenario: Use template for PROJECT.md
- **WHEN** user selects "Todo App" template
- **THEN** pre-written PROJECT.md is used
- **AND** placeholders are replaced with project-specific values (name, key, etc.)
- **AND** user can still customize before finalizing

### Requirement: Generate initial tasks from project goals
The system SHALL create actionable first tasks based on project description.

#### Scenario: Generate 3-5 initial tasks
- **GIVEN** project description "Build a REST API for managing blog posts"
- **WHEN** initial tasks are generated
- **THEN** 3-5 tasks are created covering:
  - Setup/infrastructure (e.g., "Set up project structure and dependencies")
  - Core functionality (e.g., "Create POST /posts endpoint")
  - Testing (e.g., "Add unit tests for post creation")

#### Scenario: Tasks have appropriate metadata
- **WHEN** tasks are generated
- **THEN** each task has:
  - Auto-generated key (PROJECT-1, PROJECT-2, etc.)
  - Clear title
  - Detailed description (optional but recommended)
  - Suggested type (epic, backend, frontend, testing, etc.)
  - Suggested priority (based on dependency order)
  - No assignee (user assigns later)

#### Scenario: Tasks are ordered by priority
- **WHEN** task list is displayed
- **THEN** tasks are in logical execution order
- **AND** foundational tasks (setup, architecture) come first
- **AND** feature tasks come after

### Requirement: Set up default agent configurations
The system SHALL create standard agent config files in .agentforge/agents/.

#### Scenario: Initialize standard agents
- **WHEN** project is created
- **THEN** default agents are configured:
  - pm (Product Manager)
  - engineer (Software Engineer)
  - qa (QA Engineer)
  - lead (Tech Lead)

#### Scenario: Agent configs use defaults
- **WHEN** agent configs are created
- **THEN** each has:
  - config.json with default model settings
  - prompt.md with role-appropriate system prompt
  - sessions/ directory (empty initially)

#### Scenario: Agents match project type
- **WHEN** user creates frontend project
- **THEN** engineer prompt is tailored for frontend work
- **WHEN** user creates backend API project
- **THEN** engineer prompt emphasizes API design and testing

### Requirement: Initialize ARCHITECTURE.md template
The system SHALL create an ARCHITECTURE.md file with standard structure.

#### Scenario: ARCHITECTURE.md template is created
- **WHEN** project is initialized
- **THEN** ARCHITECTURE.md is created with sections:
  - System Overview (placeholder)
  - Architecture Layers (to be filled by agents)
  - Key Design Decisions (empty list)
  - Technology Stack (based on project type if known)
  - Future Enhancements (empty list)

#### Scenario: Technology stack is inferred
- **GIVEN** project description mentions "React dashboard"
- **WHEN** ARCHITECTURE.md is generated
- **THEN** Technology Stack section includes:
  - Frontend: React, TypeScript (inferred)
  - Build: Vite (common default)

### Requirement: Create TESTING.md guide
The system SHALL create a TESTING.md file with testing strategy template.

#### Scenario: TESTING.md template is created
- **WHEN** project is initialized
- **THEN** TESTING.md includes sections:
  - Testing Philosophy
  - Unit Tests (guidance)
  - Integration Tests (guidance)
  - E2E Tests (guidance)
  - Running Tests (placeholder for commands)

### Requirement: Initialize .gitignore
The system SHALL create appropriate .gitignore file for the project.

#### Scenario: Basic .gitignore is created
- **WHEN** project is initialized
- **THEN** .gitignore includes:
  - `.agentforge/sessions/` (agent session transcripts)
  - `node_modules/` (if Node.js project)
  - `.env` (environment variables)
  - OS-specific files (.DS_Store, Thumbs.db)

#### Scenario: .gitignore matches project type
- **WHEN** project is Python-based
- **THEN** .gitignore includes `__pycache__/`, `*.pyc`, `.venv/`
- **WHEN** project is Node.js-based
- **THEN** .gitignore includes `node_modules/`, `dist/`, `.cache/`

### Requirement: Validation before committing structure
The system SHALL validate generated files before committing to repository.

#### Scenario: Validate PROJECT.md completeness
- **WHEN** PROJECT.md is generated
- **THEN** system checks:
  - All required sections are present
  - No placeholder text remains (or placeholders are clearly marked)
  - Markdown is valid

#### Scenario: Warn if tasks are too vague
- **WHEN** generated tasks are evaluated
- **IF** task description is < 10 characters
- **THEN** warning shows "Task '{title}' needs more detail"
- **AND** suggests regenerating with more specific description

### Requirement: User confirmation before initialization
The system SHALL require user approval before committing initial structure.

#### Scenario: Show preview of all files to be created
- **WHEN** user is on review step
- **THEN** expandable preview shows:
  - PROJECT.md (full content)
  - Initial tasks (list with details)
  - Agent configs (summary)
  - Other files (.gitignore, etc.)

#### Scenario: User can edit before finalizing
- **WHEN** user clicks "Edit PROJECT.md"
- **THEN** markdown editor opens
- **AND** user makes changes
- **AND** changes are saved for commit

#### Scenario: User can regenerate if unsatisfied
- **WHEN** user clicks "Regenerate"
- **THEN** new PROJECT.md and tasks are generated
- **AND** previous version is discarded
- **AND** regeneration uses same original user input

### Requirement: Commit initial structure to repository
The system SHALL commit and push the generated files to the repository.

#### Scenario: Create initial commit
- **WHEN** user confirms initialization
- **THEN** system commits all generated files with message:
  - "Initialize AgentForge project: {PROJECT_NAME}"
- **AND** commit includes:
  - .agentforge/ directory
  - PROJECT.md, ARCHITECTURE.md, TESTING.md
  - .gitignore
  - README.md (if creating new repo)

#### Scenario: Push to default branch
- **WHEN** commit is created
- **THEN** changes are pushed to main/master branch
- **IF** push fails (no permission, conflicts)
- **THEN** error is shown with resolution options

### Requirement: Handle initialization errors gracefully
The system SHALL recover from failures during initialization.

#### Scenario: AI generation fails
- **WHEN** AI API fails during PROJECT.md generation
- **THEN** fallback to template is used
- **AND** user is notified "Using template due to AI service unavailability"

#### Scenario: Git operation fails
- **WHEN** commit or push fails
- **THEN** generated files are saved locally
- **AND** user is offered to:
  - Retry push
  - Download files as ZIP
  - Continue without committing (manual setup)

#### Scenario: Partial initialization recovery
- **WHEN** initialization fails mid-process
- **THEN** completed steps are preserved
- **AND** user can retry from failed step
- **OR** user can complete setup manually
