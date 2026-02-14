## Why

Users need the ability to control running workloads directly from the UI without requiring manual intervention or API calls. Currently, there's no way to stop, restart, or manage container lifecycle once a workload is running. Adding interactive controls enables better debugging, resource management, and user autonomy while also creating an API surface for AI agents to manage workloads programmatically.

## What Changes

- Add control buttons to workload detail view (Stop, Restart, View Logs)
- Implement API endpoints for workload lifecycle operations
- Add real-time status updates via SSE for control actions
- Design extensible control system for future operations (pause, scale, etc.)
- Ensure controls are contextual (only show applicable actions based on workload state)
- Provide clear feedback and error handling for all control operations

## Capabilities

### New Capabilities

- `workload-lifecycle-controls`: Interactive UI controls and API endpoints for managing workload container lifecycle (stop, restart, view logs)
- `workload-control-api`: REST API endpoints for programmatic workload control, enabling AI agents and external systems to manage workloads

### Modified Capabilities

<!-- No existing capabilities are being modified -->

## Impact

- **UI Components**: New control buttons and modals in workload detail view (`DeploymentViews.tsx`, `DeploymentDashboard.tsx`)
- **API Endpoints**: New endpoints in workload-integration service for lifecycle operations
- **Orchestrator**: Enhanced orchestrator methods for restart and status queries
- **SSE Events**: New event types for control actions and state transitions
- **Type Definitions**: New types for control operations and responses
- **Error Handling**: Improved error messages for failed control operations
