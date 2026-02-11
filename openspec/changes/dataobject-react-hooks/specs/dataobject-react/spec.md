## ADDED Requirements

### Requirement: Auto-generate React hooks from dataobject resources

The system SHALL provide a React integration layer that generates type-safe hooks from dataobject resource definitions.

#### Scenario: Create hooks for a dataobject resource

- **GIVEN** a task dataobject is defined with CRUD operations
- **WHEN** developer calls `createResourceHooks(taskResource, config)`
- **THEN** system returns object with hooks:
  - `useList` - Fetch all records
  - `useGet` - Fetch single record by ID
  - `useCreate` - Create new record
  - `useUpdate` - Update existing record
  - `useDelete` - Delete record
- **AND** all hooks are fully typed from the Zod schema

#### Scenario: Use generated hooks in component

- **GIVEN** hooks are generated from task resource
- **WHEN** component calls `const { data: tasks, isLoading } = useTasks()`
- **THEN** tasks have correct TypeScript type inferred from schema
- **AND** loading state is tracked automatically
- **AND** errors are captured in error state

#### Scenario: Update propagates to all subscribed components

- **GIVEN** TaskBoard and TaskDetail both use `useTask(id)`
- **WHEN** TaskDetail calls `updateTask.mutate({ status: 'done' })`
- **THEN** mutation executes optimistically
- **AND** both components receive updated data
- **AND** UI updates simultaneously in both views

#### Scenario: Failed mutation reverts optimistic update

- **GIVEN** task status is changed optimistically from "todo" to "done"
- **WHEN** API returns 500 error
- **THEN** status reverts to "todo" in all views
- **AND** error is shown to user
- **AND** retry option is available

### Requirement: Query key management

The system SHALL automatically generate and manage React Query keys based on resource name and operation.

#### Scenario: List query uses correct key

- **WHEN** component calls `useTasks()`
- **THEN** query uses key `['tasks']`
- **AND** accepts optional filters as parameters
- **WHEN** component calls `useTasks({ status: 'todo' })`
- **THEN** query uses key `['tasks', { status: 'todo' }]`

#### Scenario: Single record query uses correct key

- **WHEN** component calls `useTask('af-123')`
- **THEN** query uses key `['task', 'af-123']`
- **AND** data is cached separately from list query

#### Scenario: Mutation invalidates related queries

- **WHEN** `updateTask.mutate({ id: 'af-123', status: 'done' })`
- **THEN** queries with keys `['tasks']` and `['task', 'af-123']` are invalidated
- **AND** components automatically refetch fresh data

### Requirement: Optimistic updates

The system SHALL support optimistic UI updates with automatic rollback on error.

#### Scenario: Optimistic create

- **WHEN** user creates new task
- **THEN** task appears immediately in list with temporary ID
- **WHEN** API returns success with real ID
- **THEN** temporary ID is replaced with real ID
- **AND** no UI flicker occurs

#### Scenario: Optimistic update

- **GIVEN** task AF-5 has status "todo"
- **WHEN** user drags to "in-progress" column
- **THEN** task moves immediately (optimistic)
- **AND** API call is made in background
- **IF** API succeeds
- **THEN** optimistic state becomes permanent
- **IF** API fails
- **THEN** task reverts to "todo" column
- **AND** error notification shows

#### Scenario: Optimistic delete

- **WHEN** user deletes task AF-8
- **THEN** task disappears from UI immediately
- **AND** DELETE API call is made
- **IF** API fails
- **THEN** task reappears in original position
- **AND** error shows "Failed to delete task"

### Requirement: Type safety

The system SHALL provide full TypeScript type inference from Zod schemas.

#### Scenario: List hook returns typed data

- **GIVEN** task schema has fields: id, title, status, priority
- **WHEN** component uses `const { data } = useTasks()`
- **THEN** TypeScript knows `data` is `Task[]`
- **AND** autocomplete shows all fields
- **AND** accessing `data[0].invalidField` causes type error

#### Scenario: Create hook validates input types

- **WHEN** component calls `createTask.mutate({ title: 'Fix bug' })`
- **THEN** TypeScript validates fields against createFields from resource
- **AND** TypeScript error if required field is missing
- **AND** TypeScript error if invalid field is included

#### Scenario: Update hook validates input types

