# Dogfooding Vision: Building AgentForge with AgentForge

## Overview

The ultimate goal is to use AgentForge to build the next iterations of AgentForge itself. By using `@agentforge/dataobject` for our own internal data management, we:

1. **Validate the design** - If the system works for our own complex needs, it will work for users
2. **Discover gaps early** - Real usage reveals missing features before users hit them
3. **Create a living showcase** - The project viewer becomes a demonstration of capabilities
4. **Accelerate development** - Each improvement benefits both the product and its own development

## Current State

### What We Have

**@agentforge/dataobject** - Resource definition DSL
- `defineResource()` for declaring data objects
- `createHonoRoutes()` for auto-generating REST endpoints
- Pluggable store interface with in-memory implementation
- Used in: `example-projects/shoe-inventory`

**@agentforge/runtime** - Deployment pipeline
- `Deployer` class managing workload lifecycle
- Pipeline stages: pending -> validate -> build -> deploy -> running
- Docker-based service deployment
- CLI entry point

**Frontend** - Project Viewer
- File tree with service detection
- Database browser (tasks, deployments, workloads, etc.)
- Service detail view with schema/endpoints display
- Currently reads from static `db-snapshot.json` files

### What's Missing

- SQLite store adapter for `@agentforge/dataobject`
- Server API connecting frontend to live data
- "Run" button to trigger deployments from ServiceView
- Real-time updates for workload progression

## Target Architecture

```
@agentforge/dataobject
├── defineResource()           # DSL for data objects
├── createHonoRoutes()         # Auto REST endpoints
├── stores/
│   ├── memory.ts              # Development/testing
│   └── sqlite.ts              # Production (NEW)
└── actions/                   # Custom operations (NEW)

server/
├── resources/
│   ├── workloads.ts           # Workload data object
│   ├── deployments.ts         # Deployment data object
│   ├── tasks.ts               # Task data object
│   ├── channels.ts            # Channel data object
│   └── messages.ts            # Message data object
├── index.ts                   # Hono app with all routes
└── deployer.ts                # Runtime integration

Frontend
├── ServiceView                # "Run" button triggers deployment
├── WorkloadDetailView         # Live stage progression
└── API client                 # Fetches from /api/* instead of static JSON
```

## Resource Definitions

### Workloads

```typescript
// server/resources/workloads.ts
import { defineResource } from '@agentforge/dataobject'

export const workloadResource = defineResource({
  name: 'workload',
  fields: {
    id: { type: 'string', auto: true },
    deploymentId: { type: 'string', required: true },
    servicePath: { type: 'string', required: true },
    stage: {
      type: 'string',
      default: 'pending',
      enum: ['pending', 'validate', 'build', 'deploy', 'running', 'failed', 'stopped']
    },
    logs: { type: 'json', default: [] },
    error: { type: 'string' },
    containerId: { type: 'string' },
    port: { type: 'number' },
    createdAt: { type: 'datetime', auto: true },
    updatedAt: { type: 'datetime', auto: true },
  },
  actions: {
    // Custom action to start the deployment pipeline
    run: async (workload, { deployer }) => {
      return deployer.start(workload)
    },
    // Custom action to stop a running workload
    stop: async (workload, { deployer }) => {
      return deployer.stop(workload)
    }
  }
})
```

### Deployments

```typescript
// server/resources/deployments.ts
export const deploymentResource = defineResource({
  name: 'deployment',
  fields: {
    id: { type: 'string', auto: true },
    projectId: { type: 'string', required: true },
    serviceName: { type: 'string', required: true },
    status: { type: 'string', default: 'active' },
    createdAt: { type: 'datetime', auto: true },
  },
  // Deployments have many workloads
  relations: {
    workloads: { type: 'hasMany', resource: 'workload', foreignKey: 'deploymentId' }
  }
})
```

### Tasks (Agent Work Items)

```typescript
// server/resources/tasks.ts
export const taskResource = defineResource({
  name: 'task',
  fields: {
    id: { type: 'string', auto: true },
    title: { type: 'string', required: true },
    description: { type: 'string' },
    status: {
      type: 'string',
      default: 'backlog',
      enum: ['backlog', 'ready', 'in-progress', 'review', 'done']
    },
    priority: { type: 'number', default: 0 },
    assignee: { type: 'string' },
    createdAt: { type: 'datetime', auto: true },
    updatedAt: { type: 'datetime', auto: true },
  }
})
```

## Implementation Plan

### Phase 1: SQLite Store
Add a SQLite adapter to `@agentforge/dataobject` that:
- Auto-creates tables from resource definitions
- Handles migrations when schema changes
- Uses better-sqlite3 or drizzle under the hood

### Phase 2: Server Integration
Wire up the server with resource-based routes:
- Mount all resource routes on `/api/*`
- Integrate with existing drizzle schema or migrate to resource-based
- Add WebSocket/SSE for real-time updates

### Phase 3: Frontend Connection
Replace static db-snapshot.json with live API:
- Add API client utilities
- Update ProjectViewer to fetch from API
- Add "Run" button to ServiceView
- Show live workload progression

### Phase 4: Actions & Runtime
Connect resource actions to the runtime:
- Workload `run` action triggers Deployer
- Real-time log streaming
- Stage progression updates

## Benefits of This Approach

### For Development
- **Single pattern** - All data follows the same resource definition pattern
- **Auto-generated APIs** - No hand-writing CRUD routes
- **Type safety** - Resource definitions generate TypeScript types
- **Testability** - Swap memory store for tests, SQLite for prod

### For the Product
- **Proven system** - We use it, so we know it works
- **Better docs** - Our usage becomes example code
- **Feature discovery** - Gaps we find become features
- **Credibility** - "We use this ourselves" builds trust

### For Users
- **Real examples** - The project viewer IS an AgentForge project
- **Best practices** - Our patterns become recommended patterns
- **Battle-tested** - Edge cases we hit are already handled

## Success Criteria

1. **All internal data uses resources** - No direct SQL for tasks, workloads, etc.
2. **Frontend uses live API** - No more static JSON files for demo data
3. **Run button works** - Click "Run" on a service, see workload progress through stages
4. **Self-hosting** - AgentForge can deploy its own services

## Future Vision

Once this foundation is solid, we can:

1. **Use agents to modify resources** - AI agents creating/updating tasks
2. **Self-improving system** - AgentForge agents improving AgentForge code
3. **Meta-layer** - Resource definitions themselves as resources
4. **Plugin ecosystem** - Third-party resources that integrate seamlessly

The end state: AgentForge as a self-improving platform where the tools used to build it are the same tools it provides to users.
