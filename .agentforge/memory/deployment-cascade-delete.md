# Deployment Cascade Delete

**Date:** 2026-02-11

## Problem

When a deployment was deleted via the API, the underlying workloads were not being cleaned up, leaving Docker containers, images, and work directories orphaned.

## Solution

### 1. Added `forceCleanup()` method to WorkloadOrchestrator

Created a new public method that handles cleanup of workloads in any state (running, stopped, or failed):

- Checks if workload is in memory (running state) and stops container
- Falls back to DB lookup if not in memory but has `containerId`
- Cleans up containers, images, and work directories
- Releases allocated ports
- Handles errors gracefully (continues even if resources already removed)

**Location:** [src/services/workload-orchestrator/index.ts:598-640](src/services/workload-orchestrator/index.ts#L598-L640)

### 2. Modified deployment deletion endpoint

Updated the `DELETE /api/deployments/:id` endpoint to:

1. Query all workloads associated with the deployment
2. Call `orchestrator.forceCleanup()` for each workload
3. Delete workload records from database
4. Delete the deployment record
5. Emit `deployment-deleted` event for SSE updates

**Location:** [src/services/workload-integration/index.ts:240-286](src/services/workload-integration/index.ts#L240-L286)

## Key Insights

- The `orchestrator.stop()` method throws an error if workload is not in the "running" state
- `forceCleanup()` is more robust for deletion scenarios as it handles all states
- Docker resources (containers, images) must be explicitly cleaned up - they don't auto-delete
- Port pool cleanup is critical to prevent port exhaustion

## Testing

To verify the fix works:
1. Run `yarn dev`
2. Create a deployment and start a workload
3. Delete the deployment from the UI
4. Verify Docker container is stopped: `docker ps -a | grep workload-`
5. Verify Docker image is removed: `docker images | grep workload-`

## Related Files

- [src/services/workload-orchestrator/index.ts](src/services/workload-orchestrator/index.ts)
- [src/services/workload-integration/index.ts](src/services/workload-integration/index.ts)
