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
    - `AgentPanel.tsx` - Agent detail panel (tab content for agent type)
    - `ServicePanel.tsx` - Service detail panel (tab content for service type)
    - `PanelLayout.tsx` - Shared panel layout with title, tabs, and content area
    - `SectionCard/` - Standard card component for grouping content within panels
  - `hooks/` - Custom React hooks
    - `useDeploymentStream.ts` - SSE connection for real-time deployment updates
    - `useAgentSessionProgress.ts` - Agent session SSE monitoring
    - `useAppRouter.ts` - Native History API hook for URL routing
  - `routing.ts` - URL parsing, generation, and project lookup logic
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

### Layout Primitives

Two components form the standard layout structure for all panels:

**`PanelLayout`** (`components/PanelLayout.tsx`) — top-level panel wrapper with a title header, optional `headerActions` slot (right side), and a tab bar. Used as the root of every panel (AgentPanel, AgentSessionProgressPanel, etc.).

**`SectionCard`** (`components/SectionCard/`) — standard card for grouping related content within a panel or page. **Use this for every distinct section of content.** Features:
- Dark header bar (`bg-tertiary`) with `title` (left, uppercased label) and optional `headerMeta` (right-aligned, mono font)
- Optional tab bar below the header for switching between views within the card
- Padded body with `bg-secondary` card shell
- Props: `title: ReactNode`, `headerMeta?: ReactNode`, `tabs?`, `activeTab?`, `onTabChange?`, `noPadding?`

```tsx
// Basic section
<SectionCard title="Configuration">
  <p>content</p>
</SectionCard>

// With header meta (e.g. a hash or timestamp)
<SectionCard title="Commit" headerMeta={<code>{sha.slice(0,7)}</code>}>
  ...
</SectionCard>

// With internal tabs
<SectionCard
  title="Files"
  tabs={[{ id: 'added', label: 'Added' }, { id: 'modified', label: 'Modified' }]}
  activeTab={tab}
  onTabChange={setTab}
>
  ...
</SectionCard>
```

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
- Task prompt display in Session Info section
- **Context Files** - Shows which files were loaded into agent's context (displayed in Session Info, not logs)
- **Summary** - Rendered as markdown (ReactMarkdown + remark-gfm); populated from Claude's full text output via `extractSummary()` in `runner/src/claude.ts`; leading `# Summary` heading stripped automatically
- Commit SHA on completion
- **Elapsed timer** - Counts up while session is running; freezes at final duration on completion; shown in panel header (monospace, muted)
- Cancel button (jobs should be cancellable)
- Retry button on failure
- **Enhanced logging** - Shows actual git output and Claude execution details (see Agent Session Logging below)
- **Notepad tab** - Agent notepad rendered as markdown (ReactMarkdown + remark-gfm)

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

**Live View Auto-Expansion (Agent Sessions):**

When viewing a live agent session, the current running stage auto-expands:

- On load, the view is "untouched" — the running stage opens automatically
- When the session advances to a new stage, that stage auto-expands
- Once the user manually toggles any fold (expand/collapse individual stage, or Expand/Collapse All), the view is marked "touched"
- In the "touched" state, auto-expansion stops and the user's chosen fold layout is preserved
- Implemented via `isUntouched` state + `prevStageRef` in `AgentSessionProgressPanel`

### Agent Session Logging

Agent sessions provide detailed developer-friendly logging at each stage:

**Clone Stage:**
- Shows actual git clone output (progress, repo size, errors)
- Uses git's standard output format

**Loading Stage:**
- Lists context files loaded into agent's context
- Displayed in Session Info metadata section (not in logs)
- Example files: `prompts/system.md`, `PROJECT.md`, `ARCHITECTURE.md`, `state/progress.yaml`

**Execute Stage:**
- Streams Claude Code's actual output line-by-line
- Shows real-time progress of what Claude is doing
- Replaces generic line counts with actual execution details

**Commit Stage:**
- Shows git's actual commit output with file change stats
- Example: `3 files changed, 42 insertions(+), 7 deletions(-)`
- Displays commit message
- Shows push output or rebase details if needed
- Uses git's standard terminology (e.g., "push rejected" not "push failed")

**Implementation:**
- `runner/src/progress.ts` - Helper functions: `reportGitOutput()`, `reportClaudeOutput()`, `reportContextFiles()`
- `runner/src/git.ts` - Captures stdout/stderr from git commands
- `runner/src/claude.ts` - Streams Claude output instead of counting lines; `extractSummary()` returns full trimmed text output (Claude uses `--output-format text`, not JSON) with optional `# Summary` header stripped
- `runner/src/context.ts` - Tracks which files were loaded
- All logs use git's actual output format for developer familiarity

## URL Routing

The AgentForge UI uses GitHub-style URL routing with the native History API (no React Router). URLs reflect the active panel and enable deep linking and back/forward navigation.

### URL Structure

```text
/{owner}/{repo}/tree/{branch}/{filePath}        # File or service
/{owner}/{repo}/tree/{branch}/.agentforge/agents/{id}            # Agent panel
/{owner}/{repo}/tree/{branch}/.agentforge/agents/{id}/sessions/{sessionId}  # Agent session
/{owner}/{repo}/{tableName}                     # DB table (tasks, sessions, etc.)
/{owner}/{repo}/{tableName}/{recordKey}         # DB record
```

**Examples:**

- `tcosentino/todo-app/tree/main/.agentforge/agents/pm` — PM agent panel
- `tcosentino/todo-app/tree/main/.agentforge/agents/pm/sessions/pm-001#stages` — session, stages tab
- `tcosentino/todo-app/tasks` — tasks table
- `tcosentino/todo-app/tasks/AF-1` — task record

Panel sub-tabs are reflected in the `#hash` (e.g., `#overview`, `#sessions`, `#stages`).

### Key Files

- **`routing.ts`** — `ParsedUrl` discriminated union, `parseUrl()`, `tabToUrl()`, `findProjectByRepoUrl()`
- **`hooks/useAppRouter.ts`** — wraps `pushState`/`replaceState`; exposes `pathname`, `hash`, `popLocation`, and `navigate`. **`popLocation` only updates on browser back/forward (`popstate`)** — not on programmatic `navigate()` calls. This prevents feedback loops.

### Avoiding URL Feedback Loops

The URL sync effect in `ProjectViewer` fires whenever the active tab changes and calls `onUrlChange → navigate`. If the back/forward effect in `index.tsx` watched `pathname`/`hash`, it would fire on every `navigate` call, re-activating the same tab in an infinite loop. The fix: the back/forward effect watches `popLocation` (only changes on actual user navigation), not `pathname`.

### Deep Link Behavior

On cold load:

1. `useAppRouter` captures initial `pathname` + `hash` from `window.location`
2. After projects load, `parseUrl` produces a `ParsedUrl`
3. Owner/repo is matched against projects via `findProjectByRepoUrl`
4. `ProjectViewer` receives `activateUrl` prop — restores localStorage tabs first, then activates the URL tab on top

### Auth & Access

- Not logged in → save `returnTo` in `sessionStorage`, redirect to login, restore URL after auth
- Logged in but project not found → "no access" error with logout button

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

### Tab Panel Naming Convention

Components that render as the content of a tab are called **Panels**. Use the `Panel` suffix for all top-level tab content components:

- `AgentPanel` - renders when `tab.type === 'agent'`
- `ServicePanel` - renders when `tab.type === 'service'`
- `AgentSessionProgressPanel` - renders when `tab.type === 'agentSession'`

Sub-components rendered inside panels (not directly as tab content) keep their existing naming (`View`, `Card`, etc.).

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
