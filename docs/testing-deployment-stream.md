# Testing Real-Time Deployment Updates

## Overview

The deployment list page now uses Server-Sent Events (SSE) to receive real-time updates when workload stages change. This document explains how to test the implementation.

## What Was Implemented

### Backend Changes

1. **Event Emitter** ([workload-orchestrator/events.ts](../src/services/workload-orchestrator/events.ts))
   - Created `WorkloadEventEmitter` to broadcast workload stage updates
   - Exports singleton `workloadEvents` instance

2. **Orchestrator Updates** ([workload-orchestrator/index.ts](../src/services/workload-orchestrator/index.ts))
   - Imports event emitter
   - Calls `emitWorkloadUpdate()` whenever stage changes via `updateStage()`
   - Broadcasts workload ID, deployment ID, project ID, current stage, and full stage array

3. **SSE Endpoint** ([workload-integration/index.ts](../src/services/workload-integration/index.ts))
   - New endpoint: `GET /api/projects/:projectId/deployments/stream`
   - Sends initial snapshot of deployments with workloads on connection
   - Listens to workload events and streams updates to connected clients
   - Filters updates by project ID
   - Sends ping every 15 seconds to keep connection alive
   - Cleans up listeners on disconnect

### Frontend Changes

1. **Hook** ([hooks/useDeploymentStream.ts](../src/services/agentforge-ui/hooks/useDeploymentStream.ts))
   - Custom React hook for SSE connection management
   - Handles initial data load via 'init' event
   - Processes 'workload-update' events to update state
   - Implements exponential backoff for reconnection
   - Provides connection status and error handling

2. **Dashboard Component** ([components/DeploymentDashboard.tsx](../src/services/agentforge-ui/components/DeploymentDashboard.tsx))
   - Replaced polling with `useDeploymentStream` hook
   - Shows connection warning banner when disconnected
   - Replaced window-focus refresh with real-time updates

3. **Animations** ([ProjectViewer.module.css](../src/services/agentforge-ui/ProjectViewer.module.css))
   - Added `scaleIn` animation when stage icons change state
   - Enhanced `pulse` animation for running stages (scale + opacity)
   - Stage connectors turn green when stage completes
   - Smooth transitions on all state changes

## How to Test

### Prerequisites

Make sure the server is running:
```bash
yarn dev
```

### Test Scenario 1: Start a Workload

1. Open the AgentForge UI in your browser
2. Navigate to a project's deployment dashboard
3. Open browser DevTools Network tab and filter for "stream"
4. You should see an SSE connection established to `/api/projects/{id}/deployments/stream`
5. Start a workload via the UI or API
6. Watch the stage timeline update in real-time as the workload progresses:
   - `pending` → `starting-container` → `cloning-repo` → `starting-service` → `running`
7. Observe the animations:
   - Icons scale in when transitioning
   - Running stage icon pulses
   - Stage connectors turn green as stages complete

### Test Scenario 2: Multiple Tabs

1. Open the deployment dashboard in two browser tabs
2. Start a workload in one tab
3. Verify both tabs receive updates simultaneously
4. Stage timeline should update in both tabs without refresh

### Test Scenario 3: Connection Recovery

1. Open deployment dashboard
2. Start a workload
3. Stop the server while workload is running
4. Observe connection warning banner appears
5. Restart the server
6. Hook should automatically reconnect with exponential backoff
7. Updates should resume

### Test Scenario 4: Network Events in DevTools

In Chrome DevTools Network tab, select the SSE request and view the EventStream tab to see:

**Initial connection:**
```
event: init
data: {"type":"init","deployments":[...]}
```

**Workload updates:**
```
event: workload-update
data: {"type":"workload-update","update":{...}}
```

**Keep-alive pings:**
```
event: ping
data: {"type":"ping"}
```

### Test Scenario 5: Performance

1. Create multiple deployments with multiple workloads
2. Start several workloads concurrently
3. Verify UI remains responsive
4. Check browser memory usage stays stable
5. Confirm no duplicate updates

## Expected Behavior

### Visual Feedback

- **Stage icons animate** when transitioning states
- **Running stage pulses** with blue color
- **Completed stages** show green checkmark with scale-in animation
- **Failed stages** show red warning icon
- **Stage connectors** turn green as stages complete
- **Connection banner** appears when SSE disconnects

### Connection Management

- Auto-connects on component mount
- Reconnects automatically on connection loss
- Uses exponential backoff (1s, 2s, 4s, 8s, ... max 30s)
- Cleans up on component unmount
- One connection per project (not per deployment/workload)

### Performance

- Single SSE connection per browser tab
- Incremental updates (only changed workloads)
- No polling overhead
- Minimal bandwidth usage

## Troubleshooting

### No updates received

1. Check browser console for errors
2. Verify SSE connection in Network tab
3. Check server logs for event emission
4. Ensure workload orchestrator has store injected

### Connection keeps dropping

1. Check network stability
2. Verify server isn't timing out SSE connections
3. Check for proxy/firewall issues
4. Confirm ping events are being sent

### Updates delayed

1. Check server load
2. Verify orchestrator is calling `updateStage()`
3. Check event emitter has listeners attached
4. Confirm updates aren't being filtered incorrectly

## API Endpoints

### SSE Stream
```
GET /api/projects/:projectId/deployments/stream
```

**Response:** Server-Sent Events stream

**Events:**
- `init` - Initial snapshot of deployments and workloads
- `workload-update` - Incremental workload stage update
- `ping` - Keep-alive heartbeat (every 15s)

### Existing Endpoints (unchanged)
```
POST /api/workloads/:id/start   - Start a workload
POST /api/workloads/:id/stop    - Stop a workload
GET  /api/workloads/:id/status  - Get workload status
GET  /api/workloads/:id/logs    - Get workload logs
```

## Files Changed

**Backend:**
- `src/services/workload-orchestrator/events.ts` (new)
- `src/services/workload-orchestrator/index.ts` (modified)
- `src/services/workload-integration/index.ts` (modified)

**Frontend:**
- `src/services/agentforge-ui/hooks/useDeploymentStream.ts` (new)
- `src/services/agentforge-ui/components/DeploymentDashboard.tsx` (modified)
- `src/services/agentforge-ui/components/DeploymentDashboard.module.css` (modified)
- `src/services/agentforge-ui/components/DeploymentViews.tsx` (modified)
- `src/services/agentforge-ui/ProjectViewer.module.css` (modified)
- `src/services/agentforge-ui/api.ts` (modified)

**Documentation:**
- `docs/specs/deployment-list-realtime-updates.md` (new)
- `docs/testing-deployment-stream.md` (new)
