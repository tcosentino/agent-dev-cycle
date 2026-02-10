## Context

AgentForge has deployment tracking infrastructure:
- `deployment-dataobject` - Tracks deployments (id, projectId, serviceName, servicePath, status)
- `workload-dataobject` - Tracks running workloads (id, deploymentId, servicePath, stage, logs, error, containerId, port)

Missing: Any UI to view or interact with deployments.

## Goals / Non-Goals

**Goals:**
- View deployment list and status
- View workload logs for debugging
- Display health indicators

**Non-Goals (defer to future):**
- Real-time log streaming
- Start/stop/restart controls
- Advanced metrics (CPU, memory)
- Custom health check endpoints

## Decisions

### Decision 1: Read-only MVP
**Choice:** Build read-only dashboard first, add controls later

**Rationale:** Viewing deployments and logs provides immediate value without requiring runner integration.

### Decision 2: Log storage approach
**Choice:** Read logs from workload.logs field (stored in database)

**Rationale:** Logs are already captured during agent runs and stored. No need for external log aggregation yet.

**Future:** Stream from Docker logs or file system for long-running services.

## Architecture

Simple dashboard with:
- DeploymentDashboard (list view)
- DeploymentCard (summary)
- LogViewer (modal or panel)
- HealthBadge (status indicator)
