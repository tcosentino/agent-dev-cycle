# Infinite API Loop Fix

## Problem

When opening the workload detail page, thousands of API requests were being made per second, causing the browser to become unresponsive.

## Root Causes

### 1. Polling on Workload Record View ⚠️ **ACTUAL ROOT CAUSE**
**Location:** [src/services/agentforge-ui/ProjectViewer.tsx:835-848](../../src/services/agentforge-ui/ProjectViewer.tsx#L835-L848)

The `useEffect` hook was refreshing the entire project snapshot (fetching ALL deployments, workloads, tasks, sessions, channels, etc. via REST APIs) **every time a workload record was viewed**. This created an infinite loop:

1. User opens workload detail page (record view)
2. useEffect fires → calls `onRefreshSnapshot()`
3. Fetches ALL project data via multiple REST API calls
4. Updates `dbData` state in parent component
5. Parent re-renders and passes new `snapshot` prop to ProjectViewer
6. Meanwhile, SSE stream also sends workload updates
7. SSE updates also update `dbData`
8. Changes to `dbData` cause re-render, which updates the record prop
9. Loop repeats thousands of times per second

**Why this happened:**
- The effect triggered for both table views AND record views of workloads/deployments
- SSE was already providing real-time updates for workloads
- Polling was completely redundant for record views
- Each refresh fetched ALL project resources, not just the workload being viewed

### 2. Container Monitoring Excessive Updates
**Location:** [src/services/workload-orchestrator/index.ts:338-364](../../src/services/workload-orchestrator/index.ts#L338-L364)

The `monitorContainer()` method was calling the callback every 5 seconds (via `DockerClient.monitorContainer()`), which triggered:
- Database update via `updateStage()`
- SSE event emission via `emitWorkloadUpdate()`
- Frontend re-render via `setDeployments()`

This happened **even when the container state hadn't changed**, causing unnecessary database writes and SSE events every 5 seconds.

### 3. useDeploymentStream Dependency Loop
**Location:** [src/services/agentforge-ui/hooks/useDeploymentStream.ts:164-176](../../src/services/agentforge-ui/hooks/useDeploymentStream.ts#L164-L176)

The `useEffect` hook had `connect` and `disconnect` callbacks in its dependency array. Since these are `useCallback` hooks that can be recreated, this could cause the SSE connection to disconnect and reconnect repeatedly.

```typescript
useEffect(() => {
  if (projectId) {
    connect()  // This calls disconnect() first
  }
  // ...
}, [projectId, connect, disconnect])  // ← connect/disconnect can trigger re-runs
```

## Solutions

### Fix 1: Disable Polling for Workload Record Views ⚠️ **PRIMARY FIX** (IMPLEMENTED)

Modified the `useEffect` in ProjectViewer to **only** refresh snapshots when viewing deployment/workload **table** views, NOT record views:

```typescript
// Refresh snapshot when switching to deployments or workloads tables or records
// NOTE: Workloads and deployments use SSE for real-time updates, but we still
// refresh on tab switch to catch any missed updates or initial load
useEffect(() => {
  const activeTab = activePane === 'left' ? activeLeftTab : activeRightTab
  if (activeTab?.type === 'table') {
    const tableName = activeTab.path as DbTableName
    if (tableName === 'deployments' || tableName === 'workloads') {
      onRefreshSnapshot?.(activeProject)
    }
  }
  // Don't refresh for workload/deployment records - SSE provides real-time updates
  // and polling causes unnecessary load
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [activeLeftTab, activeRightTab, activePane, activeProject])
```

**Impact:** Eliminates thousands of redundant API calls per second when viewing workload details. SSE provides real-time updates, so polling is unnecessary.

### Fix 2: Track Container State Changes (IMPLEMENTED)

Modified `monitorContainer()` to only trigger updates when the container state **actually changes** from running to stopped:

```typescript
private monitorContainer(workloadId: string, containerId: string, port: number, workDir: string): void {
  let lastRunningState: boolean | null = null

  this.dockerClient.monitorContainer(containerId, async (state) => {
    // Only process if state changed from running to not running
    if (lastRunningState === true && !state.running) {
      const exitCode = state.exitCode || 0

      await this.addLog(...)
      await this.updateStage(...)
      // ... cleanup ...
    }

    // Track last state
    lastRunningState = state.running
  })
}
```

**Impact:** Reduces database writes and SSE events from **every 5 seconds** to **only when container stops**.

### Fix 3: Remove Callback Dependencies (IMPLEMENTED)

Removed `connect` and `disconnect` from the `useEffect` dependency array, keeping only `projectId`:

```typescript
useEffect(() => {
  if (projectId) {
    connect()
  } else {
    disconnect()
    setDeployments([])
    setIsLoading(false)
  }

  return () => {
    disconnect()
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [projectId])  // ← Only projectId
```

**Impact:** Prevents unnecessary SSE reconnections and reduces re-renders.

## Additional Context: Log Batching (Already Fixed)

In the previous fix, we modified `addLog()` to store logs in memory only and batch-write them to the database during `updateStage()` calls. This prevented the issue where every log line was triggering a database write.

**Location:** [src/services/workload-orchestrator/index.ts:60-73](../../src/services/workload-orchestrator/index.ts#L60-L73)

## Testing

1. **Start a new deployment** and verify:
   - Workload progresses through stages normally
   - No excessive API calls in browser network tab
   - Workload detail page opens without infinite loop

2. **Monitor running workload:**
   - Open workload detail page
   - Check browser network tab - should see minimal API activity
   - Verify no requests are being made every 5 seconds

3. **Stop a workload:**
   - Verify container stop is detected
   - Verify stage transitions to 'stopped' with status 'success'
   - Verify no duplicate events

## Success Criteria

✅ No API calls every 5 seconds when workload is running
✅ Workload detail page doesn't cause infinite API loop
✅ Container state changes are still detected and processed
✅ SSE connection remains stable without reconnecting
✅ Deployment dashboard updates in real-time

## Files Modified

1. **[src/services/agentforge-ui/ProjectViewer.tsx](../../src/services/agentforge-ui/ProjectViewer.tsx#L835-L848)** ⚠️ PRIMARY FIX
   - Removed workload/deployment record views from snapshot refresh trigger
   - Only refresh on table view switches, not record views
   - SSE handles real-time updates for records

2. [src/services/workload-orchestrator/index.ts](../../src/services/workload-orchestrator/index.ts#L338-L364)
   - Added `lastRunningState` tracking to only process actual state changes

3. [src/services/agentforge-ui/hooks/useDeploymentStream.ts](../../src/services/agentforge-ui/hooks/useDeploymentStream.ts#L164-L176)
   - Removed `connect` and `disconnect` from useEffect dependencies
