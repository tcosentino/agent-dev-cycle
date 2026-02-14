# Architecture Overview

A high-level view of how AgentForge is designed and how the pieces fit together.

## System Architecture

AgentForge is a **monolithic monorepo** with a microservices-like service architecture internally. Everything runs in a single Node.js process (the Gateway) but is organized into discrete services and packages.

```
┌─────────────────────────────────────────────────────┐
│                  AgentForge Gateway                 │
│  (Single Node.js process orchestrating everything)  │
│                                                      │
│  ┌────────────────────────────────────────────┐   │
│  │           Core Services Layer               │   │
│  │                                              │   │
│  │  ┌─────────────┐  ┌──────────────┐         │   │
│  │  │  Projects   │  │    Tasks     │         │   │
│  │  │ Dataobject  │  │  Dataobject  │  ...    │   │
│  │  └─────────────┘  └──────────────┘         │   │
│  │                                              │   │
│  │  ┌─────────────┐  ┌──────────────┐         │   │
│  │  │ Deployments │  │  Workloads   │         │   │
│  │  │ Dataobject  │  │  Dataobject  │  ...    │   │
│  │  └─────────────┘  └──────────────┘         │   │
│  └────────────────────────────────────────────┘   │
│                                                      │
│  ┌────────────────────────────────────────────┐   │
│  │        Integration Services Layer           │   │
│  │                                              │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐ │   │
│  │  │  GitHub  │  │  Claude  │  │  Runner  │ │   │
│  │  │   API    │  │   Auth   │  │  (Agent) │ │   │
│  │  └──────────┘  └──────────┘  └──────────┘ │   │
│  └────────────────────────────────────────────┘   │
│                                                      │
│  ┌────────────────────────────────────────────┐   │
│  │          Presentation Layer                 │   │
│  │                                              │   │
│  │  ┌──────────────────┐  ┌─────────────────┐│   │
│  │  │  AgentForge UI   │  │   REST API      ││   │
│  │  │  (React/Vite)    │  │   (Express)     ││   │
│  │  └──────────────────┘  └─────────────────┘│   │
│  └────────────────────────────────────────────┘   │
│                                                      │
│  ┌────────────────────────────────────────────┐   │
│  │           Foundation Packages               │   │
│  │                                              │   │
│  │  @agentforge/dataobject                     │   │
│  │  @agentforge/server                         │   │
│  │  @agentforge/runtime                        │   │
│  │  @agentforge/ui-components                  │   │
│  └────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

## Key Concepts

### 1. Dataobjects

**Dataobjects** are AgentForge's primary abstraction for data management. Think of them as "models" or "entities" but with more capabilities.

A dataobject defines:
- **Schema** (structure and validation)
- **CRUD operations** (create, read, update, delete)
- **Relations** (to other dataobjects)
- **Hooks** (lifecycle events)
- **Custom actions** (beyond CRUD)

**Example:**
```typescript
// src/services/task-dataobject/index.ts
export const taskResource = defineResource({
  name: 'task',
  schema: z.object({
    id: z.string().uuid(),
    title: z.string().min(1).max(200),
    description: z.string().optional(),
    type: z.enum(['backend', 'frontend', 'testing', 'devops']),
    priority: z.enum(['critical', 'high', 'medium', 'low']),
    status: z.enum(['todo', 'in-progress', 'review', 'done', 'blocked']),
    assignee: z.string().optional(),
    projectId: z.string().uuid(),
  }),
  
  createFields: ['title', 'projectId', 'type', 'priority'],
  updateFields: ['title', 'description', 'status', 'assignee'],
  
  relations: {
    project: { type: 'belongsTo', resource: 'project', foreignKey: 'projectId' },
    comments: { type: 'hasMany', resource: 'task-comment', foreignKey: 'taskId' },
  },
})
```

**Benefits:**
- Type-safe (Zod schemas)
- Auto-generated REST API
- Consistent validation
- Easy to test
- React hooks auto-generated

### 2. Services

**Services** are discrete functional units in the `src/services/` directory. Each service is self-contained and focuses on one domain.

**Service Types:**

**Dataobject Services** (`*-dataobject`)
- Define data models
- Provide CRUD operations
- Example: `task-dataobject`, `project-dataobject`

**Integration Services** (`*-integration`)
- Connect to external APIs
- Handle authentication
- Example: `github-integration`, `claude-auth-integration`

**UI Services** (`*-ui`)
- Frontend applications
- Built with Vite + React
- Example: `agentforge-ui`, `demo-ui`

**Service Structure:**
```
task-dataobject/
├── index.ts          # Dataobject definition
├── schema.ts         # Zod schema (if complex)
├── hooks.ts          # React Query hooks (auto-generated)
├── service.json      # Service metadata
└── README.md
```

### 3. Packages

**Packages** are shared libraries in the `packages/` directory. They provide reusable functionality across services.

**Core Packages:**

**@agentforge/dataobject**
- Core dataobject framework
- `defineResource()` function
- Validation, relations, hooks

**@agentforge/server**
- HTTP server (Express wrapper)
- Auto-generates REST API from dataobjects
- Request/response handling

**@agentforge/runtime**
- Agent execution runtime
- Manages agent lifecycles
- Tool execution

**@agentforge/ui-components**
- Reusable React components
- TaskCard, TaskBoard, DeploymentCard, etc.
- Shared UI patterns

**@agentforge/testing-framework**
- Test-spec linkage (`describeSpec()`)
- Coverage tracking
- Scenario mapping

**Package Structure:**
```
packages/dataobject/
├── src/
│   ├── index.ts         # Public API
│   ├── defineResource.ts
│   ├── validation.ts
│   └── types.ts
├── package.json
├── tsconfig.json
└── README.md
```

## Data Flow

### 1. User Creates a Task (Example Flow)

```
User (Browser)
    │
    │  1. Click "New Task" button
    │
    ▼
