# Core Concepts

> **Note:** This document describes the planned product vision. Some features described here (CLI commands, agent marketplace, PM agent) are not yet implemented.

Understand the fundamental building blocks of AgentForge.

## Overview

AgentForge has four core concepts:

1. **Projects** - What you're building
2. **Agents** - AI workers that write code
3. **Tasks** - Work for agents to complete
4. **OpenSpec** - Specifications that guide development

Let's explore each one.

## Projects

A **project** is a software application you're building with AgentForge.

### What is a Project?

Think of a project as:
- A Git repository
- A set of agents working together
- Tasks to be completed
- Configuration and metadata

### Project Structure

```
my-project/
├── .agentforge/          # AgentForge configuration
│   ├── agents/           # Agent definitions
│   ├── tasks/            # Task definitions
│   └── project.yaml      # Project config
├── PROJECT.md            # Project overview (for agents)
├── AGENTS.md             # Agent guidelines
├── README.md
└── src/                  # Your application code
```

### Project Metadata

Every project has:
- **Name** - Display name (e.g., "Todo App")
- **Key** - Short identifier (e.g., "TODO")
- **Description** - What it does
- **Repository** - Git repo location
- **Agents** - Which agents can work on it
- **Tasks** - Backlog of work

### Creating Projects

```bash
# Via CLI
agentforge project create --name "My App" --repo ~/repos/my-app

# Via UI
# Click "New Project" → Follow wizard
```

## Agents

An **agent** is an AI worker that writes code, creates files, runs tests, and commits changes.

### What is an Agent?

Agents are:
- **Specialized** - Each has a specific role (architect, engineer, QA)
- **Autonomous** - Work independently once given a task
- **Context-aware** - Read PROJECT.md, AGENTS.md, existing code
- **Git-native** - Commit changes with clear messages

### Agent Types

AgentForge includes several agent types:

**Architect Agent**
- Designs system architecture
- Makes high-level technical decisions
- Creates diagrams and specifications
- Defines project structure

**Engineer Agent**
- Writes application code
- Implements features
- Refactors existing code
- Follows coding standards

**QA Agent**
- Writes tests
- Reviews code for bugs
- Checks test coverage
- Ensures quality standards

**Lead Agent**
- Reviews code changes
- Provides feedback
- Ensures best practices
- Coordinates agent work

**PM Agent**
- Creates tasks from requirements
- Breaks down large features
- Prioritizes work
- Tracks progress

### Agent Definition

Agents are defined in markdown files:

```markdown
# Engineer Agent

## Role
You are a software engineer implementing features for this project.

## Responsibilities
- Write clean, maintainable code
- Follow project conventions
- Write tests for new features
- Commit changes with clear messages

## Guidelines
- Read PROJECT.md before starting
- Check AGENTS.md for conventions
- Ask if requirements are unclear
- Test your code before committing

## Tools Available
- File system (read/write)
- Shell commands
- Web search
- Git operations
```

### Running Agents

```bash
# Run specific agent on a task
agentforge run --agent engineer --task TODO-5

# Auto-assign best agent for task
agentforge run --task TODO-5 --auto

# Run agent in interactive mode
agentforge run --agent architect --interactive
```

### Customizing Agents

You can modify agent definitions:

```bash
# Edit agent file
nano .agentforge/agents/engineer.md

# Or via UI
# Settings → Agents → Edit Engineer
```

Add project-specific guidelines:
```markdown
## Project Conventions
- Use TypeScript strict mode
- Prefer functional components in React
- Follow Airbnb style guide
- Write unit tests with Vitest
```

## Tasks

A **task** is a unit of work for an agent to complete.

### What is a Task?

Tasks are:
- **Specific** - Clear, actionable work item
- **Assignable** - Can be given to an agent
- **Trackable** - Has status (todo, in-progress, done)
- **Atomic** - Should be completable in one session

### Task Properties

Every task has:

```yaml
key: TODO-5                          # Unique identifier
title: Add user authentication       # Short description
description: |                       # Detailed requirements
  Implement JWT-based authentication
  - Sign up endpoint
  - Login endpoint
  - Protected routes middleware
type: backend                        # Task category
priority: high                       # Importance
assignee: engineer                   # Which agent
status: todo                         # Current state
created: 2026-02-13T10:00:00Z
updated: 2026-02-13T15:30:00Z
```

### Task Lifecycle

```
┌─────────┐
│  TODO   │ Task created
└────┬────┘
     │ Agent assigned
     ▼
┌────────────┐
│ IN PROGRESS│ Agent working
└──────┬─────┘
       │ Work complete
       ▼
   ┌────────┐
   │ REVIEW │ (Optional) Code review
   └───┬────┘
       │ Approved
       ▼
    ┌──────┐
    │ DONE │ Task complete
    └──────┘
```

### Creating Tasks

**Via UI:**
1. Go to project Tasks tab
2. Click "New Task"
3. Fill in details
4. Assign to agent (optional)
5. Click "Create"

**Via CLI:**
```bash
agentforge task create \
  --title "Add user authentication" \
  --description "Implement JWT auth with signup and login" \
  --type backend \
  --priority high \
  --assign engineer
```

**Auto-generated from AI:**
When creating a project, AgentForge can generate initial tasks:
```bash
agentforge project create --ai-setup

# AI analyzes your project description and creates 5-10 initial tasks
```

### Task Dependencies

Tasks can depend on others:

```bash
# Create dependent task
agentforge task create \
  --title "Add password reset flow" \
  --depends-on TODO-5  # Requires auth to be implemented first
```

