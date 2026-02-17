# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Bug Fixing Process

When a bug or issue is reported:

1. First, write a test that reproduces the bug
2. Run the test to verify it fails
3. Fix the bug
4. Run the test to verify it passes

Do not skip the test step - always reproduce the issue with a failing test first.

## Project Overview

AgentForge - AI-powered custom software development service demo with:

- Multiple UIs (landing page, AgentForge UI dashboard, component previews)
- Real-time deployment monitoring with SSE (Server-Sent Events)
- Docker container orchestration for workloads
- GitHub OAuth integration
- DataObject framework for auto-generated REST APIs

## Architecture

### Monorepo Structure

- `packages/server/` - DataObject-based API server framework
  - Auto-generates REST endpoints from resource definitions
  - Supports SQLite and in-memory storage
  - Plugin architecture for custom integrations
- `packages/ui-components/` - Shared React component library
- `src/services/` - Service modules
  - `agentforge-ui/` - Main dashboard UI (React + Vite)
  - `demo-ui/` - Landing page and component demos
  - `workload-orchestrator/` - Docker container lifecycle management
  - `workload-integration/` - REST API + SSE endpoints for deployments

### Key Technologies

- TypeScript
- React (UI layer)
- Vite (build tool)
- Hono (web framework)
- better-sqlite3 (database)
- Docker (for workload containers)
- Server-Sent Events (real-time updates)

## Commands

```bash
yarn dev            # Start development server
yarn build          # Build all packages (agentforge-ui + demo-ui)
yarn build:agentforge  # Build AgentForge UI only
yarn build:demo     # Build demo UI only
yarn preview        # Preview production build
```

## Structure

### Landing Page / Demo UI

- `src/services/demo-ui/main.ts` - Main entry point
- `src/services/demo-ui/style.css` - Styles

### AgentForge Dashboard UI

- `src/services/agentforge-ui/` - React dashboard application
  - `components/` - React components
    - `DeploymentDashboard.tsx` - Main deployment view
    - `DeploymentViews.tsx` - Deployment list and workload detail views
    - `DeploymentCard.tsx` - Deployment card with workload list
    - `WorkloadCard.tsx` - Workload card with horizontal pipeline visualizer
    - `AgentSessionPanel/` - Agent session management components
  - `hooks/` - Custom React hooks
    - `useDeploymentStream.ts` - SSE connection for real-time deployment updates
    - `useAgentSessionProgress.ts` - Agent session SSE monitoring
  - `api.ts` - API client functions
  - `types.ts` - TypeScript type definitions
  - `ProjectViewer.tsx` - Main project viewer component

### Shared UI Components

- `packages/ui-components/src/components/` - Reusable React components
  - `ExecutionLogPanel/` - Collapsible 2-column stage sections with logs
  - `ExecutionHeader/` - Status badge with flexible action slots
  - `ExecutionControls/` - Conditional lifecycle buttons (job vs service mode)
  - `ErrorBoundary/` - Error boundary with copy error functionality
  - `Badge/`, `Modal/`, `Toast/` - Basic UI primitives

### Backend Services

- `src/services/workload-orchestrator/` - Container orchestration
  - `index.ts` - Main orchestrator with lifecycle management
  - `events.ts` - Event emitter for workload and deployment events
- `src/services/workload-integration/` - API integration
  - `index.ts` - Registers REST endpoints and SSE streams

### Server Framework

- `packages/server/src/`
  - `server.ts` - Core server creation and routing
  - `dataobject.ts` - Resource definition framework
  - `discover.ts` - Auto-discovery of modules
  - `types.ts` - Type definitions

## UI Architecture

### Unified Execution Views

Agent sessions and workload deployments share a common UI infrastructure:

**Shared Components:**

- `ExecutionLogPanel` - Displays logs in collapsible 2-column sections (stage label | logs)
  - Each stage row independently collapsible/expandable
  - Status circles with colors (gray pending → blue running → green success / red failed)
  - Duration display in stage labels
  - Color-coded log levels (blue info, yellow warn, red error)
  - Auto-scroll support
- `ExecutionHeader` - Status badge with flexible action slot for buttons
- `ExecutionControls` - Conditional buttons based on execution type:
  - Job mode (agent sessions): Cancel/Retry buttons
  - Service mode (workloads): Stop/Restart buttons

**View-Specific Features:**

Agent Sessions (job-style):

- Session detail header with agent type and phase
- Task prompt display
- Summary and commit SHA on completion
- Cancel button (jobs should be cancellable)
- Retry button on failure

Workloads (service or job):

- Horizontal pipeline visualizer in cards (compact view)
- Collapsible stage sections in detail view
- Artifact URL display (services expose endpoints)
- Module type/name metadata
- Stop/Restart controls (services need lifecycle management)

**Layout Pattern:**

Both views use identical collapsible 2-column stage layout in detail views:

- Left column: Stage name with status circle and duration
- Right column: Logs for that stage (collapsible)
- Clicking stage row toggles collapse/expand
- Expand/Collapse All and Copy All Logs buttons

## Real-Time Architecture

### SSE (Server-Sent Events) Streams

The application uses SSE for real-time updates:

