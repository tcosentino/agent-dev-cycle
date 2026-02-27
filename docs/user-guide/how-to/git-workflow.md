# Git Workflow & Repository Structure

Understanding how your Git repository works with AgentForge and what gets created.

## Overview

AgentForge works with **your existing Git repository**. It doesn't replace Git - it enhances it by adding:
- AI agents that commit code
- Structured project metadata
- Task and deployment tracking

Your repository remains a normal Git repo that you can push, pull, and collaborate on like any other project.

## How It Works

### 1. Connect Your Repository

When you create an AgentForge project, you link it to a Git repository:

```bash
# Create project pointing to existing repo
agentforge project create \
  --name "My App" \
  --repo ~/repos/my-app

# Or connect to a GitHub repo
agentforge project create \
  --name "My App" \
  --github username/my-app
```

AgentForge doesn't clone or modify your repo immediately. It just records the path/URL.

### 2. AgentForge Adds Metadata

Once connected, AgentForge creates a `.agentforge/` directory in your repository:

```
your-repo/
├── .agentforge/              # ← AgentForge metadata
│   ├── project.yaml          # Project configuration
│   ├── agents/               # Agent definitions
│   │   ├── architect.md
│   │   ├── engineer.md
│   │   └── qa.md
│   └── tasks/                # Task tracking (optional)
├── .git/                     # Your Git history
├── src/                      # Your application code
├── package.json
└── README.md
```

**Important:** The `.agentforge/` directory is **part of your repository**. You commit it to Git along with your code.

### 3. Agents Work in Your Repo

When an agent completes a task:

1. Agent reads your code
2. Agent makes changes (creates/modifies files)
3. Agent stages changes (`git add`)
4. Agent commits with clear message (`git commit`)
5. You review the commit
6. You push when ready (`git push`)

**Agents don't automatically push.** You stay in control of what goes to GitHub.

## What AgentForge Creates

### `.agentforge/` Directory

This is the metadata folder AgentForge adds to your repository.

#### `project.yaml`

Project configuration:

```yaml
# .agentforge/project.yaml
id: proj-abc123
name: My App
key: MYAPP
created: 2026-02-14T12:00:00Z

# Optional settings
runtime:
  adapter: docker
  timeout: 600

agents:
  defaultTimeout: 300
```

#### `agents/` - Agent Definitions

Markdown files defining AI agents that can work on your project:

```
.agentforge/agents/
├── architect.md    # System design and architecture
├── engineer.md     # Code implementation
├── qa.md           # Testing and quality assurance
└── lead.md         # Code review
```

**Example agent file:**

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
- Test your code before committing
```

You can edit these files to customize agent behavior!

#### `tasks/` - Task Definitions (Optional)

Some teams track tasks in the repository:

```yaml
# .agentforge/tasks/MYAPP-1.yaml
id: MYAPP-1
title: Add user authentication
description: Implement JWT-based auth
status: in-progress
assignee: engineer
created: 2026-02-14
```

This is optional - you can also track tasks only in AgentForge's database.

### Context Files (Root Level)

AgentForge encourages you to add these files to your repository root:

#### `PROJECT.md`

Explains what your project is (for humans and agents):

```markdown
# My App

## Overview
A todo list application built with React and Express.

## Architecture
- Frontend: React + TypeScript
- Backend: Express + PostgreSQL
- Deployment: Docker

## Key Components
- `/src/frontend` - React app
- `/src/backend` - Express API
- `/src/shared` - Shared types

## Development
\```bash
npm install
npm run dev
\```

## Conventions
- Commit messages: Conventional Commits
- Branch naming: feature/task-name
- Testing: Write tests for all new features
```

This file helps agents understand your project context.

#### `AGENTS.md`

Guidelines for agents working on this project:

```markdown
# Agent Guidelines

## Your Role
You are working on a full-stack web application.

## Boundaries
- Don't delete existing code without asking
- Don't make breaking changes without discussion
- Ask if requirements are unclear

## Conventions
- TypeScript strict mode
- ESLint + Prettier for formatting
- Vitest for testing
- Commit format: type(scope): subject

## Tools Available
- File system (read/write)
- Shell commands
- Web search
- Git operations
```

