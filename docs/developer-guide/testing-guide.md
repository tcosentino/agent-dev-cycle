# Testing Guide

How to write effective tests for AgentForge and ensure code quality.

## Overview

AgentForge uses **Vitest** for testing. We write:
- **Unit tests** - Test individual functions/components
- **Integration tests** - Test service interactions
- **E2E tests** - Test complete user flows (planned)

## Test Philosophy

### Test What Matters

✅ **Do test:**
- Public APIs and exports
- Component behavior and rendering
- Business logic
- Error handling
- Edge cases

❌ **Don't test:**
- Implementation details
- Third-party libraries
- Trivial getters/setters
- Framework internals

### Test Structure

Every test should answer:
1. **What** are we testing?
2. **When** (under what conditions)?
3. **Then** (what should happen)?

Use the **Arrange-Act-Assert** pattern:

```typescript
it('should create task with auto-generated ID', () => {
  // Arrange - Set up test data
  const title = 'New Task'
  const projectId = 'proj-123'
  
  // Act - Execute the code under test
  const task = createTask(title, projectId)
  
  // Assert - Verify the result
  expect(task.id).toBeDefined()
  expect(task.title).toBe(title)
  expect(task.projectId).toBe(projectId)
})
```

## Running Tests

### Basic Commands

```bash
# Run all tests
yarn test

# Run in watch mode (re-runs on file change)
yarn test --watch

# Run specific test file
yarn test TaskCard

# Run tests matching pattern
yarn test "task*"

# Run with coverage
yarn test --coverage

# Run tests for specific package
cd packages/dataobject
yarn test
```

### Watch Mode Tips

Watch mode re-runs affected tests when you save files:

```bash
yarn test --watch
```

**Commands in watch mode:**
- `a` - Run all tests
- `f` - Run only failed tests
- `p` - Filter by file name pattern
- `t` - Filter by test name pattern
- `q` - Quit
- `Enter` - Re-run all tests

## Writing Unit Tests

### Testing Functions

**Example: Pure function**

```typescript
// src/utils/formatting.ts
export function formatTaskKey(prefix: string, number: number): string {
  return `${prefix}-${number}`
}

// src/utils/formatting.test.ts
import { describe, it, expect } from 'vitest'
import { formatTaskKey } from './formatting'

describe('formatTaskKey', () => {
  it('should format key with prefix and number', () => {
    const result = formatTaskKey('TODO', 5)
    expect(result).toBe('TODO-5')
  })
  
  it('should handle single digit numbers', () => {
    expect(formatTaskKey('TODO', 1)).toBe('TODO-1')
  })
  
  it('should handle large numbers', () => {
    expect(formatTaskKey('TODO', 9999)).toBe('TODO-9999')
  })
})
```

### Testing Components

**Example: React component**

```typescript
// TaskCard.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TaskCard } from './TaskCard'

describe('TaskCard', () => {
  it('should render task title', () => {
    const task = {
      id: '1',
      title: 'Fix bug',
      status: 'todo',
      priority: 'high'
    }
    
    render(<TaskCard task={task} />)
    
    expect(screen.getByText('Fix bug')).toBeInTheDocument()
  })
  
  it('should show high priority indicator', () => {
    const task = {
      id: '1',
      title: 'Urgent task',
      status: 'todo',
      priority: 'high'
    }
    
    render(<TaskCard task={task} />)
    
    const indicator = screen.getByTestId('priority-indicator')
    expect(indicator).toHaveClass('priority-high')
  })
})
```

### Testing User Interactions

Use `@testing-library/user-event` for realistic user interactions:

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TaskForm } from './TaskForm'

describe('TaskForm', () => {
  it('should call onSubmit when form is submitted', async () => {
    const handleSubmit = vi.fn()
    const user = userEvent.setup()
    
    render(<TaskForm onSubmit={handleSubmit} />)
    
    // Type in the title field
    await user.type(screen.getByLabelText('Title'), 'New task')
    
    // Select priority
    await user.selectOptions(screen.getByLabelText('Priority'), 'high')
    
    // Submit form
    await user.click(screen.getByRole('button', { name: 'Create' }))
    
    // Verify callback was called
    expect(handleSubmit).toHaveBeenCalledWith({
      title: 'New task',
      priority: 'high'
    })
  })
})
```

### Testing Async Code

```typescript
import { describe, it, expect } from 'vitest'

describe('fetchTasks', () => {
  it('should fetch tasks from API', async () => {
    const tasks = await fetchTasks('proj-123')
    
    expect(tasks).toHaveLength(3)
    expect(tasks[0]).toHaveProperty('title')
  })
  
  it('should handle errors', async () => {
    await expect(fetchTasks('invalid-id')).rejects.toThrow('Not found')
  })
})
```

## Mocking

### Mocking Functions

```typescript
import { describe, it, expect, vi } from 'vitest'

