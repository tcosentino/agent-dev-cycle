# Workload Lifecycle

Understanding how AgentForge deploys and runs services through the complete workload pipeline.

## Overview

A **workload** represents a single instance of a service being deployed and run. When an agent completes a task that creates a deployable service, AgentForge creates a workload to manage its lifecycle from validation through deployment to running state.

## Core Concepts

### Deployment vs Workload

**Deployment**
- Metadata about a service that can be deployed
- Properties: `projectId`, `serviceName`, `servicePath`, `status`
- Represents "what could be deployed"
- Example: "my-api-service at services/api"

**Workload**
- A specific instance of running a deployment
- Properties: `deploymentId`, `stage`, `logs`, `containerId`, `port`
- Represents "an active deployment attempt or running instance"
- Example: "Running instance of my-api-service on port 3001"

**Relationship**: One Deployment → Many Workloads (current + historical)

## Workload Stages

A workload progresses through these stages:

```
┌────────────────────┐
│      pending       │  Initial state, queued for processing
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐
│ starting-container │  Docker container initialization
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐
│   cloning-repo     │  Git clone operation
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐
│ starting-service   │  Service startup inside container
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐
│     running        │  Service is live and handling requests
└─────────┬──────────┘
          │
          ├─→ graceful-shutdown → stopped (user stops it)
          └─→ failed (error occurred)
```

### Stage Details

#### 1. Pending
**What happens:**
- Workload created in database
- Queued for processing
- Orchestrator picks it up

**Data recorded:**
- Creation timestamp
- Deployment ID
- Service path

#### 2. Starting Container
**What happens:**
- Docker container is initialized
- Environment prepared for the workload

**Success criteria:**
- Container created and started
- Environment ready

**Failure scenarios:**
- Docker daemon not available
- Resource constraints

#### 3. Cloning Repo
**What happens:**
- Git repository is cloned into the container
- Source code made available

**Logs captured:**
- Git clone output
- Repository setup progress

**Success criteria:**
- Repository successfully cloned
- Source files available

**Failure scenarios:**
- Repository not found
- Git authentication failure
- Network issues

#### 4. Starting Service
**What happens:**
- Dependencies installed
- Service started inside the container
- Port allocated

**Data recorded:**
- Container ID
- Allocated port

**Success criteria:**
- Service process started
- Port allocated and listening

**Failure scenarios:**
- Dependency installation failures
- Port already in use
- Service crashes on startup

#### 5. Running
**What happens:**
- Service is live
- Handling requests
- Logs streaming

**Monitoring:**
- Container status
- Port accessibility
- Error logs

**Exit conditions:**
- User stops workload → `graceful-shutdown` → `stopped`
- Service crashes → `failed`

#### 6. Graceful Shutdown
**Transitional state** - Workload is being stopped cleanly

**What happens:**
- Container receives stop signal
- Service given time to clean up
- Resources released

#### 7. Stopped
**Terminal state** - Workload has been stopped

**What happens:**
- Container stopped
- Port released

**Data preserved:**
- Final logs
- Run duration

#### 8. Failed
**Terminal state** - Workload encountered an error

**What happens:**
- Container stopped (if running)
- Port released (if allocated)
- Error captured

**Data preserved:**
- Error message
- Stage where failure occurred
- Full logs

## Data Model

### Workload Schema

```typescript
interface Workload {
  // Identity
  id: string                    // UUID
  deploymentId: string          // References deployment
  
  // State
  stage: WorkloadStage          // Current stage
  
  // Runtime info
  servicePath: string           // Path to service in repo
  containerId?: string          // Docker container ID (if using Docker)
  port?: number                 // Allocated port (if running)
  
  // Logs & errors
  logs: WorkloadLogEntry[]      // All logs from all stages
  error?: string                // Error message (if failed)
  
  // Timestamps (auto-managed)
  createdAt: Date
  updatedAt: Date
}
```

### Workload Log Entry

```typescript
interface WorkloadLogEntry {
  timestamp: Date
  stage: WorkloadStage          // Which stage produced this log
  message: string               // Log message
  level: 'info' | 'warn' | 'error'
}
```

