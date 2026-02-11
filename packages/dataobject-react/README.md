# @agentforge/dataobject-react

React hooks for `@agentforge/dataobject` resources powered by React Query.

## Installation

```bash
yarn add @agentforge/dataobject-react @tanstack/react-query
```

## Usage

### 1. Generate hooks from your dataobject

```typescript
// src/services/task-dataobject/hooks.ts
import { createResourceHooks } from '@agentforge/dataobject-react'
import { taskResource } from './index'

export const {
  useList: useTasks,
  useGet: useTask,
  useCreate: useCreateTask,
  useUpdate: useUpdateTask,
  useDelete: useDeleteTask,
} = createResourceHooks(taskResource, {
  baseUrl: '/api',
  optimistic: true, // Enable optimistic updates
})
```

### 2. Use hooks in your components

```typescript
import { useTasks, useUpdateTask } from '@/services/task-dataobject/hooks'

function TaskBoard() {
  const { data: tasks, isLoading } = useTasks()
  const updateTask = useUpdateTask()

  const handleDragEnd = (taskId: string, newStatus: string) => {
    // Optimistic update - UI changes immediately
    updateTask.mutate({ id: taskId, status: newStatus })
  }

  if (isLoading) return <div>Loading...</div>

  return <Board tasks={tasks} onDragEnd={handleDragEnd} />
}
```

## Features

- **Auto-generated hooks** - Create hooks from dataobject definitions
- **Type-safe** - Full TypeScript inference from Zod schemas
- **Optimistic updates** - Instant UI feedback with automatic rollback on error
- **Smart caching** - Powered by React Query
- **Automatic sync** - All components stay in sync via shared cache

## API

### `createResourceHooks(resource, config)`

Generates React Query hooks for a dataobject resource.

**Parameters:**
- `resource` - Dataobject resource definition
- `config.baseUrl` - Base URL for API calls
- `config.optimistic` - Enable optimistic updates (default: false)
- `config.keyPrefix` - Optional prefix for query keys

**Returns:**
- `useList(options?)` - Fetch all records
- `useGet(id, options?)` - Fetch single record
- `useCreate()` - Create mutation hook
- `useUpdate()` - Update mutation hook
- `useDelete()` - Delete mutation hook

## License

MIT
