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
    - `DeploymentViews.tsx` - Deployment list and detail views
    - `LogViewer.tsx` - Log viewing modal
    - `HealthBadge.tsx` - Status indicators
  - `hooks/` - Custom React hooks
    - `useDeploymentStream.ts` - SSE connection for real-time deployment updates
    - `useAgentSessionProgress.ts` - Agent session monitoring
  - `api.ts` - API client functions
  - `types.ts` - TypeScript type definitions
  - `ProjectViewer.tsx` - Main project viewer component

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
5. **Deletion** - Records deleted, `deployment-deleted` event emitted

**Stages:**

- `starting-container` - Docker container initialization
- `cloning-repo` - Git clone operation
- `starting-service` - Service startup
- `running` - Active execution
- `graceful-shutdown` - Clean shutdown
- `stopped` - Container terminated

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

- Always use SSE events for real-time updates, never reload the page
- Test that SSE events are emitted for all state-changing operations
- Ensure event listeners are cleaned up on component unmount
- Use TypeScript interfaces for event payloads
- Keep event names consistent (e.g., 'deployment-deleted', 'workload-update')
- When completing work, suggest changes to CLAUDE.md based on new learnings
