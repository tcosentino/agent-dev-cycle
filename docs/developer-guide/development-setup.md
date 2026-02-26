# Development Setup

Get your local development environment ready to contribute to AgentForge.

## Prerequisites

Before you begin, ensure you have:

- **Node.js** v18 or higher ([Download](https://nodejs.org/))
- **Yarn** v1.22+ (`npm install -g yarn`)
- **Git** ([Download](https://git-scm.com/))
- **A code editor** (VS Code recommended)
- **macOS, Linux, or Windows** with WSL2

### Check Your Environment

```bash
# Check Node.js version (should be 18+)
node --version

# Check Yarn
yarn --version

# Check Git
git --version
```

## Clone the Repository

```bash
# Clone via HTTPS
git clone https://github.com/tcosentino/agent-dev-cycle.git
cd agent-dev-cycle

# Or clone via SSH (if you have SSH keys set up)
git clone git@github.com:agentforge/agent-dev-cycle.git
cd agent-dev-cycle
```

## Install Dependencies

AgentForge uses **Yarn Workspaces** to manage the monorepo.

```bash
# Install all dependencies for all packages/services
yarn install
```

This will:
- Install dependencies for the root workspace
- Install dependencies for all packages in `packages/`
- Install dependencies for all services in `src/services/`
- Link workspace dependencies automatically

**Time:** ~2-5 minutes depending on your connection

## Build Packages

Before running anything, build the TypeScript packages:

```bash
# Build all packages in dependency order
yarn build
```

This compiles TypeScript to JavaScript for all packages.

**Time:** ~30-60 seconds

## Database Setup

AgentForge uses SQLite for development (easy, no server required). The database is created automatically when the server starts.

### Seed with Sample Data (Optional)

```bash
# Seed with sample data
yarn seed
```

## Run the Development Server

### Start the Server

The dev command starts both the API server and UI:

```bash
# Start in development mode (with hot reload)
yarn dev
```

This runs concurrently:
- **AgentForge UI** (Vite) — React dashboard
- **API Server** — Hono-based REST API

### Access the UI

Open your browser to:
```
http://localhost:3000
```

You should see the AgentForge dashboard!

### Access the API

Test the API:
```bash
curl http://localhost:3000/api/projects
```

Should return JSON (empty array if no projects yet):
```json
[]
```

## Development Workflow

### 1. Make Changes

Edit code in any package or service:

```bash
# Example: Edit dataobject package
vim packages/dataobject/src/defineResource.ts

# Example: Edit a service
vim src/services/task-dataobject/index.ts

# Example: Edit UI
vim src/services/agentforge-ui/src/components/TaskCard/TaskCard.tsx
```

### 2. Hot Reload

**Backend Changes:**
- API/dataobjects: Restart Gateway (`yarn dev` watches and auto-restarts)

**Frontend Changes:**
- UI components: Vite hot-reloads automatically (no restart needed)

### 3. Build Packages (if needed)

If you edit a package that other code depends on:

```bash
# Rebuild specific package
cd packages/dataobject
yarn build

# Or rebuild everything
yarn build
```

### 4. Run Tests

```bash
# Run all tests
yarn test

# Run tests in watch mode
yarn test --watch

# Run tests for specific file
yarn test TaskCard

# Run tests with coverage
yarn test --coverage
```

### 5. Commit Changes

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
git add .
git commit -m "feat(dataobject): add custom actions API"

# Or
git commit -m "fix(ui): TaskCard priority indicator color"
# Or
git commit -m "docs: update contributing guide"
```

**Commit types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `refactor` - Code refactoring
- `test` - Adding tests
- `chore` - Maintenance tasks

## VS Code Setup (Recommended)

### Install Extensions

Recommended VS Code extensions:

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "vitest.explorer"
  ]
}
```

Install all recommended extensions:
- Open Command Palette (Cmd+Shift+P / Ctrl+Shift+P)
- Run: "Extensions: Show Recommended Extensions"
- Click "Install All"

### Workspace Settings

Create `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

### Launch Configuration

Create `.vscode/launch.json` for debugging:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Gateway",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "yarn",
      "runtimeArgs": ["dev"],
      "cwd": "${workspaceFolder}",
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    },
    {
      "name": "Debug Tests",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "yarn",
      "runtimeArgs": ["test"],
      "cwd": "${workspaceFolder}",
      "console": "integratedTerminal"
    }
  ]
}
```

## Environment Variables

Create `.env` file in the root:

```bash
# API Keys
ANTHROPIC_API_KEY=your-claude-api-key-here

# Database
DATABASE_URL=~/.agentforge/data/agentforge.db

# Server
PORT=3000
NODE_ENV=development

# GitHub (for GitHub integration)
GITHUB_TOKEN=your-github-token  # Optional
```

**Never commit `.env` to Git!** It's in `.gitignore`.

## Common Commands

### Package Management

```bash
# Install dependency for specific package
cd packages/dataobject
yarn add zod

# Remove dependency
yarn remove zod

# Update dependencies
yarn upgrade-interactive
```

### Building

```bash
# Build all UIs (agentforge + demo)
yarn build

# Build AgentForge UI only
yarn build:agentforge

# Build Demo UI only
yarn build:demo

# Build server
yarn build:server
```

### Testing

```bash
# Run all tests
yarn test

# Run tests in watch mode
yarn test --watch

# Run specific test file
yarn test TaskCard.test.tsx

# Run tests with coverage
yarn test --coverage

# Run tests for specific package
cd packages/dataobject
yarn test
```

### Database

```bash
# Seed database with sample data
yarn seed
```

## Troubleshooting

### Port 3000 Already in Use

**Error:** `EADDRINUSE: address already in use :::3000`

**Solution:**
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use the helper script
./scripts/kill-ports.sh 3000

# Or change port in .env
PORT=3001
```

### "Cannot find module '@agentforge/...'"

**Error:** TypeScript can't find workspace packages

**Solution:**
```bash
# Rebuild packages
yarn build

# Check workspace linking
yarn workspaces info

# Reinstall if needed
rm -rf node_modules
yarn install
yarn build
```

### Database Locked

**Error:** `SQLITE_BUSY: database is locked`

**Solution:**
```bash
# Stop Gateway
# (Ctrl+C if running)

# Check for other processes
lsof ~/.agentforge/data/agentforge.db

# Kill if needed
kill -9 <PID>
```

### TypeScript Errors After Pulling

**Error:** Type errors after `git pull`

**Solution:**
```bash
# Reinstall dependencies (in case package.json changed)
yarn install

# Rebuild packages
yarn build

# Restart VS Code TypeScript server
# Cmd+Shift+P → "TypeScript: Restart TS Server"
```

### Build Fails

**Error:** Build errors in packages

**Solution:**
```bash
# Clean and reinstall
rm -rf node_modules
yarn install
yarn build
```

### Tests Fail

**Error:** Tests failing locally

**Solution:**
```bash
# Make sure packages are built
yarn build

# Run tests in watch mode to debug
yarn test --watch
```

## Next Steps

Now that you're set up:

1. **Read the Architecture docs** - Understand how AgentForge works
   - [Architecture Overview](./architecture/overview.md)
   - [Monorepo Structure](./architecture/monorepo-structure.md)
   - [Workload Lifecycle](./architecture/workload-lifecycle.md)

2. **Read the Contributing Guide** - Learn the workflow
   - [Contributing](./contributing.md)

3. **Find an Issue** - Start contributing!
   - [Issues](https://github.com/tcosentino/agent-dev-cycle/issues)

## Tips for Productive Development

### 1. Use Watch Mode

Keep tests running in the background:
```bash
yarn test --watch
```

### 2. Use Terminal Multiplexer

Run multiple processes (tmux or screen):
```
┌─────────────────┬─────────────────┐
│  Gateway        │  Tests          │
│  yarn dev       │  yarn test -w   │
├─────────────────┼─────────────────┤
│  Logs           │  Git            │
│  tail -f ...    │  git status     │
└─────────────────┴─────────────────┘
```

### 3. Hot Reload Everything

- UI: Vite hot-reloads automatically
- API: Gateway restarts on file change
- Tests: Watch mode re-runs affected tests

### 4. Use Git Worktrees

Work on multiple branches simultaneously:
```bash
# Create worktree for feature branch
git worktree add ../agentforge-feature-x feature/new-feature

# Now you have two checkouts:
# ./agent-dev-cycle (main branch)
# ../agentforge-feature-x (feature branch)
```

### 5. Commit Often

Make small, focused commits. Easy to review, easy to revert:
```bash
git commit -m "feat(ui): add TaskCard component"
git commit -m "feat(ui): add TaskBoard layout"
git commit -m "test(ui): add TaskCard tests"
```

## Getting Help

If you're stuck:

- [Report issues](https://github.com/tcosentino/agent-dev-cycle/issues)
