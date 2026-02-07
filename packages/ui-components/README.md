# @agentforge/ui-components

Shared UI components for AgentForge services.

## Components

- **Badge** - Status and label badges with variants
- **Spinner** - Loading spinner
- **StatusIndicator** - Colored status indicators
- **TabbedPane** - Tabbed interface component
- **ListPanel** - List display panel
- **Modal** - Modal dialog component

### Badge Variants

- AgentStatusBadge
- AssigneeBadge
- PhaseBadge
- PriorityBadge
- TypeBadge

## Usage

```typescript
import { Badge, Spinner, StatusIndicator } from '@agentforge/ui-components'

function MyComponent() {
  return (
    <>
      <Badge variant='green' size='sm'>Active</Badge>
      <Spinner />
      <StatusIndicator status='success' />
    </>
  )
}
```