This prevents agents from making unwanted changes.

#### `MEMORY.md` (Optional)

Project history and decisions (human-curated):

```markdown
# Project Memory

## Key Decisions
- 2026-02-01: Chose PostgreSQL over MongoDB for relational data
- 2026-02-05: Decided on JWT for auth (not sessions)

## Lessons Learned
- Don't run migrations in production without backup
- Test deployment flow in staging first

## Known Issues
- Database connection pool needs tuning under load
```

Helps agents (and humans) understand why things are the way they are.

## Git Workflow

### Agent Commits

When an agent completes work:

```bash
# Agent stages changes
git add src/auth/login.ts
git add src/auth/signup.ts

# Agent commits with descriptive message
git commit -m "feat(auth): implement JWT authentication

- Add login endpoint (POST /auth/login)
- Add signup endpoint (POST /auth/signup)
- Add middleware for protected routes
- Include tests for auth flow

Completes task MYAPP-5"
```

**You review the commit** just like any other code:

```bash
# See what the agent did
git log -1

# View the diff
git show HEAD

# Amend if needed
git commit --amend

# Or revert if wrong
git revert HEAD
```

### Your Workflow

1. **Create tasks** in AgentForge
2. **Assign to agents**
3. **Agents work** and commit
4. **You review** commits
5. **You push** to GitHub when ready
6. **Team collaborates** via pull requests

### Branching Strategy

AgentForge works with any Git workflow:

**Feature Branches (Recommended):**
```bash
# Create branch for task
git checkout -b feature/user-auth

# Assign task to agent
# Agent commits to this branch

# Review commits
git log

# Push feature branch
git push origin feature/user-auth

# Open PR on GitHub
# Merge after review
```

**Trunk-Based (Direct to main):**
```bash
# Agent commits directly to main
# You review and push
git push origin main
```

**GitFlow:**
```bash
# Use develop branch
git checkout develop

# Agent commits to develop or feature branches
# Merge to main via release branches
```

AgentForge doesn't enforce a specific workflow - use what works for your team!

## What AgentForge Doesn't Touch

AgentForge **never modifies**:

- Your `.git/` directory (Git history)
- Your `.github/` workflows (CI/CD)
- Your existing code (unless explicitly instructed)
- Your dependency files (unless adding dependencies for a task)

AgentForge **only adds/modifies**:

- `.agentforge/` metadata
- Files agents create/modify for tasks
- Context files you ask agents to update

## Multi-User Collaboration

### Sharing AgentForge Projects

**Scenario:** Your team all uses AgentForge

1. **One person creates project** and commits `.agentforge/`
2. **Team members pull** from GitHub
3. **Each person connects** their AgentForge to the project:
   ```bash
   agentforge project import ~/repos/team-repo
   ```
4. **Everyone can run agents** on their local copy
5. **Collaborate via Git** (pull requests, code review)

### Mixed Teams (Some Use AgentForge, Some Don't)

**Scenario:** Only you use AgentForge, teammates don't

1. **You use agents** to write code
2. **Agents commit** to your local repo
3. **You push** to feature branch
4. **Teammates review** PR on GitHub
5. **They don't see agent involvement** - just normal commits

The `.agentforge/` directory can be ignored by teammates if they want:

```gitignore
# .gitignore (if team doesn't use AgentForge)
.agentforge/
```

Though it's harmless to keep it!

## Common Scenarios

### Scenario 1: Starting a New Project

```bash
# Create repo
mkdir my-app
cd my-app
git init
git remote add origin github.com/you/my-app.git

# Create AgentForge project
agentforge project create \
  --name "My App" \
  --repo $(pwd)

# AgentForge creates .agentforge/
# Commit it
git add .agentforge/
git add PROJECT.md AGENTS.md
git commit -m "chore: initialize AgentForge project"
git push
```

### Scenario 2: Adding AgentForge to Existing Project

```bash
# You have existing repo
cd existing-project

# Connect to AgentForge
agentforge project create \
  --name "Existing Project" \
  --repo $(pwd)

# AgentForge adds .agentforge/
git status
# Untracked: .agentforge/

# Commit AgentForge metadata
git add .agentforge/ PROJECT.md
git commit -m "chore: add AgentForge configuration"
git push
```

