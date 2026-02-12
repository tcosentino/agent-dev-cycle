## Context

The workload orchestrator currently manages container lifecycle (start, stop) but lacks user-facing controls and programmatic API access. Users can only view workload status through the UI, requiring manual database operations or code changes to manage running containers. The existing `stop()` method in the orchestrator is only called during deployment deletion, not exposed for user control.

Current architecture:
- **WorkloadOrchestrator**: Manages Docker container lifecycle with `start()` and `stop()` methods
- **SSE Stream**: Real-time updates via `/api/projects/:projectId/deployments/stream`
- **UI**: Read-only deployment dashboard with workload status display
- **Events**: `workloadEvents` EventEmitter for state changes

## Goals / Non-Goals

**Goals:**
- Enable users to stop/restart running workloads from the UI
- Expose workload control operations via REST API for AI agent integration
- Provide real-time feedback for control actions via existing SSE infrastructure
- Design extensible control system for future operations (pause, scale, etc.)
- Show contextual controls based on workload state (only show applicable actions)

**Non-Goals:**
- Advanced container orchestration (scaling, load balancing, health checks)
- Workload scheduling or queue management
- Fine-grained permission system (defer to future auth work)
- Cross-deployment batch operations

## Decisions

### 1. API Design: RESTful endpoints under deployment resource

**Decision:** Add endpoints at `/api/deployments/:deploymentId/workloads/:workloadId/[action]`

**Rationale:**
- RESTful resource nesting matches existing API structure
- Workloads are already scoped to deployments in the data model
- Enables future workload-level operations without restructuring

**Alternatives considered:**
- Generic `/api/workloads/:id/control` endpoint → Less RESTful, harder to extend
- Separate control service → Over-engineering for current scope

**Endpoints:**
```
POST /api/deployments/:deploymentId/workloads/:workloadId/stop
POST /api/deployments/:deploymentId/workloads/:workloadId/restart
GET  /api/deployments/:deploymentId/workloads/:workloadId/logs
```

### 2. Restart Implementation: Stop + Start sequence

**Decision:** Implement `restart()` as orchestrated stop → start sequence with state validation

**Rationale:**
- Leverages existing `stop()` and `start()` methods with proven reliability
- Ensures complete cleanup of resources (ports, containers, work directories)
- Simplifies error handling - each phase can fail independently
- Maintains consistent state transitions through existing stage system

**Alternatives considered:**
- Docker restart command → Doesn't reset orchestrator state, skips repo clone
- Pause/Resume → Doesn't refresh code, limited debugging utility

**Implementation approach:**
```typescript
async restart(workloadId: string): Promise<void> {
  await this.stop(workloadId)
  const workload = await this.workloadStore.findById(workloadId)
  await this.start(workloadId, workload.deploymentId, workload.repoUrl, workload.buildConfig)
}
```

### 3. UI Control Placement: Action buttons in workload detail view

**Decision:** Add action button row in workload detail panel, below header, above stage timeline

**Rationale:**
- Contextual placement near relevant workload information
- Buttons can be conditionally shown based on workload state
- Consistent with existing UI patterns in deployment views
- Non-intrusive, doesn't clutter the main deployment list

**Alternatives considered:**
- Dropdown menu → Extra click, less discoverable
- Floating action button → Disrupts visual flow
- Table row actions → Limited space, harder to show multiple options

**Button states:**
- Running: Show "Stop" and "Restart"
- Stopped: Show "Restart"
- Starting/Transitioning: Disable all buttons
- Failed: Show "Restart"

### 4. Real-Time Updates: Reuse existing SSE infrastructure

**Decision:** Emit control action events through existing `workloadEvents` EventEmitter

**Rationale:**
- No new SSE endpoints needed - leverage `/deployments/stream`
- Consistent with current real-time update pattern
- All connected clients receive updates automatically
- Simplifies client-side implementation

**Event types:**
- Existing `workload-update` event covers state changes
- No new event types needed - stage transitions carry all information

### 5. Error Handling: Graceful failures with clear user feedback

**Decision:** Return structured error responses with actionable messages

**Rationale:**
- Users need to understand why controls fail (container already stopped, etc.)
- API consumers (AI agents) need programmatic error detection
- Prevents invalid state transitions

**Error structure:**
```typescript
{
  error: 'InvalidState',
  message: 'Cannot stop workload: already stopped',
  workloadId: string,
  currentStage: WorkloadStage
}
```

## Risks / Trade-offs

**Risk: Concurrent control requests** → Mitigation: Add operation locking in orchestrator to prevent race conditions

**Risk: SSE disconnect during long operations** → Mitigation: Clients already have reconnection logic; operations continue server-side

**Trade-off: Restart = full rebuild** → Slower than in-place restart, but ensures clean state and latest code

**Risk: Container stop timeout** → Mitigation: Existing graceful shutdown timeout (30s) handles this; logs show timeout status

**Trade-off: No operation queue** → Multiple rapid requests may conflict; acceptable for current use case (single user per deployment)

## Open Questions

None - design is ready for implementation.