┌────────────────┐
│ AgentForge UI  │  TaskForm component
│  (React)       │
└───────┬────────┘
        │  2. POST /api/tasks
        │     { title, projectId, type, priority }
        ▼
┌────────────────┐
│  REST API      │  Express route
│  (@agentforge/ │  GET/POST/PATCH/DELETE /api/tasks
│   server)      │
└───────┬────────┘
        │  3. Validate request
        │
        ▼
┌──────────────────┐
│ Task Dataobject  │  Zod schema validation
│                  │  Business logic hooks
└─────────┬────────┘
          │  4. Insert into database
          │
          ▼
    ┌──────────┐
    │ SQLite/  │
    │ Postgres │
    └──────────┘
          │
          │  5. Return created task
          │
          ▼
┌────────────────┐
│  REST API      │  { id, title, ... }
└───────┬────────┘
        │  6. JSON response
        ▼
┌────────────────┐
│ AgentForge UI  │  Update UI with new task
└────────────────┘
```

### 2. Agent Runs a Task

```
User triggers agent
    │
    ▼
┌────────────────┐
│  Runner        │  Agent orchestrator
│  (packages/    │
│   runner)      │
└───────┬────────┘
        │  1. Load task from database
        │
        ▼
┌────────────────┐
│ Task Dataobject│  GET task by ID
└───────┬────────┘
        │  2. Return task data
        │
        ▼
┌────────────────┐
│  Runtime       │  Create agent session
│  (@agentforge/ │  Load agent prompt
│   runtime)     │
└───────┬────────┘
        │  3. Execute agent with task context
        │
        ▼
┌────────────────┐
│ Claude API     │  LLM processes prompt
│  (External)    │  Returns tool calls
└───────┬────────┘
        │  4. Tool calls (read file, write code, etc.)
        │
        ▼
┌────────────────┐
│  Runtime       │  Execute tools
│                │  (file system, git, shell)
└───────┬────────┘
        │  5. Return results to LLM
        │  (loop until task complete)
        │
        ▼
┌────────────────┐
│ Task Dataobject│  Update task status to "done"
└───────┬────────┘
        │  6. Persist changes
        │
        ▼
    Database
