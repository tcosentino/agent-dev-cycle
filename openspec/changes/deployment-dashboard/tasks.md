## 1. API Integration
- [x] 1.1 Create getDeployments(projectId) in api.ts
- [x] 1.2 Create getWorkloads(deploymentId) in api.ts
- [x] 1.3 Create getWorkloadLogs(workloadId) in api.ts

## 2. Deployment Dashboard Page
- [x] 2.1 Create DeploymentDashboard component
- [x] 2.2 Fetch deployments on mount
- [x] 2.3 Display deployment cards in grid
- [x] 2.4 Add empty state for no deployments

## 3. Deployment Card
- [x] 3.1 Create DeploymentCard component
- [x] 3.2 Display service name, status badge, created date
- [x] 3.3 Add click handler to open details
- [x] 3.4 Style status badges (running=green, stopped=gray, failed=red)

## 4. Deployment Detail Panel
- [x] 4.1 Create DeploymentDetailPanel component
- [x] 4.2 Display all deployment fields
- [x] 4.3 List associated workloads
- [x] 4.4 Add "View Logs" button for each workload

## 5. Log Viewer
- [x] 5.1 Create LogViewer component
- [x] 5.2 Fetch and display workload logs
- [x] 5.3 Add search and filter UI
- [x] 5.4 Add download logs button
- [x] 5.5 Style log lines with syntax highlighting

## 6. Health Badge
- [x] 6.1 Create HealthBadge component
- [x] 6.2 Display status based on deployment.status
- [x] 6.3 Add tooltip with last check time

## 7. Navigation Integration
- [x] 7.1 Add "Deployments" tab to ProjectViewer

## 8. Testing
- [ ] 8.1 Test deployment list rendering
- [ ] 8.2 Test log viewer with various log formats
- [ ] 8.3 Test empty states

## 9. Documentation
- [ ] 9.1 Document deployment dashboard usage
