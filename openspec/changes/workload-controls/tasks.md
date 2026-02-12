## 1. Orchestrator Enhancements

- [x] 1.1 Add `restart()` method to WorkloadOrchestrator that stops then starts workload with same config
- [x] 1.2 Add operation locking mechanism to prevent concurrent control requests on same workload
- [x] 1.3 Enhance error messages for invalid state transitions (already stopped, transitioning, etc.)
- [x] 1.4 Add validation to check workload state before allowing stop/restart operations

## 2. API Endpoints

- [x] 2.1 Create `POST /api/deployments/:deploymentId/workloads/:workloadId/stop` endpoint
- [x] 2.2 Create `POST /api/deployments/:deploymentId/workloads/:workloadId/restart` endpoint
- [x] 2.3 Create `GET /api/deployments/:deploymentId/workloads/:workloadId/logs` endpoint
- [x] 2.4 Add authentication and authorization checks to all workload control endpoints
- [x] 2.5 Implement structured error responses with error codes (InvalidState, Conflict, NotFound, etc.)

## 3. Type Definitions

- [x] 3.1 Add TypeScript types for control operation requests and responses
- [x] 3.2 Add error response types (InvalidStateError, ConflictError, etc.)
- [x] 3.3 Update workload types to include operation lock state if needed

## 4. UI Components - Control Buttons

- [x] 4.1 Create WorkloadControls component with Stop, Restart, View Logs buttons
- [x] 4.2 Implement button state logic based on workload stage (running, stopped, transitioning, failed)
- [x] 4.3 Add API client functions for stop, restart, and get logs operations
- [x] 4.4 Integrate WorkloadControls into workload detail view in DeploymentViews.tsx
- [x] 4.5 Add loading states and disable buttons during operations
- [x] 4.6 Add toast notifications for operation success/failure feedback

## 5. UI Components - Log Viewer

- [x] 5.1 Enhance existing LogViewer component to display logs from API response
- [x] 5.2 Add log grouping by stage with timestamps
- [x] 5.3 Add log level indicators (info, warn, error) with visual styling
- [x] 5.4 Ensure log viewer updates in real-time via SSE workload-update events

## 6. Real-Time Updates

- [x] 6.1 Verify workload-update SSE events emit correctly for stop operations
- [x] 6.2 Verify workload-update SSE events emit correctly for restart operations
- [x] 6.3 Test that UI updates automatically when control operations complete
- [x] 6.4 Test reconnection behavior during long-running operations

## 7. Error Handling

- [x] 7.1 Handle "already stopped" error in UI with user-friendly message
- [x] 7.2 Handle "operation in progress" conflict error with retry suggestion
- [x] 7.3 Handle container timeout errors with clear feedback
- [x] 7.4 Add error boundary for workload control component failures

## 8. Testing

- [x] 8.1 Write test for orchestrator restart() method
- [x] 8.2 Write test for operation locking mechanism
- [x] 8.3 Write API endpoint tests for stop, restart, logs with various workload states
- [x] 8.4 Write test for concurrent operation prevention
- [x] 8.5 Manual test: stop running workload from UI
- [x] 8.6 Manual test: restart stopped workload from UI
- [x] 8.7 Manual test: view logs for workload with multiple stages
- [x] 8.8 Manual test: verify SSE updates work during control operations

## 9. Documentation

- [x] 9.1 Update CLAUDE.md with workload control patterns and API endpoints
- [x] 9.2 Add memory entry for any bugs or learnings discovered during implementation