- **WHEN** component calls `updateTask.mutate({ id: 'af-5', priority: 'invalid' })`
- **THEN** TypeScript error because 'invalid' is not valid priority
- **WHEN** component calls `updateTask.mutate({ id: 'af-5', priority: 'high' })`
- **THEN** TypeScript accepts because 'high' is valid

### Requirement: Relationship loading

The system SHALL support loading related resources based on dataobject relations.

#### Scenario: Load related resources

- **GIVEN** task has relation to user via `assigneeId`
- **WHEN** component calls `useTask('af-5', { include: ['assignee'] })`
- **THEN** task data includes populated assignee object
- **AND** single query fetches both task and user

#### Scenario: Prefetch related data

- **GIVEN** task list shows assignee names
- **WHEN** component calls `useTasks({ include: ['assignee'] })`
- **THEN** all tasks include assignee data
- **AND** no N+1 query problem occurs

### Requirement: Filtering and pagination

The system SHALL support filtering, sorting, and pagination through hook parameters.

#### Scenario: Filter by field

- **WHEN** component calls `useTasks({ where: { status: 'todo' } })`
- **THEN** only tasks with status 'todo' are returned
- **AND** query key includes filter for proper caching

#### Scenario: Sort results

- **WHEN** component calls `useTasks({ orderBy: { priority: 'desc' } })`
- **THEN** tasks are sorted by priority descending
- **AND** order is maintained in cache

#### Scenario: Paginate results

- **WHEN** component calls `useTasks({ page: 1, pageSize: 20 })`
- **THEN** first 20 tasks are returned
- **AND** pagination metadata is included (total, hasMore, etc.)
- **WHEN** user clicks "Next page"
- **AND** component calls `useTasks({ page: 2, pageSize: 20 })`
- **THEN** next 20 tasks are fetched and cached separately

### Requirement: Real-time subscriptions (future)

The system SHALL support WebSocket subscriptions for real-time updates.

#### Scenario: Subscribe to record changes

- **WHEN** component calls `useTask('af-5', { subscribe: true })`
- **THEN** WebSocket connection is established
- **WHEN** another user updates task AF-5
- **THEN** component receives update via WebSocket
- **AND** UI updates automatically without manual refetch

#### Scenario: Subscribe to collection changes

- **WHEN** component calls `useTasks({ subscribe: true })`
- **THEN** WebSocket subscribes to task collection events
- **WHEN** new task is created by another user
- **THEN** new task appears in list automatically
- **WHEN** task is deleted by another user
- **THEN** task is removed from list automatically

## Technical Implementation

### Package Structure

```
@agentforge/dataobject-react/
├── src/
│   ├── createResourceHooks.ts    # Main factory function
│   ├── queryClient.ts            # Configured React Query client
│   ├── types.ts                  # TypeScript types
│   └── index.ts                  # Public exports
├── package.json
├── tsconfig.json
└── README.md
```

### Core API

```typescript
import { createResourceHooks } from '@agentforge/dataobject-react'
import { taskResource } from '@/services/task-dataobject'

export const {
  useList: useTasks,
  useGet: useTask,
  useCreate: useCreateTask,
  useUpdate: useUpdateTask,
  useDelete: useDeleteTask,
} = createResourceHooks(taskResource, {
  baseUrl: '/api',
  // Optional: custom query client
  queryClient: customQueryClient,
  // Optional: enable optimistic updates
  optimistic: true,
  // Optional: custom key prefix
  keyPrefix: 'myapp',
})
```

### Hook Signatures

```typescript
// List hook
function useList<T>(options?: {
  where?: Partial<T>
  orderBy?: Record<keyof T, 'asc' | 'desc'>
  page?: number
  pageSize?: number
  include?: string[]
  subscribe?: boolean
}): {
  data: T[] | undefined
  isLoading: boolean
  isError: boolean
  error: Error | null
  refetch: () => void
}

// Get hook
function useGet<T>(id: string, options?: {
  include?: string[]
  subscribe?: boolean
}): {
  data: T | undefined
  isLoading: boolean
  isError: boolean
  error: Error | null
  refetch: () => void
}

// Create mutation
function useCreate<T>(): {
  mutate: (data: CreateInput<T>) => void
  mutateAsync: (data: CreateInput<T>) => Promise<T>
  isLoading: boolean
  isError: boolean
  error: Error | null
  reset: () => void
}

// Update mutation
function useUpdate<T>(): {
  mutate: (data: { id: string } & Partial<UpdateInput<T>>) => void
  mutateAsync: (data: { id: string } & Partial<UpdateInput<T>>) => Promise<T>
  isLoading: boolean
  isError: boolean
  error: Error | null
  reset: () => void
}

// Delete mutation
function useDelete(): {
  mutate: (id: string) => void
  mutateAsync: (id: string) => Promise<void>
  isLoading: boolean
  isError: boolean
  error: Error | null
  reset: () => void
}
```