describe('createTask', () => {
  it('should call API with correct data', async () => {
    const mockApi = {
      post: vi.fn().mockResolvedValue({ id: 'task-1' })
    }
    
    await createTask('New task', 'proj-1', mockApi)
    
    expect(mockApi.post).toHaveBeenCalledWith('/tasks', {
      title: 'New task',
      projectId: 'proj-1'
    })
  })
})
```

### Mocking Modules

```typescript
import { describe, it, expect, vi } from 'vitest'
import { createTask } from './tasks'

// Mock the entire API module
vi.mock('./api', () => ({
  api: {
    tasks: {
      create: vi.fn().mockResolvedValue({ id: 'task-1' })
    }
  }
}))

describe('createTask', () => {
  it('should create task via API', async () => {
    const task = await createTask('Test task')
    expect(task.id).toBe('task-1')
  })
})
```

### Mocking React Hooks

```typescript
import { vi } from 'vitest'
import { useTasks } from './hooks'

vi.mock('./hooks', () => ({
  useTasks: vi.fn()
}))

// In test:
(useTasks as any).mockReturnValue({
  tasks: [{ id: '1', title: 'Task 1' }],
  isLoading: false
})
```

## Test-Spec Linkage

AgentForge uses a custom `describeSpec` wrapper to link tests to OpenSpec scenarios.

### Why Use describeSpec?

- **Traceability** - Link code → tests → specs → requirements
- **Coverage tracking** - Know which scenarios have tests
- **Documentation** - Tests become executable specs
- **AI-friendly** - Agents can understand what to test

### Basic Usage

```typescript
import { describeSpec } from '@agentforge/testing-framework'

describeSpec({
  spec: 'openspec/specs/task-management-ui/specs/task-crud/spec.md',
  scenario: 'task-crud-001',
  requirement: 'Create new task',
  title: 'User creates task with minimal fields'
}, () => {
  it('should show form when clicking New Task', async () => {
    // WHEN user clicks "New Task" button
    const user = userEvent.setup()
    render(<TasksPage projectId="test-proj" />)
    
    await user.click(screen.getByRole('button', { name: /new task/i }))
    
    // THEN task creation form appears
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
  
  it('should create task with auto-generated key', async () => {
    // WHEN user enters title and clicks Create
    // ... test implementation
    
    // THEN task is created with auto-generated key
    expect(screen.getByText(/AF-\d+/)).toBeInTheDocument()
  })
})
```

### Multiple Scenarios

One test file can cover multiple scenarios:

```typescript
describeSpec({
  spec: 'openspec/specs/task-management-ui/specs/task-crud/spec.md',
  scenario: 'task-crud-001',
  requirement: 'Create new task',
  title: 'User creates task with minimal fields'
}, () => {
  // Tests for scenario 001
})

describeSpec({
  spec: 'openspec/specs/task-management-ui/specs/task-crud/spec.md',
  scenario: 'task-crud-002',
  requirement: 'Create new task',
  title: 'User creates task with all fields'
}, () => {
  // Tests for scenario 002
})
```

### Generating Coverage

Generate test-spec coverage report:

```bash
yarn coverage:spec
```

This creates `coverage.json` files showing which scenarios are tested.

## Integration Tests

Integration tests verify that services work together correctly.

### Testing API Endpoints

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createServer } from '../server'

describe('Tasks API', () => {
  let server: any
  
  beforeAll(async () => {
    server = await createServer({ port: 0, db: ':memory:' })
  })
  
  afterAll(async () => {
    await server.close()
  })
  
  it('should create task', async () => {
    const response = await fetch(`${server.url}/api/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Test task',
        projectId: 'proj-1'
      })
    })
    
    expect(response.status).toBe(201)
    const task = await response.json()
    expect(task.id).toBeDefined()
    expect(task.title).toBe('Test task')
  })
})
```

### Testing Database Operations

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { Database } from 'better-sqlite3'
import { taskResource } from './index'

describe('Task Dataobject', () => {
  let db: Database
  
  beforeEach(() => {
    db = new Database(':memory:')
    // Run migrations
    // ...
  })
  
  it('should create task in database', async () => {
    const task = await taskResource.create({
      title: 'Test task',
      projectId: 'proj-1'
    })
    
    const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(task.id)
    expect(row).toBeDefined()
    expect(row.title).toBe('Test task')
  })
})
```

## Test Organization

### File Naming

Co-locate tests with code:

```
src/
  utils/
    formatting.ts
    formatting.test.ts       # ✅ Co-located
  components/
    TaskCard/
      TaskCard.tsx
      TaskCard.test.tsx      # ✅ Co-located
      TaskCard.module.css
```

### Test Structure

```typescript
describe('MyComponent', () => {
  // Group related tests
  describe('rendering', () => {
    it('should render title', () => { /* ... */ })
    it('should render description', () => { /* ... */ })
  })
  
  describe('interactions', () => {
    it('should call onClick when clicked', () => { /* ... */ })
    it('should update on input change', () => { /* ... */ })
  })
  
  describe('edge cases', () => {
    it('should handle empty data', () => { /* ... */ })
    it('should handle errors', () => { /* ... */ })
  })
})
```

