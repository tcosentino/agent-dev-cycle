# Project Data Object

Represents a software project being built by agents in AgentForge.

## Fields

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Unique identifier (auto-generated) |
| name | string | Full project name |
| key | string | Short uppercase key (2-10 chars, unique) |
| repoUrl | string | Optional Git repository URL |
| createdAt | date | Creation timestamp (auto-generated) |

## Usage

Projects are the top-level organizational unit. All tasks, channels, messages, and agent activity are scoped to a project.

```typescript
import { projectResource } from './project-dataobject'

// Create a new project
const project = await projectResource.create({
  name: 'AgentForge - AI Development Platform',
  key: 'AF',
  repoUrl: 'https://github.com/example/agentforge'
})
```