### Query Key Generation

The package automatically generates query keys:

```typescript
// List queries
['tasks'] // All tasks
['tasks', { status: 'todo' }] // Filtered tasks
['tasks', { page: 2, pageSize: 20 }] // Paginated tasks

// Single record queries
['task', 'af-123'] // Specific task

// Invalidation patterns
invalidateQueries(['tasks']) // Invalidates all task lists
invalidateQueries(['task', id]) // Invalidates specific task
```

### Optimistic Update Implementation

```typescript
updateTask.mutate(
  { id: 'af-5', status: 'done' },
  {
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries(['task', variables.id])

      // Snapshot previous value
      const previous = queryClient.getQueryData(['task', variables.id])

      // Optimistically update
      queryClient.setQueryData(['task', variables.id], (old) => ({
        ...old,
        ...variables,
      }))

      return { previous }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      queryClient.setQueryData(['task', variables.id], context.previous)
    },
    onSettled: (data, error, variables) => {
      // Refetch to ensure sync
      queryClient.invalidateQueries(['task', variables.id])
      queryClient.invalidateQueries(['tasks'])
    },
  }
)
```

### Dependencies

```json
{
  "dependencies": {
    "@tanstack/react-query": "^5.0.0",
    "@agentforge/dataobject": "workspace:*",
    "zod": "^3.22.0"
  },
  "peerDependencies": {
    "react": "^18.0.0"
  }
}
```

### Example Usage

```typescript
// 1. Define resource (existing dataobject)
// src/services/task-dataobject/index.ts
export const taskResource = defineResource({
  name: 'task',
  schema: z.object({
    id: z.string().uuid(),
    key: z.string(),
    title: z.string(),
    status: z.enum(['todo', 'in-progress', 'done']),
    priority: z.enum(['low', 'medium', 'high', 'critical']),
  }),
  createFields: ['title', 'status', 'priority'],
  updateFields: ['title', 'status', 'priority'],
})

// 2. Generate hooks
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
  optimistic: true,
})

// 3. Use in components
// src/components/TaskBoard.tsx
import { useTasks, useUpdateTask } from '@/services/task-dataobject/hooks'

function TaskBoard() {
  const { data: tasks, isLoading } = useTasks()
  const updateTask = useUpdateTask()

  const handleDragEnd = (taskId: string, newStatus: string) => {
    // Optimistic update - UI changes immediately
    updateTask.mutate({ id: taskId, status: newStatus })
  }

  if (isLoading) return <Spinner />

  return <Board tasks={tasks} onDragEnd={handleDragEnd} />
}

// src/components/TaskDetail.tsx
import { useTask, useUpdateTask } from '@/services/task-dataobject/hooks'

function TaskDetail({ taskId }: { taskId: string }) {
  const { data: task, isLoading } = useTask(taskId)
  const updateTask = useUpdateTask()

  // Task detail and board stay in sync automatically!
  const handlePriorityChange = (priority: string) => {
    updateTask.mutate({ id: taskId, priority })
  }

  if (isLoading) return <Spinner />
  if (!task) return <div>Task not found</div>

  return (
    <div>
      <h2>{task.title}</h2>
      <PrioritySelect value={task.priority} onChange={handlePriorityChange} />
    </div>
  )
}
```

### Benefits

1. **Zero boilerplate** - Define schema once, get hooks everywhere
2. **Type safety** - Full TypeScript inference from Zod schemas
3. **Automatic sync** - All components stay in sync via React Query cache
4. **Optimistic updates** - Instant UI feedback with automatic rollback
5. **Smart caching** - Deduplication, background refetch, stale-while-revalidate
6. **Consistent API** - All dataobjects work the same way
7. **Framework agnostic** - Dataobject stays pure, React layer is separate
8. **Developer experience** - Less code to write, easier to maintain
