## Why

AgentForge has deployment and workload dataobjects for tracking deployed services, but no UI to view, manage, or monitor them. Users currently have no way to:
- See which services are running
- View deployment status and health
- Check service logs for debugging
- Start, stop, or restart services
- Monitor resource usage or errors

This is critical for production use and dogfooding. Without a deployment dashboard, AgentForge is blind to what's actually running and can't diagnose issues when they occur.

## What Changes

Add a comprehensive deployment dashboard with three main capabilities:

### 1. Deployment Management
- View all deployments for a project
- See deployment status (running, stopped, failed, pending)
- View associated workloads for each deployment
- Start, stop, and restart deployments
- Delete deployments with confirmation
- Display deployment metadata (service name, path, created date)

### 2. Log Viewer
- Stream logs from running workloads in real-time
- View historical logs
- Search and filter logs
- Toggle log levels (info, warn, error, debug)
- Download logs for offline analysis
- Syntax highlighting for stack traces

### 3. Health Monitoring
- Health check status for each service
- Uptime tracking
- Error rate monitoring
- Resource usage indicators (CPU, memory - if available)
- Alert badges for services in degraded state
- Last health check timestamp

## Capabilities

### New Capabilities
- `deployment-management`: View, start, stop, restart, delete deployments
- `log-viewer`: Stream and search service logs
- `health-monitoring`: Health checks and uptime tracking

### Modified Capabilities
- `project-viewer`: Add "Deployments" tab to main navigation
- `database-table-view`: Already shows deployments/workloads tables, enhance with actions

## Impact

**UI Changes:**
- New `DeploymentDashboard` component (main page)
- New `DeploymentCard` component (deployment summary card)
- New `LogViewer` component (log streaming and display)
- New `HealthBadge` component (health status indicator)
- Add "Deployments" tab to ProjectViewer navigation

**API Changes:**
- May need new endpoints for deployment control:
  - `POST /api/deployments/:id/start`
  - `POST /api/deployments/:id/stop`
  - `POST /api/deployments/:id/restart`
- May need log streaming endpoint:
  - `GET /api/workloads/:id/logs` (with query params for filtering)
  - `GET /api/workloads/:id/logs/stream` (SSE or WebSocket)
- May need health check endpoint:
  - `GET /api/deployments/:id/health`

**Backend Changes:**
- Runner or separate service manager to handle start/stop/restart
- Log aggregation (read from Docker logs, container stdout, or log files)
- Health check polling (ping service endpoint, check process status)

**No Breaking Changes:**
- All changes are additive
- Existing deployment/workload dataobjects continue to work

## Risks & Mitigations

**[Risk]** Log streaming could consume significant bandwidth
→ **Mitigation:** Limit to recent logs (last 1000 lines), add pagination, implement log levels filtering

**[Risk]** Start/stop/restart may require elevated permissions or infrastructure changes
→ **Mitigation:** Start with read-only dashboard (view status, logs), add controls in future when infrastructure supports it

**[Risk]** Health checks could add load to services
→ **Mitigation:** Configurable polling interval (default 30s), disable health checks for specific services

**[Risk]** Different deployment types (Docker, local process, cloud) may need different log sources
→ **Mitigation:** Abstract log fetching behind interface, implement adapters for each deployment type

## MVP Scope

For initial implementation, focus on:
1. **Read-only deployment list** with status and metadata
2. **Log viewer** for workloads (historical logs, no real-time streaming yet)
3. **Basic health indicators** (status badge based on deployment.status field)

**Defer to future:**
- Real-time log streaming (SSE/WebSocket)
- Start/stop/restart controls (requires runner integration)
- Advanced health checks (custom endpoints, resource monitoring)
- Metrics and dashboards (CPU, memory, network)
