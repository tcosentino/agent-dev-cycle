# Workload Detail Page

## Overview

The workload detail page displays comprehensive information about a single workload, including its current stage, artifacts, and logs organized by pipeline stage.

## Current Implementation

### Component Location
- [WorkloadDetailView](../../src/services/agentforge-ui/components/DeploymentViews.tsx#L546) - Main detail view component

### Page Sections

#### 1. Header
Displays workload identification and current status:
- Workload name (module name or service path)
- Workload type (service, infrastructure, etc.)
- Current stage with color-coded label in top right (e.g., "Starting Container", "Running")
  - **Color coding by status:**
    - 🔵 Blue: Running stages (active operations)
    - 🟢 Green: Success states (completed successfully)
    - 🔴 Red: Failed states (errors or failures)
    - ⚪ Gray: Pending states (not yet started)
- Overall status badge (running, success, failed)

#### 2. Artifacts Section
Shows workload outputs and metadata:
- Docker image name
- Container ID/name
- Service URL (if applicable)
- Port number (if applicable)
- Uptime (for running workloads)
- Duration (for completed workloads)

#### 3. Pipeline Stages Section
Displays the workload's progression through stages with detailed logs.

**Key Feature: Each stage has its own separate section of logs**

Each stage is displayed as a `StageDetailCard` that includes:
- Stage name with formatted label
- Stage status (pending, running, success, failed)
- Stage-specific logs
- Stage-specific error messages (if failed)
- Stage timing information

The stages are displayed in order:
1. **starting-container** - Container initialization logs
2. **cloning-repo** - Git clone operation logs
3. **starting-service** - Service startup logs
4. **running** - Runtime logs and service output
5. **graceful-shutdown** - Shutdown sequence logs
6. **stopped** - Final cleanup logs

### Stage Log Organization

**Each pipeline stage maintains its own isolated log section:**
- Logs are grouped by `stage` field in the `StageResult` object
- Each stage's logs are stored in `stage.logs[]` array
- Logs are displayed in chronological order within each stage
- Stage errors are displayed separately as `stage.error`

This separation allows users to:
- Quickly identify which stage failed
- See stage-specific context without scrolling through mixed logs
- Understand the progression through the pipeline visually
- Copy logs from specific stages individually

### Copy Logs Feature
A "Copy All Logs" button in the section header copies all stage logs to clipboard in this format:
```
[stage-name]
log line 1
log line 2
Error: error message (if present)

[next-stage-name]
log line 1
...
```

## Data Structure

### Workload Type
```typescript
interface Workload {
  id: string
  moduleName?: string
  moduleType?: string
  status: 'running' | 'success' | 'failed'
  currentStage?: WorkloadStage
  stages?: StageResult[]
  artifacts?: {
    imageName?: string
    containerName?: string
    url?: string
    port?: number
  }
  createdAt?: string
  completedAt?: string
}
```

### StageResult Type
```typescript
interface StageResult {
  stage: WorkloadStage
  status: StageStatus
  logs?: string[]      // Stage-specific logs
  error?: string       // Stage-specific error
  startedAt?: string
  completedAt?: string
}
```

## Stage Flow

The standard pipeline progression:
1. **starting-container** → Initialize Docker container
2. **cloning-repo** → Clone Git repository
3. **starting-service** → Start the service process
4. **running** → Service running normally
5. **graceful-shutdown** → Graceful shutdown initiated
6. **stopped** → Container stopped

## Visual Design

### Stage Detail Card
Each stage section includes:
- Stage header with icon indicating status:
  - ⏱️ Pending: Gray circle
  - ▶️ Running: Blue play icon
  - ✓ Success: Green checkmark
  - ⚠️ Failed: Red warning icon
- Stage name label
- Log viewer with syntax highlighting
- Error display (if failed)
- Timestamp information

### Styling References
- [ProjectViewer.module.css](../../src/services/agentforge-ui/ProjectViewer.module.css) - Contains all workload detail styles
- Stage-specific status classes: `.stage-pending`, `.stage-running`, `.stage-success`, `.stage-failed`
- Header stage label should use color coding to match the current stage status:
  - `.workloadStatusStage` with dynamic color based on status
  - Blue for running states
  - Green for success states
  - Red for failed states
  - Gray for pending states
- Log viewer styles with proper scrolling and syntax highlighting

## User Interactions

### Available Actions
1. **View workload details** - Click workload card from deployment list
2. **Copy all logs** - Copy logs from all stages to clipboard
3. **Copy stage logs** - Copy logs from individual stage (via StageDetailCard)
4. **Click service URL** - Open running service in new tab
5. **View timestamps** - See uptime/duration for workloads

### Navigation
- Users navigate to this view by clicking a workload card in the deployment list
- Accessed via `onWorkloadClick` callback from `DeploymentListView`

## Related Files

- [DeploymentViews.tsx](../../src/services/agentforge-ui/components/DeploymentViews.tsx) - Contains `WorkloadDetailView` and `StageDetailCard` components
- [ProjectViewer.module.css](../../src/services/agentforge-ui/ProjectViewer.module.css) - Styling for detail view
- [LogViewer.tsx](../../src/services/agentforge-ui/components/LogViewer.tsx) - Log display component used in stage cards
- [workload-orchestrator/index.ts](../../src/services/workload-orchestrator/index.ts) - Manages workload lifecycle and stage progression

## Future Enhancements

### Real-Time Log Streaming
Extend the SSE implementation from [deployment-list-realtime-updates.md](./deployment-list-realtime-updates.md) to stream logs in real-time:
- Stream new log lines as they're generated
- Update stage status in real-time
- Auto-scroll to latest logs (with user override)
- Highlight new log lines briefly when they appear

### Stage Interaction
- Expand/collapse individual stages
- Filter logs by severity level
- Search within stage logs
- Download individual stage logs

### Enhanced Metadata
- Show stage duration for each completed stage
- Display resource usage (CPU, memory) per stage
- Show retry attempts for failed stages
- Link to source code/commit for the deployment