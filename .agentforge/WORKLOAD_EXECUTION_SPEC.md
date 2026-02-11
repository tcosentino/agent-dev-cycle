# Workload Execution System Specification

## Overview

The workload execution system enables services (dataobjects) to be deployed and run as live processes with monitoring, logging, and lifecycle management.

## Architecture

### Components

1. **Workload Orchestrator** (`src/services/workload-orchestrator/`)
   - Manages workload lifecycle (start, stop, restart)
   - Spawns and monitors service processes
   - Captures logs and updates workload status
   - Assigns available ports to services
   - Tracks process/container IDs

2. **API Endpoints** (`src/api/workloads.ts`)
   - POST `/api/workloads/:id/start` - Start a workload
   - POST `/api/workloads/:id/stop` - Stop a workload
   - GET `/api/workloads/:id/logs/stream` - Stream logs (SSE)
   - GET `/api/workloads/:id/status` - Get current status

3. **ServiceView Integration**
   - Trigger workload start after creation
   - Show real-time status updates
   - Navigate to workload detail on success

## Workload Lifecycle

### Stages

```
pending → validate → build → deploy → running → (stopped/failed)
```

1. **pending**: Workload created, waiting to start
2. **validate**: Validate service exists and has valid configuration
3. **build**: Install dependencies (if needed)
4. **deploy**: Prepare runtime environment
5. **running**: Service is running and healthy
6. **stopped**: Service was stopped by user
7. **failed**: Service crashed or failed to start

### Status Updates

Workload status changes are persisted to the database and pushed to UI via:
- Polling (simple, already works with React Query)
- SSE for log streaming (implement if needed)

## Service Execution

### For Dataobjects

Dataobjects need an HTTP server to expose their REST API. The orchestrator will:

1. Locate the service directory using `servicePath`
2. Check for `service.json` to understand the service type
3. Generate a temporary API server that:
   - Loads the dataobject resource from `index.ts`
   - Exposes REST endpoints defined in the resource
   - Runs on an assigned port
4. Start the server process
5. Monitor for health and capture logs

### Port Management

- Maintain a pool of available ports (e.g., 3100-3200)
- Assign ports on workload start
- Release ports on workload stop
- Store port in `workload.port` field

### Process Management

- Use Node.js `child_process` to spawn service processes
- Store process ID in `workload.containerId` (reuse this field for now)
- Monitor process for crashes and restart if configured
- Kill process on workload stop

## Implementation Plan

### Phase 1: Basic Orchestrator (MVP)

**File: `src/services/workload-orchestrator/index.ts`**

```typescript
export class WorkloadOrchestrator {
  // Start a workload
  async start(workloadId: string): Promise<void>

  // Stop a workload
  async stop(workloadId: string): Promise<void>

  // Get workload status
  async getStatus(workloadId: string): Promise<WorkloadStatus>
}
```

**Key features:**
- Validate service exists
- Start simple HTTP server for dataobject
- Assign port
- Update workload in DB with logs and status
- Handle process crashes

### Phase 2: API Endpoints

**File: `src/api/workloads.ts` (or extend existing API)**

Add endpoints:
- `POST /api/workloads/:id/start`
- `POST /api/workloads/:id/stop`
- `GET /api/workloads/:id/logs` (simple pagination)

### Phase 3: UI Integration

**Update ServiceView:**
- After creating workload, call `/api/workloads/:id/start`
- Show loading state while starting
- Navigate to workload detail page on success
- Show error toast on failure

**Update WorkloadDetailView:**
- Poll for workload updates every 2-3 seconds when status is not terminal
- Display logs in real-time
- Show port/URL for accessing the running service

### Phase 4: Log Streaming (Optional Enhancement)

If polling is insufficient:
- Implement SSE endpoint for log streaming
- Update UI to consume SSE stream
- Show live log tailing in WorkloadDetailView

## Technical Considerations

### Security
- Services run in the same process as the main app (for MVP)
- No isolation between services (accept for MVP)
- Future: Use Docker containers for proper isolation

### Resource Management
- No memory/CPU limits (for MVP)
- No automatic scaling
- Future: Add resource limits and monitoring

### Error Handling
- Capture stderr and store as error logs
- Retry failed starts (configurable)
- Exponential backoff for retries

### Data Model Updates

**Workload schema additions:**
- `port: number` - Already exists ✓
- `containerId: string` - Already exists (reuse for process ID) ✓
- `stage: enum` - Already exists ✓
- `logs: LogEntry[]` - Already exists ✓
- `error: string` - Already exists ✓

No schema changes needed! The current workload schema already supports everything we need.

## Example Flow

1. User clicks "Start workload" on project-dataobject service
2. ServiceView creates deployment and workload (already implemented)
3. ServiceView calls `POST /api/workloads/{id}/start`
4. Orchestrator:
   - Updates workload stage to 'validate'
   - Checks service exists at `examples/todo-app/src/services/project-dataobject`
   - Updates stage to 'build'
   - Runs `npm install` if needed (or skip for MVP)
   - Updates stage to 'deploy'
   - Generates API server code for the dataobject
   - Assigns port 3100
   - Updates stage to 'running'
   - Starts server: `node temp-server.js`
   - Updates workload: `port=3100, containerId=<pid>`
5. ServiceView receives success response
6. UI navigates to workload detail page
7. WorkloadDetailView shows:
   - Service running on port 3100
   - Logs: "Server started on port 3100"
   - Status: "running"
   - Stage: "running"

## Development Setup

### Creating a Test Project

To test workload execution with the todo-app example:

1. **Create a project** in the UI with:
   - Name: "Todo App"
   - Key: "TODO"
   - Local Path: `/Users/[username]/Projects/agent-dev-cycle/examples/todo-app`
     (Replace `[username]` with your actual username)

2. **Navigate to the project** and view the services

3. **Click "Start workload"** on any dataobject service (e.g., project-dataobject)

4. **Check the deployment dashboard** to see the workload status and logs

### Required Fields

- **localPath**: Must be an absolute path to the project directory
- For development, this points to a local folder (e.g., `examples/todo-app`)
- For production, projects would be cloned from Git repos

### Troubleshooting

If workload fails to start:
- Check that localPath is correct in the project settings
- Verify the service exists at `{localPath}/src/services/{serviceName}`
- Check logs in the workload detail view for specific errors

## Testing Strategy

1. **Unit tests** for WorkloadOrchestrator
   - Mock file system and child_process
   - Test state transitions
   - Test error handling

2. **Integration tests**
   - Start real workload for project-dataobject
   - Verify API endpoint is accessible
   - Stop workload and verify cleanup

3. **E2E tests**
   - Click "Start workload" in UI
   - Verify workload appears in list
   - Verify logs appear in detail view
   - Click stop and verify workload stops

## Future Enhancements

- Docker container support
- Multi-service deployments
- Environment variable management
- Health checks and auto-restart
- Resource limits (CPU, memory)
- Log retention and rotation
- Metrics and monitoring
- Blue-green deployments
- Service discovery