### Scenario 3: Cloning a Project with AgentForge

```bash
# Clone from GitHub
git clone github.com/team/project.git
cd project

# .agentforge/ already exists (committed by teammate)

# Import into your AgentForge
agentforge project import $(pwd)

# You can now run agents!
agentforge task create --title "Add feature"
agentforge run --task PROJECT-5 --agent engineer
```

### Scenario 4: Removing AgentForge

```bash
# Stop using AgentForge but keep Git repo
cd your-project

# Remove .agentforge/ directory
rm -rf .agentforge/

# Commit removal
git commit -am "chore: remove AgentForge"
git push

# Your code remains intact!
```

## Git Best Practices with AgentForge

### 1. Review Agent Commits

Always review what agents did before pushing:

```bash
# See last commit
git show

# See full diff
git diff HEAD~1

# Interactive rebase to clean up commits
git rebase -i HEAD~5
```

### 2. Use Feature Branches

Keep main branch stable:

```bash
# New feature = new branch
git checkout -b feature/add-auth

# Let agent work on this branch
agentforge run --task PROJECT-5

# Review, test, then merge
git checkout main
git merge feature/add-auth
```

### 3. Write Good Commit Messages

Agents try to write good commits, but you can amend:

```bash
# Amend last commit message
git commit --amend -m "Better description"

# Or amend and add more changes
git add forgotten-file.ts
git commit --amend --no-edit
```

### 4. Keep `.agentforge/` in Sync

Always commit `.agentforge/` changes:

```bash
# When you update agent definitions
git add .agentforge/agents/engineer.md
git commit -m "chore: update engineer agent guidelines"
```

### 5. Use .gitignore Wisely

AgentForge respects your `.gitignore`. Common patterns:

```gitignore
# Dependencies
node_modules/

# Build output
dist/
build/

# Environment files
.env
.env.local

# OS files
.DS_Store
Thumbs.db

# Keep .agentforge/ tracked!
# (Don't add .agentforge/ to gitignore)
```

## Troubleshooting

### `.agentforge/` Directory Missing

**Problem:** Cloned repo but no `.agentforge/` folder

**Cause:** Original creator didn't commit `.agentforge/` to Git

**Solution:**
```bash
# Create project (re-creates .agentforge/)
agentforge project create --name "Project" --repo $(pwd)

# Or import if it was created before
agentforge project import $(pwd)
```

### Agent Commits Not Showing in GitHub

**Problem:** Agent committed but changes aren't on GitHub

**Cause:** Commits are local - you need to push!

**Solution:**
```bash
# Push to GitHub
git push origin main
```

### Merge Conflicts with `.agentforge/`

**Problem:** Git merge conflict in `.agentforge/project.yaml`

**Cause:** Multiple people edited project settings

**Solution:**
```bash
# Resolve conflict manually
vim .agentforge/project.yaml
# Pick correct version or merge manually

git add .agentforge/project.yaml
git commit -m "chore: resolve merge conflict"
```

### Agent Modified Wrong Files

**Problem:** Agent changed files it shouldn't have

**Solution:**
```bash
# Revert agent's commit
git revert HEAD

# Or reset (careful - loses changes!)
git reset --hard HEAD~1

# Or cherry-pick the good parts
git checkout HEAD~1 -- good-file.ts
```

## Summary

✅ **AgentForge and Git work together**
- AgentForge adds `.agentforge/` metadata to your repo
- Agents commit code changes
- You review and push like normal Git workflow

✅ **You're always in control**
- Agents don't auto-push
- You can review, amend, or revert any commit
- Standard Git tools work normally

✅ **Team-friendly**
- `.agentforge/` can be committed and shared
- Or ignored if teammates don't use AgentForge
- Collaborate via normal Git workflows (PRs, code review)

## Next Steps

- [Create Your First Project](../getting-started/first-project.md)
- [Core Concepts](../getting-started/core-concepts.md)

---

**Questions?** [Report issues](https://github.com/tcosentino/agent-dev-cycle/issues).