### Stage Enum

```typescript
type WorkloadStage =
  | 'pending'
  | 'starting-container'
  | 'cloning-repo'
  | 'starting-service'
  | 'running'
  | 'graceful-shutdown'
  | 'stopped'
  | 'failed'
```

## Code Organization

### Workload Dataobject

Location: `src/services/workload-dataobject/`

```typescript
import { defineResource, z } from '@agentforge/dataobject'

export const workloadResource = defineResource({
  name: 'workload',
  schema: z.object({
    id: z.string().uuid(),
    deploymentId: z.string().uuid(),
    servicePath: z.string().min(1),
    stage: workloadStageEnum.default('pending'),
    logs: z.array(workloadLogEntry).default([]),
    error: z.string().optional(),
    containerId: z.string().optional(),
    port: z.number().int().min(1).max(65535).optional(),
  }),
  
  createFields: ['deploymentId', 'servicePath'],
  updateFields: ['stage', 'logs', 'error', 'containerId', 'port'],
  
  relations: {
    deployment: { 
      type: 'belongsTo', 
      resource: 'deployment', 
      foreignKey: 'deploymentId' 
    },
  },
})
```

### Runner (Workload Processor)

Location: `packages/runner/` or `runner/src/`

Responsibilities:
- Poll for `pending` workloads
- Execute stage transitions
- Capture logs
- Handle errors
- Update workload state

Pseudocode:
```typescript
async function processWorkload(workload: Workload) {
  try {
    await transitionTo(workload, 'starting-container')
    await startContainer(workload)

    await transitionTo(workload, 'cloning-repo')
    await cloneRepo(workload)

    await transitionTo(workload, 'starting-service')
    const { containerId, port } = await startService(workload)

    await transitionTo(workload, 'running')
    await monitorService(workload)

  } catch (error) {
    await transitionTo(workload, 'failed')
    await recordError(workload, error)
  }
}
```

## API Endpoints

### Create Workload

```http
POST /api/workloads
Content-Type: application/json

{
  "deploymentId": "uuid-of-deployment",
  "servicePath": "services/api"
}

Response:
{
  "id": "uuid-of-workload",
  "deploymentId": "uuid-of-deployment",
  "servicePath": "services/api",
  "stage": "pending",
  "logs": [],
  "createdAt": "2026-02-14T13:00:00Z",
  "updatedAt": "2026-02-14T13:00:00Z"
}
```

### Get Workload

```http
GET /api/workloads/:id

Response:
{
  "id": "uuid",
  "deploymentId": "uuid",
  "servicePath": "services/api",
  "stage": "running",
  "containerId": "abc123",
  "port": 3001,
  "logs": [
    {
      "timestamp": "2026-02-14T13:00:01Z",
      "stage": "validate",
      "message": "Validating service at services/api",
      "level": "info"
    },
    {
      "timestamp": "2026-02-14T13:00:02Z",
      "stage": "build",
      "message": "Installing dependencies...",
      "level": "info"
    },
    ...
  ],
  "createdAt": "2026-02-14T13:00:00Z",
  "updatedAt": "2026-02-14T13:01:15Z"
}
```

### Stop Workload

```http
POST /api/workloads/:id/stop

Response:
{
  "id": "uuid",
  "stage": "stopped",
  ...
}
```

## State Transitions

### Valid Transitions

```
pending            → starting-container
starting-container → cloning-repo, failed
cloning-repo       → starting-service, failed
starting-service   → running, failed
running            → graceful-shutdown, failed
graceful-shutdown  → stopped
```

### Invalid Transitions

```
running → pending              ❌ Can't go back to pending
cloning-repo → starting-container  ❌ Can't go backwards
stopped → running              ❌ Terminal states are final
failed  → pending              ❌ Terminal states are final
```

To retry a failed workload, create a new workload instance.

## Error Handling

### Error Capture

When a workload fails:
1. Current stage recorded
2. Error message captured
3. Stack trace logged
4. Transition to `failed` stage
5. All resources cleaned up (ports released, containers stopped)

### Error Types

**Container Errors:**
```
Stage: starting-container
Error: "Docker daemon not running"
```

