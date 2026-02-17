# ExecutionControls

A reusable component for displaying execution control buttons (Cancel, Retry, Stop, Restart) based on execution mode and status.

## Usage

```tsx
import { ExecutionControls } from '@agentforge/ui-components'

// Job mode - shows Cancel when running, Retry when failed/cancelled
<ExecutionControls
  mode="job"
  status="executing"
  onCancel={handleCancel}
  isCancelling={isCancelling}
/>

// Service mode - shows Stop when running, Restart when running/stopped/failed
<ExecutionControls
  mode="service"
  status="running"
  onStop={handleStop}
  onRestart={handleRestart}
  isStopping={isStopping}
  isRestarting={isRestarting}
/>
```

## Props

| Prop | Type | Description |
|------|------|-------------|
| `mode` | `'job' \| 'service'` | Execution mode determining which buttons are available |
| `status` | `string` | Current execution status (e.g., 'running', 'failed', 'stopped') |
| `onCancel` | `() => void` | Handler for cancel action (job mode) |
| `onRetry` | `() => void` | Handler for retry action (job mode) |
| `onStop` | `() => void` | Handler for stop action (service mode) |
| `onRestart` | `() => void` | Handler for restart action (service mode) |
| `isCancelling` | `boolean` | Shows "Cancelling..." loading state |
| `isRetrying` | `boolean` | Shows "Retrying..." loading state |
| `isStopping` | `boolean` | Shows "Stopping..." loading state |
| `isRestarting` | `boolean` | Shows "Restarting..." loading state |

## Button Visibility Rules

### Job Mode
- **Cancel button**: Shown when status is not in ['completed', 'failed', 'cancelled', 'stopped', 'pending'] AND `onCancel` is provided
- **Retry button**: Shown when status is 'failed' or 'cancelled' AND `onRetry` is provided

### Service Mode
- **Stop button**: Shown when status is not in ['completed', 'failed', 'cancelled', 'stopped', 'pending'] AND `onStop` is provided
- **Restart button**: Shown when status is 'running', 'stopped', or 'failed' AND `onRestart` is provided

## Styling

The component uses CSS modules with the following classes:
- `.cancelButton` - Red button for cancel/stop actions
- `.retryButton` - Blue accent button for retry action
- `.stopButton` - Red button for stop action
- `.restartButton` - Blue accent button for restart action

All buttons:
- Are disabled during loading states
- Show loading text (e.g., "Cancelling...", "Stopping...")
- Have hover states with opacity transitions
