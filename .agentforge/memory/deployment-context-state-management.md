# Deployment Context State Management

**Date:** 2026-02-11
**Issue:** UI not updating when deployments/workloads are deleted
**Solution:** Centralized state management with React Context

## Problem

When a deployment was deleted, the UI didn't update automatically:
- Each component managed its own state independently
- SSE connection was only in specific components
- Detail views couldn't detect when their deployment was deleted
- Required page reloads to see changes

## Root Cause

The application had multiple independent state sources:
1. `DeploymentDashboard` had its own SSE connection
2. `DeploymentListView` received snapshot props
3. `WorkloadDetailView` received a workload prop with no updates

When a deployment was deleted:
- SSE event was received by `DeploymentDashboard`
- But detail views had stale data from their initial props
- No shared state to propagate updates

## Solution

Implemented centralized state management using React Context:

### 1. Created DeploymentContext ([src/services/agentforge-ui/contexts/DeploymentContext.tsx](src/services/agentforge-ui/contexts/DeploymentContext.tsx))

```typescript
export function DeploymentProvider({ projectId, children }) {
  const streamResult = useDeploymentStream(projectId)

  // Helper functions to query state
  const getDeploymentById = (id) => { ... }
  const getWorkloadById = (id) => { ... }
  const getWorkloadsByDeploymentId = (deploymentId) => { ... }

  return (
    <DeploymentContext.Provider value={{
      ...streamResult,
      getDeploymentById,
      getWorkloadById,
      getWorkloadsByDeploymentId,
    }}>
      {children}
    </DeploymentContext.Provider>
  )
}

export function useDeployments() {
  const context = useContext(DeploymentContext)
  if (!context) {
    throw new Error('useDeployments must be used within a DeploymentProvider')
  }
  return context
}
```

### 2. Wrapped ProjectViewer with Provider

```typescript
// ProjectViewer.tsx
return (
  <DeploymentProvider projectId={activeProject}>
    <div className={styles.container}>
      {/* All content */}
    </div>
  </DeploymentProvider>
)
```

### 3. Updated Components to Use Context

**DeploymentListView:**
```typescript
const { deployments: deploymentsFromContext, isLoading, error } = useDeployments()
// Use fresh data from context instead of props
```

**WorkloadDetailView:**
```typescript
const { getWorkloadById, getDeploymentById } = useDeployments()

// Always use fresh workload from context
const workload = getWorkloadById(initialWorkload.id) || initialWorkload

// Detect deletion
const isDeleted = !getWorkloadById(initialWorkload.id)

if (isDeleted) {
  return <div>Workload Deleted</div>
}
```

## Benefits

1. **Single Source of Truth:** One SSE connection per project
2. **Automatic Updates:** All consuming components re-render when state changes
3. **Deletion Detection:** Detail views detect when their data is deleted
4. **No Page Reloads:** Everything updates reactively via SSE
5. **Type Safety:** Helper functions provide type-safe data access

## Files Changed

- `src/services/agentforge-ui/contexts/DeploymentContext.tsx` (new)
- `src/services/agentforge-ui/ProjectViewer.tsx`
- `src/services/agentforge-ui/components/DeploymentDashboard.tsx`
- `src/services/agentforge-ui/components/DeploymentViews.tsx`
- `src/services/agentforge-ui/types.ts` (added DeploymentWithWorkloads)

## Type Export Fix

Initial build error:
```
The requested module '/hooks/useDeploymentStream.ts' does not provide an export named 'UseDeploymentStreamResult'
```

Solution: Moved `DeploymentWithWorkloads` type definition from hook to `types.ts` and imported it properly.

## Testing

To verify:
1. Run `yarn dev`
2. Open a workload detail view
3. Delete its deployment from the list view
4. Detail view should automatically show "Workload Deleted"

## Pattern

This centralized context pattern should be used for other real-time data:
- Agent sessions
- Task updates
- Any data with SSE streams

Key principles:
1. One provider per data domain (deployments, tasks, etc.)
2. Provider wraps at appropriate level (ProjectViewer for project-scoped data)
3. Components use context hook, not direct SSE hooks
4. Helper functions for common queries (getById, etc.)