**Clone Errors:**
```
Stage: cloning-repo
Error: "Repository not found or access denied"
Logs: [git clone output]
```

**Service Startup Errors:**
```
Stage: starting-service
Error: "Port 3001 already in use"
```

**Runtime Errors:**
```
Stage: running
Error: "Service crashed with exit code 1"
Logs: [application logs before crash]
```

## Monitoring & Observability

### Logs

All workload logs stored in `workload.logs[]`:
- Timestamped
- Associated with stage
- Severity level (info/warn/error)

Access via:
- UI: Deployments tab → View Logs
- API: `GET /api/deployments/:deploymentId/workloads/:workloadId/logs`

### Metrics (Future)

Planned metrics:
- Workload success rate by stage
- Average build time
- Deployment failures by error type
- Resource usage per workload

## Example: Complete Lifecycle

Let's walk through deploying a simple Express API:

### 1. Agent Creates Service

Agent completes task "Create API service":
```bash
services/api/
├── package.json
├── tsconfig.json
├── src/
│   └── index.ts
└── Dockerfile
```

### 2. Deployment Created

```http
POST /api/deployments
{
  "projectId": "proj-123",
  "serviceName": "API Service",
  "servicePath": "services/api"
}
```

### 3. Workload Triggered

```http
POST /api/workloads
{
  "deploymentId": "deploy-456",
  "servicePath": "services/api"
}
```

### 4. Workload Progresses

**Pending → Starting Container:**
```
[2026-02-14 13:00:00] [starting-container] Initializing Docker container...
[2026-02-14 13:00:02] [starting-container] Container created
```

**Starting Container → Cloning Repo:**
```
[2026-02-14 13:00:03] [cloning-repo] Cloning repository...
[2026-02-14 13:00:08] [cloning-repo] Repository cloned successfully
```

**Cloning Repo → Starting Service:**
```
[2026-02-14 13:00:09] [starting-service] Installing dependencies...
[2026-02-14 13:00:18] [starting-service] Starting service...
[2026-02-14 13:00:20] [starting-service] Allocated port: 3001
```

**Starting Service → Running:**
```
[2026-02-14 13:00:21] [running] Service running on http://localhost:3001
[2026-02-14 13:00:21] [running] Ready to accept requests
```

### 5. Workload State

```json
{
  "id": "wl-789",
  "deploymentId": "deploy-456",
  "servicePath": "services/api",
  "stage": "running",
  "containerId": "abc123def456",
  "port": 3001,
  "logs": [ /* all logs above */ ],
  "createdAt": "2026-02-14T13:00:00Z",
  "updatedAt": "2026-02-14T13:00:23Z"
}
```

## Troubleshooting

### Workload Stuck in Pending

**Symptom:** Workload created but never progresses

**Causes:**
- Orchestrator not running
- Database connection lost

**Solution:**
1. Restart the development server: `yarn dev`
2. Check workload state via the API or UI

### Container Stage Fails

**Symptom:** Workload fails during starting-container or cloning-repo

**Causes:**
- Docker daemon not running
- Network issues (for git clone)
- Repository access permissions

**Solution:**
1. Check logs via the UI Deployments tab → View Logs
2. Ensure Docker is running
3. Fix issues and create a new workload to retry

### Service Startup Fails

**Symptom:** Container starts but service fails

**Causes:**
- Port conflict
- Missing dependencies
- Service crash on startup

**Solution:**
1. Check logs for specific error
2. Free up ports: `lsof -i :<port>`
3. Retry with new workload

## Future Enhancements

### Planned Features

**Health Checks:**
- Custom health check endpoints
- Periodic health polling
- Auto-restart on failure

**Scaling:**
- Multiple workload instances per deployment
- Load balancing
- Auto-scaling based on load

**Advanced Deployment:**
- Blue-green deployments
- Canary releases
- Rollback support

**Resource Management:**
- CPU/memory limits
- Disk quotas
- Network policies

## Related Documentation

- [Architecture Overview](./overview.md)
- [Monorepo Structure](./monorepo-structure.md)
- [Development Setup](../development-setup.md)
