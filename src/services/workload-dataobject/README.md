# Workload Data Object

Running instances of deployed services with pipeline state.

## Fields

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Unique identifier (auto-generated) |
| deploymentId | uuid | Reference to parent deployment |
| servicePath | string | Path to service in the repository |
| stage | enum | pending, validate, build, deploy, running, failed, stopped |
| logs | json | Array of log entries from the pipeline |
| error | text | Error message if stage is 'failed' |
| containerId | string | Docker container ID when running |
| port | number | Exposed port when running |
| createdAt | date | Creation timestamp (auto-generated) |
| updatedAt | date | Last update timestamp (auto-generated) |

## Pipeline Stages

1. **pending** - Workload created, waiting to start
2. **validate** - Validating service.json and dependencies
3. **build** - Building Docker image
4. **deploy** - Starting container
5. **running** - Container is running and healthy
6. **failed** - Pipeline failed at some stage
7. **stopped** - Workload was stopped

## Actions

### run
Start the deployment pipeline. Workload progresses through stages.

### stop
Stop a running workload. Stops the Docker container.

## Usage

```typescript
import { workloadResource } from './workload-dataobject'

// Create a workload
const workload = await workloadResource.create({
  deploymentId: 'dep-123',
  servicePath: 'src/services/brand-dataobject'
})

// Start the pipeline
await workloadResource.actions.run(workload.id)

// Later, stop it
await workloadResource.actions.stop(workload.id)
```
