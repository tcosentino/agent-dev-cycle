# Deployment Dashboard

The Deployment Dashboard provides a comprehensive view of all deployments and workloads for your AgentForge project.

## Features

### 1. View Deployments

- **Dashboard View**: Click on "Deployments" in the Database sidebar to open the deployment dashboard
- **Deployment Cards**: Each deployment shows:
  - Service name and status icon
  - Health badge (Healthy, Unavailable, Unknown)
  - Trigger information (agent, git-push, manual, or scheduled)
  - Branch and commit info (for git-triggered deployments)
  - Created timestamp
  - Description (if provided)

### 2. View Workloads

Each deployment card displays associated workloads with:
- **Module name and type** (e.g., api, worker, ui)
- **Status badge** (pending, running, success, failed, rolledback, stopped)
- **Pipeline stages** with visual indicators:
  - ✓ Success (green)
  - ⚠ Failed (red)
  - ▶ Running (blue, animated)
  - ○ Pending (gray)
- **Artifact information** (container URL, port)
- **Duration** (for completed workloads)
- **"View Logs" button** (appears when logs are available)

### 3. Health Monitoring

Each deployment shows a health badge based on its status:
- **Healthy** (green): Deployment is running or completed successfully
- **Unavailable** (red): Deployment failed or is stopped
- **Unknown** (gray): Deployment is pending

Hover over the health badge to see when the last check occurred (e.g., "Checked 2 minutes ago").

### 4. View Logs

Click the **"Logs"** button on any workload to open the Log Viewer:

#### Log Viewer Features:
- **Search**: Filter logs by text (e.g., search for "error" or "database")
- **Level Filter**: Show all logs, or filter by:
  - Info: General information logs
  - Warn: Warning messages
  - Error: Error messages and stack traces
- **Stage Context**: Each log line shows which pipeline stage it came from:
  - `[validate]` - Validation stage
  - `[build]` - Build stage
  - `[deploy]` - Deployment stage
  - `[healthcheck]` - Health check stage
  - `[test]` - Test stage
- **Syntax Highlighting**: Error logs are highlighted in red for easy identification
- **Download**: Click "Download" to save logs as a text file for offline analysis

#### Log Viewer Controls:
- **Search box**: Type to filter logs in real-time
- **Level dropdown**: Select log level to filter
- **Download button**: Save logs to a file (format: `workloadId-timestamp.log`)
- **Close button**: Click X or click outside the modal to close

### 5. View Modes

The Deployments tab supports two view modes:
- **Dashboard View** (default): Rich visualization with cards, health badges, and quick actions
- **Table View**: Raw database table view for advanced users

Toggle between views using the icons in the tab header.

## Navigation

### Opening the Dashboard

1. Select a project from the project dropdown
2. Look for "Deployments" in the **Database** section of the sidebar
3. Click "Deployments" to open the dashboard

The dashboard will:
- Fetch all deployments for the project
- Load associated workloads for each deployment
- Display them in card format

### Empty State

If no deployments exist, you'll see:
> 🚀 **No deployments yet**  
> Deployments will appear here once you deploy services from this project.

## Deployment Lifecycle

### Deployment Statuses

- **Pending**: Deployment is queued but not yet started
- **Running**: Deployment is currently in progress
- **Success**: Deployment completed successfully
- **Failed**: Deployment encountered an error and failed
- **Stopped**: Deployment was manually stopped

### Workload Statuses

- **Pending**: Workload is queued
- **Running**: Workload is executing pipeline stages
- **Success**: All stages completed successfully
- **Failed**: One or more stages failed
- **Rolledback**: Deployment was rolled back due to failure
- **Stopped**: Workload was stopped

### Pipeline Stages

Each workload goes through these stages in order:

1. **Validate**: Validate service configuration and dependencies
2. **Build**: Build container image or package service
3. **Deploy**: Deploy to target environment
4. **Healthcheck**: Verify service is responding correctly
5. **Test**: Run automated tests (if configured)
6. **Complete**: All stages finished successfully

## API Reference

### Fetching Deployments

```typescript
import { getDeployments, getWorkloads, getWorkloadLogs } from '../api'

// Fetch deployments for a project
const deployments = await getDeployments(projectId)

// Fetch workloads for a deployment
const workloads = await getWorkloads(deploymentId)

// Fetch logs for a workload (aggregated from all stages)
const logs = await getWorkloadLogs(workloadId)
// Returns: Array<{ stage: string, log: string, error?: string }>
```

### Components

- **DeploymentDashboard**: Main dashboard page component
- **DeploymentListView**: List of deployment cards (used in dashboard and table view)
- **DeploymentCard**: Individual deployment card with workloads
- **WorkloadCard**: Individual workload with pipeline stages
- **HealthBadge**: Health status indicator
- **LogViewer**: Modal for viewing and filtering logs

## Future Enhancements (Not Yet Implemented)

- **Real-time log streaming**: Follow mode for live logs
- **Start/Stop/Restart controls**: Manage deployment lifecycle
- **Advanced health checks**: Custom health endpoints and response validation
- **Resource metrics**: CPU, memory, network usage
- **Deployment history**: Timeline of all deployment events
- **Rollback functionality**: One-click rollback to previous version

## Troubleshooting

### Logs not showing

- Check that the workload has completed at least one stage
- Logs are only available for stages that have been executed
- Error logs are always shown, even for failed stages

### Dashboard not loading

- Ensure you have an active project selected
- Check browser console for API errors
- Verify the backend server is running

### Health badge showing "Unknown"

- This is normal for pending deployments
- Once the deployment starts or completes, the badge will update

## Related Documentation

- [OpenSpec: Deployment Dashboard Proposal](../openspec/changes/deployment-dashboard/proposal.md)
- [OpenSpec: Design Decisions](../openspec/changes/deployment-dashboard/design.md)
- [OpenSpec: Specifications](../openspec/changes/deployment-dashboard/specs/)
