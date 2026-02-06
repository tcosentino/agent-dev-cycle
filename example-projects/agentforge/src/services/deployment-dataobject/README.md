# Deployment Data Object

Represents a service deployment configuration.

## Fields

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Unique identifier (auto-generated) |
| projectId | uuid | Reference to parent project |
| serviceName | string | Name of the service being deployed |
| servicePath | string | Path to service in the repository |
| status | enum | active, inactive, archived |
| createdAt | date | Creation timestamp (auto-generated) |

## Usage

Deployments track which services are configured for deployment. Each deployment can have multiple workloads (actual running instances).

```typescript
import { deploymentResource } from './deployment-dataobject'

// Create a deployment for a service
const deployment = await deploymentResource.create({
  projectId: 'proj-af',
  serviceName: 'brand-dataobject',
  servicePath: 'src/services/brand-dataobject'
})
```
