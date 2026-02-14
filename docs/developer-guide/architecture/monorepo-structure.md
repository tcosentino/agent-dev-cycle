# Monorepo Structure

Understanding how AgentForge's codebase is organized and where to find things.

## Overview

AgentForge uses a **monorepo** managed with **Yarn Workspaces**. All packages and services live in a single repository, making it easy to:
- Share code between packages
- Test changes across the entire stack
- Version everything together
- Refactor with confidence

## Directory Layout

```
agent-dev-cycle/
├── packages/                     # Shared libraries (@agentforge/*)
├── src/services/                 # Application services
├── runner/                       # Agent orchestrator
├── openspec/                     # Feature specifications
├── docs/                         # Documentation
├── scripts/                      # Build and utility scripts
├── tests/                        # Integration and E2E tests
├── website/                      # Documentation site (Docusaurus)
├── .github/                      # GitHub Actions workflows
├── node_modules/                 # Dependencies (managed by Yarn)
├── package.json                  # Root package.json
├── yarn.lock                     # Dependency lock file
├── tsconfig.json                 # Root TypeScript config
├── vitest.config.ts              # Test configuration
└── README.md
```

## Packages (`packages/`)

Shared libraries that can be imported by services and other packages.

```
packages/
├── dataobject/                # @agentforge/dataobject
│   ├── src/
│   │   ├── index.ts          # Public API
│   │   ├── defineResource.ts # Core defineResource function
│   │   ├── validation.ts     # Zod integration
│   │   └── types.ts          # TypeScript types
│   ├── package.json          # Package metadata
│   ├── tsconfig.json         # TypeScript config
│   └── README.md
│
├── server/                    # @agentforge/server
│   ├── src/
│   │   ├── index.ts          # Express server wrapper
│   │   ├── routes.ts         # Auto-generated REST routes
│   │   ├── middleware.ts     # Request validation, etc.
│   │   └── types.ts
│   └── package.json
│
├── runtime/                   # @agentforge/runtime
│   ├── src/
│   │   ├── index.ts          # Agent execution engine
│   │   ├── executor.ts       # Claude API integration
│   │   ├── tools.ts          # Tool implementations
│   │   └── types.ts
│   └── package.json
│
├── ui-components/             # @agentforge/ui-components
│   ├── src/
│   │   ├── index.ts          # Component exports
│   │   ├── components/
│   │   │   ├── TaskCard/
│   │   │   ├── TaskBoard/
│   │   │   ├── TaskForm/
│   │   │   └── ...
│   │   └── types.ts
│   └── package.json
│
├── logger/                    # @agentforge/logger
├── testing-framework/         # @agentforge/testing-framework
└── dataobject-react/          # @agentforge/dataobject-react
```

### Package Naming Convention

All packages use the `@agentforge/` scope:
- `@agentforge/dataobject`
- `@agentforge/server`
- `@agentforge/ui-components`

This makes imports clear:
```typescript
import { defineResource } from '@agentforge/dataobject'
import { TaskCard } from '@agentforge/ui-components'
```

### Package Types

**Framework Packages** (core infrastructure)
- `dataobject` - Data modeling framework
- `server` - HTTP server
- `runtime` - Agent execution

**UI Packages** (frontend)
- `ui-components` - React components
- `dataobject-react` - Auto-generated React hooks

**Utility Packages**
- `logger` - Logging utilities
- `testing-framework` - Test-spec linkage

## Services (`src/services/`)

Application-specific code organized by domain.

```
src/services/
├── project-dataobject/        # Projects
├── task-dataobject/           # Tasks
├── deployment-dataobject/     # Deployments
├── workload-dataobject/       # Workload instances
├── agent-session-dataobject/  # Agent sessions
├── agent-status-dataobject/   # Agent status
├── channel-dataobject/        # Communication channels
├── message-dataobject/        # Messages
├── user-dataobject/           # Users
├── task-comment-dataobject/   # Task comments
│
├── github-integration/        # GitHub API
├── claude-auth-integration/   # Claude auth
├── agent-session-integration/ # Agent session management
│
├── agentforge-ui/             # Main UI (Vite + React)
├── demo-ui/                   # Demo/example UI
│
└── testing/                   # Testing utilities
```

### Service Categories

**Dataobject Services** (`*-dataobject`)
```
task-dataobject/
├── index.ts           # Resource definition
├── schema.ts          # Zod schema (optional)
├── hooks.ts           # React hooks (auto-generated)
├── service.json       # Service metadata
└── README.md
```

Exports:
- Resource definition (`taskResource`)
- TypeScript types
- React Query hooks (`useTasks`, `useCreateTask`, etc.)