**Endpoint:** `GET /api/projects/:projectId/deployments/stream`

**Events:**

- `init` - Initial state with all deployments and workloads
- `workload-update` - Workload stage/status changes
- `deployment-deleted` - Deployment removal
- `ping` - Keep-alive (every 15 seconds)

**Event Flow:**

1. Client connects via `useDeploymentStream` hook
2. Server sends initial state with all deployments
3. Server emits events via `workloadEvents` EventEmitter
4. SSE stream forwards events to connected clients
5. Client updates React state, triggering re-render

### Workload Lifecycle

1. **Creation** - Deployment and workload records created in DB
2. **Starting** - `orchestrator.start()` clones repo, builds container
3. **Running** - Container executes, stages emit progress updates
4. **Stopping** - `orchestrator.stop()` gracefully shuts down container
5. **Restarting** - `orchestrator.restart()` performs stop + start sequence
6. **Deletion** - Records deleted, `deployment-deleted` event emitted

**Stages:**

- `starting-container` - Docker container initialization
- `cloning-repo` - Git clone operation
- `starting-service` - Service startup
- `running` - Active execution
- `graceful-shutdown` - Clean shutdown
- `stopped` - Container terminated

**Control Operations:**

- `stop` - Stops a running workload, validates state before stopping
- `restart` - Restarts a workload (stop + start), works on running/stopped/failed workloads
- Operation locking prevents concurrent operations on the same workload

## DataObject Framework

Resources are defined declaratively and automatically generate CRUD endpoints:

```typescript
export const myResource = {
  name: 'myResource',
  fields: {
    id: { type: 'string', primaryKey: true },
    name: { type: 'string', required: true },
    // ... more fields
  }
}
```

Auto-generated endpoints:

- `GET /api/myResources` - List all
- `GET /api/myResources/:id` - Get one
- `POST /api/myResources` - Create
- `PATCH /api/myResources/:id` - Update
- `DELETE /api/myResources/:id` - Delete

### Workload Control Endpoints

Custom endpoints for workload lifecycle management:

- `POST /api/deployments/:deploymentId/workloads/:workloadId/stop` - Stop a running workload
- `POST /api/deployments/:deploymentId/workloads/:workloadId/restart` - Restart a workload
- `GET /api/deployments/:deploymentId/workloads/:workloadId/logs` - Get workload logs

These endpoints:

- Validate workload state before operations (prevents stopping already-stopped workloads, etc.)
- Use operation locking to prevent concurrent operations on the same workload
- Return structured error responses (InvalidState, Conflict, NotFound)
- Emit SSE events for real-time UI updates

## Integration Services

Services can register custom endpoints that override or extend auto-generated ones:

```typescript
export const myIntegration: IntegrationService = {
  name: 'my-integration',
  version: '1.0.0',
  register(app: OpenAPIHono, ctx: IntegrationContext) {
    // Access stores
    const store = ctx.stores.get('resource')

    // Register custom endpoints
    app.post('/api/custom', async (c) => {
      // ... custom logic
    })
  }
}
```

## Common Patterns

### Event-Driven Updates

When making changes that affect multiple clients:

1. Perform the database operation
2. Emit an event via `workloadEvents`
3. SSE streams forward event to connected clients
4. Clients update their state reactively

Example: Deleting a deployment

```typescript
await deploymentStore.delete(deploymentId)
workloadEvents.emitDeploymentDeleted({ deploymentId, projectId })
```

### Error Handling

- API errors return JSON with `{ error: string, message?: string }`
- UI shows toast notifications for user feedback
- SSE errors trigger automatic reconnection with exponential backoff

## Known Issues & Solutions

### Page Reloads

**Problem:** Operations that modify state cause full page reloads

**Solution:** Use SSE events to update React state instead of `window.location.reload()`

### State Synchronization

**Problem:** Multiple clients may have stale data

**Solution:** SSE keeps all connected clients synchronized in real-time

## Development Guidelines

### Real-Time Updates

- Always use SSE events for real-time updates, never reload the page
- Test that SSE events are emitted for all state-changing operations
- Ensure event listeners are cleaned up on component unmount
- Use TypeScript interfaces for event payloads
- Keep event names consistent (e.g., 'deployment-deleted', 'workload-update')

### Component Organization

- Each React component should be in its own file
- Only include multiple components in a single file for tiny sub-components that are tightly coupled
- File name should match the primary component name (e.g., `DeploymentCard.tsx` exports `DeploymentCard`)
- Keep components focused and single-purpose

### Documentation

- When completing work, suggest changes to CLAUDE.md based on new learnings

### Communication

- When applicable, end messages with short instructions on what the user needs to do to test/validate the changes
- Keep validation steps concise and actionable (e.g., "Run `yarn dev` and check the deployment dashboard")

## Agent Memory

The `.agentforge/memory/` directory contains memories of bugs fixed, patterns learned, and architectural decisions. See [.agentforge/memory/index.md](.agentforge/memory/index.md) for a complete list.

When fixing bugs or learning new patterns:

1. Document the finding in a new memory file (topic-based name)
2. Update the index with a 1-line summary and date
3. Include code references and before/after examples