The system ensures tasks complete in the right order.

### Task Board (Kanban)

View tasks visually:

```
┌─────────┬────────────┬────────┬──────┐
│ To Do   │ In Progress│ Review │ Done │
├─────────┼────────────┼────────┼──────┤
│ TODO-6  │ TODO-5     │ TODO-3 │ TODO-1│
│ TODO-7  │            │        │ TODO-2│
│ TODO-8  │            │        │ TODO-4│
└─────────┴────────────┴────────┴──────┘
```

Drag and drop to change status!

## OpenSpec

**OpenSpec** is AgentForge's specification system for defining features before building them.

### What is OpenSpec?

OpenSpec helps you:
- **Document features** before implementation
- **Generate tasks** automatically
- **Guide agents** with clear requirements
- **Track progress** against specs

### OpenSpec Structure

```
openspec/
├── changes/                    # Work in progress
│   └── user-authentication/
│       ├── proposal.md         # Why build this?
│       ├── design.md           # How to build it?
│       ├── specs/              # WHEN/THEN scenarios
│       │   └── auth-flow/spec.md
│       └── tasks.md            # Implementation tasks
└── specs/                      # Completed features
    └── task-management/        # Moved here after implementation
```

### OpenSpec Workflow

1. **Propose** - Write `proposal.md` explaining the feature
2. **Design** - Document architecture in `design.md`
3. **Specify** - Write WHEN/THEN scenarios in `specs/`
4. **Task** - Break down into implementation tasks in `tasks.md`
5. **Implement** - Agents complete tasks from spec
6. **Promote** - Move from `changes/` to `specs/` when done

### Example: Auth Feature OpenSpec

**proposal.md:**
```markdown
## Why
Users need to create accounts and log in securely.

## What Changes
Add JWT-based authentication with signup, login, and protected routes.

## Impact
- New API endpoints: POST /signup, POST /login
- New middleware: authMiddleware
- New database table: users
```

**specs/auth-flow/spec.md:**
```markdown
#### Scenario: User signs up successfully
- WHEN user submits signup form with email and password
- THEN account is created
- AND user receives JWT token
- AND user is logged in automatically
```

**tasks.md:**
```markdown
- [ ] 1. Create users table migration
- [ ] 2. Implement signup endpoint
- [ ] 3. Implement login endpoint
- [ ] 4. Create auth middleware
- [ ] 5. Protect routes with middleware
- [ ] 6. Write tests for auth flow
```

### Benefits

- **Clarity** - Everyone knows what's being built
- **Traceability** - Link specs → tasks → code
- **Guidance** - Agents follow specs precisely
- **Documentation** - Specs become living docs

## How They Work Together

Let's see how projects, agents, tasks, and specs work together:

### Example Workflow

1. **Create project** with OpenSpec for "Todo App"
   ```bash
   agentforge project create --name "Todo App"
   ```

2. **OpenSpec generates tasks** automatically
   - TODO-1: Set up project structure
   - TODO-2: Create todo data model
   - TODO-3: Implement CRUD API
   - TODO-4: Build React UI

3. **Assign tasks to agents**
   - Architect → TODO-1 (structure)
   - Engineer → TODO-2, TODO-3 (backend)
   - Engineer → TODO-4 (frontend)
   - QA → Write tests for all

4. **Agents complete tasks** sequentially
   - Read PROJECT.md for context
   - Follow OpenSpec scenarios
   - Write code + tests
   - Commit with clear messages

5. **Review and iterate**
   - Check agent output
   - Request changes if needed
   - Agents adjust based on feedback

6. **Ship it!**
   - All tasks complete
   - Tests passing
   - Ready for deployment

## Key Principles

### 1. Clear Context

Agents work best with clear context:
- **PROJECT.md** - What are we building?
- **AGENTS.md** - How should we work?
- **OpenSpec** - What exactly to build?

### 2. Incremental Progress

Break work into small tasks:
- ✅ Complete in one session
- ✅ Easy to review
- ✅ Clear success criteria

### 3. Git-Native

Everything goes through Git:
- Agents commit changes
- You review via diffs
- Revert if needed
- Collaborate naturally

### 4. Human-in-the-Loop

You're always in control:
- Review agent work
- Approve before merging
- Provide feedback
- Override when needed

## Visual Summary

```
┌─────────────────────────────────────────┐
│              PROJECT                     │
│  (What you're building)                 │
│                                          │
│  ┌──────────────────────────────────┐  │
│  │        OPENSPEC                   │  │
│  │  (Feature specifications)         │  │
│  │                                   │  │
│  │  ┌────────────────────────────┐  │  │
│  │  │        TASKS               │  │  │
│  │  │  (Work items)              │  │  │
│  │  │                            │  │  │
│  │  │  ▼ Assigned to             │  │  │
│  │  │                            │  │  │
│  │  │  ┌─────────────────────┐  │  │  │
│  │  │  │     AGENTS          │  │  │  │
│  │  │  │  (AI workers)       │  │  │  │
│  │  │  │                     │  │  │  │
│  │  │  │  ▼ Write             │  │  │  │
│  │  │  │                     │  │  │  │
│  │  │  │  CODE + TESTS       │  │  │  │
│  │  │  └─────────────────────┘  │  │  │
│  │  └────────────────────────────┘  │  │
│  └──────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

## Next Steps

Now that you understand the core concepts:

- [Installation](./installation.md) - Get set up
- [Your First Project](./first-project.md) - Create something

## Questions?

- [Report issues](https://github.com/tcosentino/agent-dev-cycle/issues)