## Test Coverage

### Coverage Goals

- **Overall:** 80%+
- **Critical paths:** 100% (authentication, data integrity, security)
- **New code:** All new features must include tests

### Viewing Coverage

```bash
# Generate coverage report
yarn test --coverage

# View HTML report
open coverage/index.html
```

### Coverage Reports

The coverage report shows:
- **Statements** - % of code lines executed
- **Branches** - % of if/else branches covered
- **Functions** - % of functions called
- **Lines** - % of lines covered

Aim for green (80%+) on all metrics.

## Best Practices

### 1. Test Behavior, Not Implementation

✅ **Good** - Tests behavior:
```typescript
it('should filter tasks by status', () => {
  const tasks = filterTasks(allTasks, 'done')
  expect(tasks.every(t => t.status === 'done')).toBe(true)
})
```

❌ **Bad** - Tests implementation:
```typescript
it('should call Array.filter with predicate', () => {
  const spy = vi.spyOn(Array.prototype, 'filter')
  filterTasks(allTasks, 'done')
  expect(spy).toHaveBeenCalled()
})
```

### 2. Use Descriptive Test Names

✅ **Good:**
```typescript
it('should show error message when title is empty', () => {})
```

❌ **Bad:**
```typescript
it('validates', () => {})
```

### 3. Avoid Test Interdependence

Each test should run independently:

```typescript
// ✅ Good - Each test sets up its own data
it('test 1', () => {
  const user = createUser()
  expect(user.name).toBe('Alice')
})

it('test 2', () => {
  const user = createUser()
  expect(user.email).toBeDefined()
})

// ❌ Bad - Tests depend on shared state
let user: User

beforeAll(() => {
  user = createUser()  // Shared state!
})

it('test 1', () => {
  user.name = 'Bob'  // Mutates shared state
})

it('test 2', () => {
  expect(user.name).toBe('Alice')  // Fails! Depends on test 1 not running
})
```

### 4. Keep Tests Fast

- Mock slow operations (network, file I/O)
- Use in-memory databases
- Avoid unnecessary delays
- Parallelize when possible

### 5. Test Error Cases

Don't just test the happy path:

```typescript
describe('createTask', () => {
  it('should create task with valid data', async () => {
    // Happy path
  })
  
  it('should throw error when title is missing', async () => {
    await expect(createTask('', 'proj-1')).rejects.toThrow('Title required')
  })
  
  it('should throw error when project does not exist', async () => {
    await expect(createTask('Task', 'invalid')).rejects.toThrow('Not found')
  })
})
```

## Common Patterns

### Setup and Teardown

```typescript
import { describe, it, beforeEach, afterEach } from 'vitest'

describe('TaskManager', () => {
  let manager: TaskManager
  
  beforeEach(() => {
    // Run before each test
    manager = new TaskManager()
  })
  
  afterEach(() => {
    // Clean up after each test
    manager.cleanup()
  })
  
  it('test 1', () => { /* ... */ })
  it('test 2', () => { /* ... */ })
})
```

### Shared Test Data

```typescript
const mockTask = {
  id: 'task-1',
  title: 'Test task',
  status: 'todo',
  priority: 'high'
}

describe('TaskCard', () => {
  it('test 1', () => {
    render(<TaskCard task={mockTask} />)
    // ...
  })
  
  it('test 2', () => {
    render(<TaskCard task={{ ...mockTask, status: 'done' }} />)
    // ...
  })
})
```

### Testing Hooks

```typescript
import { renderHook } from '@testing-library/react'
import { useTasks } from './hooks'

it('should fetch tasks on mount', async () => {
  const { result } = renderHook(() => useTasks('proj-1'))
  
  expect(result.current.isLoading).toBe(true)
  
  await waitFor(() => {
    expect(result.current.isLoading).toBe(false)
  })
  
  expect(result.current.tasks).toHaveLength(3)
})
```

## Debugging Tests

### Running Single Test

```bash
# Run specific test file
yarn test TaskCard.test.tsx

# Run specific test by name
yarn test -t "should render title"
```

### Using Console Logs

```typescript
it('should do something', () => {
  console.log('Debug:', myVariable)
  expect(myVariable).toBe('expected')
})
```

### Using Debugger

```typescript
it('should do something', () => {
  debugger  // Pauses execution here
  expect(something).toBe(true)
})
```

Run with Node debugger:
```bash
node --inspect-brk node_modules/vitest/vitest.mjs run TaskCard.test.tsx
```

## CI/CD Testing

Tests run automatically in GitHub Actions on every PR.

**Checks:**
- All tests pass
- Coverage meets threshold (80%)
- Build succeeds

## Further Reading

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)

## Getting Help

- Check [troubleshooting](#troubleshooting) section
- [Report issues](https://github.com/tcosentino/agent-dev-cycle/issues)