**Integration Services** (`*-integration`)
```
github-integration/
├── index.ts           # GitHub API client
├── auth.ts            # OAuth flow
├── webhooks.ts        # Webhook handlers
└── types.ts
```

Responsibilities:
- External API communication
- Authentication/authorization
- Data transformation

**UI Services** (`*-ui`)
```
agentforge-ui/
├── src/
│   ├── index.tsx              # Entry point
│   ├── App.tsx                # Root component
│   ├── components/
│   │   ├── ProjectViewer/
│   │   ├── TasksPage/
│   │   └── DeploymentDashboard/
│   ├── api.ts                 # API client
│   └── types.ts
├── index.html
├── vite.config.ts
└── package.json
```

Built with Vite, served by the Gateway.

## Runner (`runner/`)

Agent orchestrator - processes workloads, runs agents.

```
runner/
├── src/
│   ├── index.ts           # Main entry point
│   ├── workload-processor.ts  # Workload lifecycle
│   ├── agent-executor.ts      # Agent execution
│   ├── deployer.ts            # Docker/process management
│   └── types.ts
├── package.json
└── tsconfig.json
```

Can run:
- As part of Gateway (same process)
- Standalone (separate process)

## OpenSpec (`openspec/`)

Feature specifications using the OpenSpec format.

```
openspec/
├── changes/                   # Work in progress
│   ├── new-agent-button/
│   │   ├── .openspec.yaml
│   │   ├── proposal.md
│   │   ├── design.md
│   │   ├── specs/
│   │   └── tasks.md
│   ├── agent-marketplace/
│   └── project-settings/
│
└── specs/                     # Completed features
    └── task-management-ui/
        ├── .openspec.yaml
        ├── proposal.md
        ├── design.md
        ├── specs/
        │   ├── task-crud/spec.md
        │   ├── task-board/spec.md
        │   └── auto-key-generation/spec.md
        ├── tasks.md
        └── coverage.json      # Test coverage manifest
```

**Workflow:**
1. New feature → create in `changes/`
2. Implement → mark tasks complete
3. Merge → move to `specs/`

## Documentation (`docs/`)

All documentation organized by audience.

```
docs/
├── user-guide/
│   ├── getting-started/
│   ├── tutorials/
│   ├── how-to/
│   ├── concepts/
│   ├── reference/
│   └── troubleshooting/
│
└── developer-guide/
    ├── architecture/
    │   ├── overview.md
    │   ├── workload-lifecycle.md
    │   └── monorepo-structure.md
    ├── development-setup.md
    ├── contributing.md
    └── testing-guide.md
```

Will be integrated into Docusaurus site (`website/`).

## Scripts (`scripts/`)

Build and utility scripts.

```
scripts/
├── build.sh                # Build all packages
├── test.sh                 # Run all tests
├── generate-spec-coverage.ts  # Generate test coverage
├── kill-ports.sh           # Free up development ports
└── db/
    ├── migrate.ts          # Database migrations
    └── seed.ts             # Seed data
```

## Configuration Files

### Root Level

**package.json**
```json
{
  "name": "agent-dev-cycle",
  "private": true,
  "workspaces": [
    "packages/*",
    "src/services/*",
    "runner"
  ],
  "scripts": {
    "build": "yarn workspaces foreach -pt run build",
    "test": "vitest",
    "coverage:spec": "tsx scripts/generate-spec-coverage.ts"
  }
}
```

**tsconfig.json** (root)
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "paths": {
      "@agentforge/*": ["./packages/*/src"]
    }
  }
}
```

**vitest.config.ts**
```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: './vitest.setup.ts',
  },
})
```

### Per-Package

Each package has its own:
- `package.json` - Dependencies, scripts, exports
- `tsconfig.json` - Extends root config
- `README.md` - Package documentation

## Import Paths

### Package Imports

```typescript
// From any workspace, import published packages
import { defineResource } from '@agentforge/dataobject'
import { TaskCard } from '@agentforge/ui-components'
```

### Service Imports

```typescript
// Services import from packages
import { defineResource } from '@agentforge/dataobject'

// Services can import from other services (but discouraged)
import { projectResource } from '../project-dataobject'
```

### Relative Imports

```typescript
// Within a package/service
import { validateSchema } from './validation'
import { Task } from './types'
```

## Build Process

### TypeScript Compilation

Each package builds independently:

```bash
# Build single package
cd packages/dataobject
yarn build

# Build all packages (in dependency order)
yarn build
```

Output:
```
packages/dataobject/
├── src/           # Source (TypeScript)
└── dist/          # Compiled (JavaScript + .d.ts)
    ├── index.js
    ├── index.d.ts
    └── ...
