# Deployment List Page - Real-Time Stage Timeline Updates

## Overview

The deployment list page should update the stage timeline for each workload in real-time as the workload progresses through its stages, without requiring manual refresh or window focus.

## Current State

### Existing Components
- [DeploymentDashboard.tsx](../../src/services/agentforge-ui/components/DeploymentDashboard.tsx) - Main dashboard that fetches deployments
- [DeploymentViews.tsx](../../src/services/agentforge-ui/components/DeploymentViews.tsx) - Contains `DeploymentListView`, `DeploymentCard`, `WorkloadCard`, and `WorkloadStages` components
- [WorkloadStages](../../src/services/agentforge-ui/components/DeploymentViews.tsx#L80-L126) - Stage timeline component that displays 6 stages with status indicators

### Stage Flow
1. **starting-container** - Prepare container environment
2. **cloning-repo** - Clone repository
3. **starting-service** - Start the service
4. **running** - Service is running
5. **graceful-shutdown** - Graceful shutdown
6. **stopped** - Stopped

### Stage Statuses
- `pending` - Gray circle icon
- `running` - Blue play icon
- `success` - Green checkmark icon
- `failed` - Red warning icon
- `skipped` - Not currently visualized

### Current Update Mechanism
- Polls data only when window gains focus
- No real-time updates while viewing the page
- User must switch away and back to see updates

## Proposed Solution

### Real-Time Updates via Server-Sent Events (SSE)

Implement SSE streaming for deployment/workload updates, following the existing pattern used in [AgentSessionProgressPanel.tsx](../../src/services/agentforge-ui/components/AgentSessionProgressPanel.tsx).

### Architecture

#### 1. Backend API Endpoint

Create a new SSE endpoint in the API:

```typescript
// packages/server/src/api/deployments.ts
router.get('/projects/:projectId/deployments/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  // Send initial data
  const deployments = getProjectDeployments(req.params.projectId)
  res.write(`data: ${JSON.stringify({ type: 'init', deployments })}\n\n`)

  // Subscribe to workload updates
  const listener = (update: WorkloadUpdate) => {
    if (update.projectId === req.params.projectId) {
      res.write(`data: ${JSON.stringify({ type: 'workload-update', update })}\n\n`)
    }
  }

  workloadEventEmitter.on('workload-update', listener)

  req.on('close', () => {
    workloadEventEmitter.off('workload-update', listener)
  })
})
```

#### 2. Workload Orchestrator Events

Emit events when workload stages change in [workload-orchestrator/index.ts](../../src/services/workload-orchestrator/index.ts):

```typescript
// After updating workload stage status
workloadEventEmitter.emit('workload-update', {
  projectId: workload.projectId,
  deploymentId: workload.deploymentId,
  workloadId: workload.id,
  currentStage: workload.currentStage,
  stages: workload.stages,
  status: workload.status,
  updatedAt: new Date().toISOString()
})
```

#### 3. Frontend Hook

Create `useDeploymentStream` hook similar to [useAgentSessionProgress](../../src/services/agentforge-ui/hooks/useAgentSessionProgress.ts):

```typescript
// src/services/agentforge-ui/hooks/useDeploymentStream.ts
export function useDeploymentStream(projectId: string) {
  const [deployments, setDeployments] = useState<Deployment[]>([])
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const eventSource = new EventSource(
      api.deployments.streamUrl(projectId)
    )

    eventSource.addEventListener('message', (event) => {
      const data = JSON.parse(event.data)

      if (data.type === 'init') {
        setDeployments(data.deployments)
      } else if (data.type === 'workload-update') {
        setDeployments(prev => updateWorkloadInDeployments(prev, data.update))
      }
    })

    eventSource.addEventListener('error', (err) => {
      setError(new Error('Stream connection failed'))
      eventSource.close()
    })

    return () => eventSource.close()
  }, [projectId])

  return { deployments, error }
}
```

#### 4. Update DeploymentDashboard Component

Replace polling with SSE stream in [DeploymentDashboard.tsx](../../src/services/agentforge-ui/components/DeploymentDashboard.tsx):

```typescript
export function DeploymentDashboard({ projectId, onWorkloadClick }: Props) {
  const { deployments, error } = useDeploymentStream(projectId)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (deployments.length > 0 || error) {
      setLoading(false)
    }
  }, [deployments, error])

  // ... rest of component
}
```

### User Experience

#### Visual Feedback
- Stage icons animate when transitioning from `pending` → `running` → `success`/`failed`
- Add subtle pulse animation to `running` stage icon
- Stage connector line fills progressively as stages complete
- Timestamp updates in real-time (e.g., "Running for 2m 34s")

#### Performance Considerations
- Single SSE connection per project (not per deployment/workload)
- Incremental updates only send changed workloads
- Automatic reconnection on connection loss with exponential backoff
- Close connection when component unmounts or user navigates away

#### Fallback Behavior
- If SSE connection fails, fall back to polling every 5 seconds
- Show connection status indicator (online/reconnecting/offline)
- Maintain existing window-focus refresh as backup

## Implementation Phases

### Phase 1: Backend Infrastructure
1. Create SSE endpoint for deployment streaming
2. Add event emitter to workload orchestrator
3. Emit events on stage transitions
4. Test with multiple concurrent deployments

### Phase 2: Frontend Hook
1. Create `useDeploymentStream` hook
2. Handle initial data load
3. Handle incremental updates
4. Implement reconnection logic

### Phase 3: Component Integration
1. Replace polling in `DeploymentDashboard`
2. Remove window-focus refresh (keep as fallback)
3. Add loading and error states
4. Test with multiple browsers/tabs

### Phase 4: Visual Enhancements
1. Add stage transition animations
2. Add running stage pulse animation
3. Add progressive connector fill
4. Add connection status indicator

## Testing Strategy

### Unit Tests
- Test `useDeploymentStream` hook with mock EventSource
- Test workload update merge logic
- Test reconnection behavior

### Integration Tests
- Test SSE endpoint with multiple clients
- Test event emission from orchestrator
- Test connection cleanup on unmount

### Manual Testing
- Open deployment list with running workload
- Verify stages update without refresh
- Test with multiple workloads in different stages
- Test connection recovery after network interruption
- Test performance with 10+ concurrent workloads

## Success Criteria

- ✓ Stage timeline updates in real-time without manual refresh
- ✓ Updates visible within 500ms of stage transition
- ✓ No performance degradation with 10+ active workloads
- ✓ Graceful handling of connection loss/recovery
- ✓ Clear visual feedback for stage transitions
- ✓ Works across multiple browser tabs viewing same project

## Open Questions

1. Should we batch updates if multiple stages change rapidly?
2. Should connection status be shown in UI or just console?
3. Should we persist SSE connection when navigating to workload detail view?
4. Should we add sound/notification for workload completion?

## Related Files

- [DeploymentDashboard.tsx](../../src/services/agentforge-ui/components/DeploymentDashboard.tsx)
- [DeploymentViews.tsx](../../src/services/agentforge-ui/components/DeploymentViews.tsx)
- [useAgentSessionProgress.ts](../../src/services/agentforge-ui/hooks/useAgentSessionProgress.ts) (reference pattern)
- [workload-orchestrator/index.ts](../../src/services/workload-orchestrator/index.ts)
- [ProjectViewer.module.css](../../src/services/agentforge-ui/ProjectViewer.module.css#L1707-L1772) (stage styles)
