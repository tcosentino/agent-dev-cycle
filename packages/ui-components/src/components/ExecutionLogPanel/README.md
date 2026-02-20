# ExecutionLogPanel

A 2-column log viewer component with collapsible stages and status indicators.

## Features

- 2-column layout with stage labels (left) and logs (right)
- Each stage row is independently collapsible/expandable
- Status indicator circles with colors:
  - Gray: pending
  - Blue: running
  - Green: success
  - Red: failed
- Duration display in stage label (e.g., "2.3s")
- Color-coded log levels: blue (info), yellow (warn), red (error)
- Monospace font for logs with formatted timestamps
- Auto-scroll support
- Handles empty states gracefully

## Usage

```tsx
import { ExecutionLogPanel, type StageOutput } from '@agentforge/ui-components'
import { useState } from 'react'

function MyComponent() {
  const [expandedStages, setExpandedStages] = useState(new Set<string>())

  const stageOutputs: StageOutput[] = [
    {
      stage: 'Clone Repository',
      status: 'success',
      startedAt: '2024-01-01T12:00:00Z',
      completedAt: '2024-01-01T12:00:02Z',
      duration: 2300,
      logs: [
        { timestamp: '2024-01-01T12:00:00Z', level: 'info', message: 'Cloning repository...' },
        { timestamp: '2024-01-01T12:00:02Z', level: 'info', message: 'Clone completed' },
      ],
    },
    {
      stage: 'Build',
      status: 'running',
      startedAt: '2024-01-01T12:00:02Z',
      logs: [
        { timestamp: '2024-01-01T12:00:02Z', level: 'info', message: 'Starting build...' },
        { timestamp: '2024-01-01T12:00:03Z', level: 'warn', message: 'Deprecated dependency' },
      ],
    },
    {
      stage: 'Deploy',
      status: 'pending',
      logs: [],
    },
  ]

  const handleToggleStage = (stage: string) => {
    setExpandedStages((prev) => {
      const next = new Set(prev)
      if (next.has(stage)) {
        next.delete(stage)
      } else {
        next.add(stage)
      }
      return next
    })
  }

  return (
    <ExecutionLogPanel
      stageOutputs={stageOutputs}
      expandedStages={expandedStages}
      onToggleStage={handleToggleStage}
      autoScroll={true}
    />
  )
}
```

## Props

### ExecutionLogPanelProps

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `stageOutputs` | `StageOutput[]` | Yes | Array of stage data with logs |
| `expandedStages` | `Set<string>` | Yes | Set of expanded stage keys |
| `onToggleStage` | `(stage: string) => void` | Yes | Callback when stage is clicked |
| `autoScroll` | `boolean` | No | Auto-scroll to bottom (default: true) |

### StageOutput

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `stage` | `string` | Yes | Stage name/label |
| `status` | `'pending' \| 'running' \| 'success' \| 'failed'` | Yes | Current stage status |
| `startedAt` | `string` | No | ISO timestamp when stage started |
| `completedAt` | `string` | No | ISO timestamp when stage completed |
| `duration` | `number` | No | Duration in milliseconds |
| `logs` | `LogEntry[]` | Yes | Array of log entries |
| `error` | `string` | No | Error message if stage failed |

### LogEntry

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `timestamp` | `string` | Yes | ISO timestamp |
| `level` | `'info' \| 'warn' \| 'error'` | Yes | Log level |
| `message` | `string` | Yes | Log message content |

## Styling

The component uses CSS modules and relies on CSS variables for theming. Make sure these variables are defined in your app:

- `--bg-primary`, `--bg-secondary`, `--bg-tertiary`, `--bg-hover`
- `--text-primary`, `--text-secondary`, `--text-muted`
- `--border-color`
- `--accent-tertiary` (blue for active/info)
- `--status-success` (green)
- `--status-warning` (yellow)
- `--status-error` (red)
- `--font-mono` (monospace font)