```

### UI Services

Vite builds UI services:

```bash
cd src/services/agentforge-ui
yarn build
```

Output:
```
agentforge-ui/
├── src/           # Source
└── dist/          # Production build
    ├── index.html
    ├── assets/
    │   ├── index-abc123.js
    │   └── index-def456.css
    └── ...
```

## Dependency Management

### Workspace Dependencies

Packages can depend on each other:

```json
// packages/server/package.json
{
  "dependencies": {
    "@agentforge/dataobject": "workspace:*"
  }
}
```

`workspace:*` = Always use local version from workspace.

### External Dependencies

Install at root or per-package:

```bash
# Add to root (available everywhere)
yarn add zod

# Add to specific package
cd packages/dataobject
yarn add zod
```

### Hoisting

Yarn hoists common dependencies to root `node_modules/`:

```
node_modules/
├── @agentforge/
│   ├── dataobject -> ../../packages/dataobject
│   └── server -> ../../packages/server
├── zod/            # Shared dependency
├── react/          # Shared dependency
└── ...
```

Benefits:
- Disk space savings
- Faster installs
- Single version of shared deps

## Development Workflow

### 1. Make Changes

Edit code in any package or service:

```bash
# Edit a package
vim packages/dataobject/src/defineResource.ts

# Edit a service
vim src/services/task-dataobject/index.ts
```

### 2. Build

```bash
# Build just what changed
cd packages/dataobject
yarn build

# Or build everything
yarn build
```

### 3. Test

```bash
# Run all tests
yarn test

# Test specific package
cd packages/dataobject
yarn test

# Test with coverage
yarn test --coverage
```

### 4. Commit

```bash
git add .
git commit -m "feat(dataobject): add custom actions support"
git push
```

## Common Tasks

### Add a New Package

```bash
# Create directory
mkdir packages/new-package
cd packages/new-package

# Initialize package.json
yarn init

# Update name to use @agentforge scope
# "name": "@agentforge/new-package"

# Add to root package.json workspaces (auto-detected with packages/*)
```

### Add a New Service

```bash
# Create directory
mkdir src/services/new-service
cd src/services/new-service

# Create files
touch index.ts service.json README.md

# Add to root package.json workspaces (auto-detected with src/services/*)
```

### Link Packages Locally

Workspaces are auto-linked. No need for `npm link`!

```typescript
// Anywhere in the monorepo
import { defineResource } from '@agentforge/dataobject'
// ↑ Resolves to packages/dataobject/src/index.ts
```

### Update Dependencies

```bash
# Update all workspaces
yarn upgrade-interactive

# Update specific package
cd packages/dataobject
yarn upgrade zod
```

## Troubleshooting

### "Cannot find module '@agentforge/...'"

**Cause:** Package not built or workspace not linked

**Solution:**
```bash
# Rebuild packages
yarn build

# Or rebuild specific package
cd packages/dataobject
yarn build
```

### "Module has no exported member"

**Cause:** TypeScript types not generated

**Solution:**
```bash
# Clean and rebuild
yarn clean
yarn build
```

### Dependency Conflicts

**Cause:** Multiple versions of same package

**Solution:**
```bash
# Check dependencies
yarn why <package-name>

# Deduplicate
yarn dedupe

# Force single version (package.json)
"resolutions": {
  "react": "18.2.0"
}
```

## Best Practices

### 1. Keep Packages Focused

Each package should have a single, clear purpose.

✅ Good:
- `@agentforge/dataobject` - Data modeling only
- `@agentforge/server` - HTTP server only

❌ Bad:
- `@agentforge/utils` - Grab bag of unrelated utilities

### 2. Minimize Cross-Service Dependencies

Services should mostly depend on packages, not other services.

✅ Good:
```typescript
// task-dataobject → @agentforge/dataobject
import { defineResource } from '@agentforge/dataobject'
```

❌ Avoid:
```typescript
// task-dataobject → project-dataobject
import { projectResource } from '../project-dataobject'
```

### 3. Use Workspace Dependencies

Always use `workspace:*` for internal dependencies:

```json
{
  "dependencies": {
    "@agentforge/dataobject": "workspace:*"
  }
}
```

### 4. Build in Dependency Order

Yarn automatically builds packages in the right order based on dependencies.

```bash
# Builds packages in correct order
yarn workspaces foreach -pt run build
```

## Related Documentation

- [Architecture Overview](./overview.md)
- [Development Setup](../development-setup.md)
- [Contributing Guide](../contributing.md)
