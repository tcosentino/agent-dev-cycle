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
┌──────────┐
│ pending  │  Initial state, queued for processing
└────┬─────┘
     │
     ▼
┌──────────┐
│ validate │  Check code, dependencies, configuration
└────┬─────┘
     │
     ▼
┌──────────┐
│  build   │  Install dependencies, compile, bundle
└────┬─────┘
     │
     ▼
┌──────────┐
│  deploy  │  Start container/process, allocate resources
└────┬─────┘
     │
     ▼
┌──────────┐
│ running  │  Service is live and handling requests
└────┬─────┘
     │
     ├─→ stopped (user stops it)
     └─→ failed (error occurred)
```

### Stage Details

#### 1. Pending
**What happens:**
- Workload created in database
- Queued for processing
- Runner picks it up

**Data recorded:**
- Creation timestamp
- Deployment ID
- Service path

#### 2. Validate
**What happens:**
- Check service directory exists
- Validate `package.json` or equivalent
- Check for required files (Dockerfile, etc.)
- Verify configuration

**Success criteria:**
- Service path is valid
- Dependencies are declared
- Configuration is complete

**Failure scenarios:**
- Service path doesn't exist
- Missing required files
- Invalid configuration

#### 3. Build
**What happens:**
- Install dependencies (`npm install`, `yarn`, etc.)
- Compile TypeScript/build assets
- Run pre-build hooks
- Create Docker image (if applicable)

**Logs captured:**
- Dependency installation output
- Build tool output
- Warnings and errors

**Success criteria:**
- All dependencies installed
- Build completes without errors
- Artifacts created

**Failure scenarios:**
- Dependency conflicts
- Build errors
- Missing environment variables

#### 4. Deploy
**What happens:**
- Start Docker container OR local process
- Allocate port
- Set environment variables
- Wait for service to be ready

**Data recorded:**
- Container ID (if Docker)
- Allocated port
- Process ID (if local)

**Success criteria:**
- Container/process started
- Port allocated and listening
- Health check passes (if configured)

**Failure scenarios:**
- Port already in use
- Container fails to start
- Process crashes immediately

#### 5. Running
**What happens:**
- Service is live
- Handling requests
- Logs streaming
- Health checks periodic

**Monitoring:**
- Process/container status
- Port accessibility
- Error logs
- Resource usage (future)

**Exit conditions:**
- User stops workload → `stopped`
- Service crashes → `failed`
- Health check fails → `failed`

#### 6. Stopped
**Terminal state** - User manually stopped the workload

**What happens:**
- Container stopped OR process killed
- Port released
- Logs archived

**Data preserved:**
- Final logs
- Run duration
- Exit code/reason

#### 7. Failed
**Terminal state** - Workload encountered an error

**What happens:**
- Container stopped OR process killed
- Port released (if allocated)
- Error captured

**Data preserved:**
- Error message
- Stage where failure occurred
- Full logs
- Stack trace (if available)

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
  | 'validate'
  | 'build'
  | 'deploy'
  | 'running'
  | 'failed'
  | 'stopped'
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
    await transitionTo(workload, 'validate')
    await validateService(workload)
    
    await transitionTo(workload, 'build')
    await buildService(workload)
    
    await transitionTo(workload, 'deploy')
    const { containerId, port } = await deployService(workload)
    
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
pending   → validate
validate  → build, failed
build     → deploy, failed
deploy    → running, failed
running   → stopped, failed
```

### Invalid Transitions

```
running → pending    ❌ Can't go back to pending
build   → validate   ❌ Can't go backwards
stopped → running    ❌ Terminal states are final
failed  → pending    ❌ Terminal states are final
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

**Validation Errors:**
```
Stage: validate
Error: "Service directory not found: services/api"
```

**Build Errors:**
```
Stage: build
Error: "npm install failed: ENOTFOUND registry.npmjs.org"
Logs: [full npm output]
```

**Deployment Errors:**
```
Stage: deploy
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
- API: `GET /api/workloads/:id`
- CLI: `agentforge workload logs <id>`

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

**Pending → Validate:**
```
[2026-02-14 13:00:00] [validate] Checking service at services/api
[2026-02-14 13:00:01] [validate] ✓ package.json found
[2026-02-14 13:00:01] [validate] ✓ Dockerfile found
[2026-02-14 13:00:01] [validate] ✓ Validation passed
```

**Validate → Build:**
```
[2026-02-14 13:00:02] [build] Installing dependencies...
[2026-02-14 13:00:10] [build] npm install completed
[2026-02-14 13:00:11] [build] Building TypeScript...
[2026-02-14 13:00:15] [build] ✓ Build successful
```

**Build → Deploy:**
```
[2026-02-14 13:00:16] [deploy] Starting Docker container...
[2026-02-14 13:00:18] [deploy] Container started: abc123def456
[2026-02-14 13:00:19] [deploy] Allocated port: 3001
[2026-02-14 13:00:20] [deploy] Waiting for health check...
[2026-02-14 13:00:22] [deploy] ✓ Service healthy
```

**Deploy → Running:**
```
[2026-02-14 13:00:23] [running] Service running on http://localhost:3001
[2026-02-14 13:00:23] [running] Ready to accept requests
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
- Runner not running (`agentforge gateway status`)
- Database connection lost
- Queue backed up

**Solution:**
```bash
# Check runner status
agentforge gateway status

# Restart runner
agentforge gateway restart

# Check workload manually
agentforge workload inspect <id>
```

### Build Stage Fails

**Symptom:** Workload fails during build

**Causes:**
- Missing dependencies
- Build script errors
- Network issues

**Solution:**
1. Check logs: `agentforge workload logs <id>`
2. Fix issues in service code
3. Create new workload to retry

### Deploy Stage Fails

**Symptom:** Build succeeds but deploy fails

**Causes:**
- Port conflict
- Container image issues
- Resource constraints

**Solution:**
1. Check logs for specific error
2. Free up ports: `lsof -i :3001`
3. Increase resource limits (if needed)
4. Retry with new workload

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

- [Deployment Dataobject](./deployment-system.md)
- [Runner Architecture](./runner.md)
- [Database Schema](./database-schema.md)
- [API Reference](/api-reference/rest-api/workloads.md)