```

## Technology Stack

### Backend
- **Runtime:** Node.js 18+
- **Language:** TypeScript (strict mode)
- **Framework:** Express (via @agentforge/server)
- **Database:** SQLite (dev), PostgreSQL (prod)
- **Validation:** Zod
- **Testing:** Vitest
- **Process Management:** PM2 (optional)

### Frontend
- **Framework:** React 18
- **Build Tool:** Vite
- **Language:** TypeScript
- **Styling:** CSS Modules
- **State:** React Query + useState
- **UI Library:** Custom (@agentforge/ui-components)
- **Routing:** React Router
- **Testing:** Vitest + Testing Library

### Infrastructure
- **Monorepo:** Yarn Workspaces
- **Git Workflow:** GitHub
- **CI/CD:** GitHub Actions
- **Deployment:** Self-hosted (local) or cloud (AWS)
- **Logging:** Winston (planned)
- **Monitoring:** Custom (planned)

## Design Principles

### 1. Convention Over Configuration

Dataobjects auto-generate:
- REST API endpoints
- Database migrations
- React hooks
- TypeScript types

Developers declare **what** (schema, relations), framework handles **how** (CRUD, API, hooks).

### 2. Type Safety End-to-End

```
Zod Schema → TypeScript Types → API → React Hooks
```

No manual type duplication. Single source of truth.

### 3. Explicit Over Implicit

Prefer:
```typescript
// ✅ Clear what's happening
const task = await taskResource.create({ title, projectId })
```

Over:
```typescript
// ❌ Magic methods
const task = await Task.create({ title, projectId })
```

### 4. Composability

Small, focused services that can be composed:

```typescript
// Services compose cleanly
const deployment = await deploymentResource.create({ projectId, serviceName })
const workload = await workloadResource.create({ deploymentId, servicePath })
await runWorkload(workload)
```

### 5. Testability

Every layer is testable in isolation:
- Dataobjects: Unit test schemas, validation, hooks
- Services: Integration test APIs
- UI Components: Component tests
- Full stack: E2E with Playwright

## Project Structure

```
agent-dev-cycle/
├── packages/              # Shared libraries
│   ├── dataobject/        # Core dataobject framework
│   ├── server/            # HTTP server + API generator
│   ├── runtime/           # Agent execution runtime
│   ├── ui-components/     # React component library
│   ├── logger/            # Logging utilities
│   └── testing-framework/ # Test-spec linkage
│
├── src/
│   └── services/          # Application services
│       ├── project-dataobject/
│       ├── task-dataobject/
│       ├── deployment-dataobject/
│       ├── workload-dataobject/
│       ├── agentforge-ui/    # Main UI
│       ├── github-integration/
│       └── claude-auth-integration/
│
├── runner/                # Agent orchestrator
│   └── src/
│
├── openspec/              # OpenSpec specifications
│   ├── changes/           # Work in progress
│   └── specs/             # Completed features
│
├── docs/                  # Documentation
│   ├── user-guide/
│   └── developer-guide/
│
├── scripts/               # Build and utility scripts
├── tests/                 # Integration and E2E tests
├── package.json           # Root package.json
├── yarn.lock
└── tsconfig.json          # Root TypeScript config
```

## Communication Patterns

### 1. REST API (External)

Browser ↔ Server communication via HTTP:

```
GET    /api/projects
POST   /api/projects
GET    /api/projects/:id
PATCH  /api/projects/:id
DELETE /api/projects/:id
```

### 2. In-Process (Internal)

Services communicate directly (same Node.js process):

```typescript
// Direct function calls
const project = await projectResource.get(projectId)
const tasks = await taskResource.list({ projectId })
```

No HTTP overhead. Type-safe. Fast.

### 3. Event Bus (Planned)

Future: Asynchronous events between services:

```typescript
// Service emits event
events.emit('task.created', { task })

// Another service listens
events.on('task.created', async ({ task }) => {
  // Auto-assign agent, notify user, etc.
})
```

## Security Model

### Authentication

**Planned:**
- Local: No auth (single-user, local dev)
- Production: API keys or OAuth
- Multi-user: Session-based auth

### Authorization

**Current:** No RBAC (single user owns all projects)

**Planned:**
- Project ownership
- Role-based permissions (admin, editor, viewer)
- API key scopes

### Data Validation

**All inputs validated:**
- Zod schemas on dataobjects
- Express middleware for requests
- Client-side validation (UX only, not security)

## Performance Characteristics

### Database Queries

- **ORM:** None (raw SQL via better-sqlite3 or pg)
- **Indexing:** Auto-indexed on searchable fields
- **Relations:** Lazy-loaded (no N+1 by default)

### API Responses

- **Typical:** < 50ms (local SQLite)
- **Pagination:** Default 50 items, max 200
- **Caching:** None yet (planned: Redis for sessions)

### Agent Execution

- **Concurrent:** 1 agent at a time (planned: configurable)
- **Timeout:** 600s default (10 minutes)
- **Streaming:** Logs streamed in real-time

## Scaling Considerations

### Current (MVP)

- Single Node.js process
- SQLite database
- Local file system
- One agent at a time

**Good for:**
- Solo developers
- Small teams
- Local development

### Future (Production)

- Multi-process (PM2 cluster)
- PostgreSQL database
- S3 for file storage
- Queue for agent jobs (Bull)
- Horizontal scaling (multiple gateways)

**Good for:**
- Teams
- Multiple projects
- High concurrency

## Related Documentation

- [Monorepo Structure](./monorepo-structure.md)
- [Dataobject Framework](./dataobject-framework.md)
- [Workload Lifecycle](./workload-lifecycle.md)
- [Development Setup](../development-setup.md)
