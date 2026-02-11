# Task Management Components

A complete set of React components for task management with drag-and-drop functionality, built with @dnd-kit.

## Components

### TaskCard

Display a task card with priority indicators, assignee badges, and drag handle.

```tsx
import { TaskCard } from '@agentforge/ui-components'

<TaskCard
  task={task}
  onClick={handleTaskClick}
  onDelete={handleTaskDelete}
  showDragHandle={true}
/>
```

**Props:**
- `task: Task` - The task object to display
- `onClick?: (task: Task) => void` - Callback when card is clicked
- `onDelete?: (task: Task) => void` - Callback when delete button is clicked
- `showDragHandle?: boolean` - Show drag handle icon (default: false)
- `dragHandleProps?: any` - Props to spread on drag handle (from useDraggable)

### TaskForm

Form component for creating or editing tasks with validation.

```tsx
import { TaskForm } from '@agentforge/ui-components'

<TaskForm
  initialData={task}
  onSubmit={handleSubmit}
  onCancel={handleCancel}
  submitLabel="Save Changes"
  isLoading={isSaving}
/>
```

**Props:**
- `initialData?: Partial<TaskFormData>` - Initial form values
- `onSubmit: (data: TaskFormData) => void` - Form submission callback
- `onCancel: () => void` - Cancel button callback
- `submitLabel?: string` - Label for submit button (default: "Create Task")
- `isLoading?: boolean` - Show loading state (default: false)

### TaskBoard

Kanban-style board with drag-and-drop between status columns.

```tsx
import { TaskBoard } from '@agentforge/ui-components'

<TaskBoard
  tasks={tasks}
  onTaskClick={setSelectedTask}
  onTaskMove={handleTaskMove}
  onTaskDelete={handleTaskDelete}
/>
```

**Props:**
- `tasks: Task[]` - Array of tasks to display
- `onTaskClick?: (task: Task) => void` - Callback when a task is clicked
- `onTaskMove?: (taskId: string, newStatus: TaskStatus) => void` - Callback when task is dragged to new column
- `onTaskDelete?: (task: Task) => void` - Callback for task deletion

**Features:**
- 5 status columns: todo, in-progress, review, done, blocked
- Mouse and keyboard drag-and-drop
- Screen reader announcements
- Touch-friendly on mobile
- Auto-stacks on small screens

### TaskDetailPanel

Slide-in panel showing full task details with inline editing.

```tsx
import { TaskDetailPanel } from '@agentforge/ui-components'

<TaskDetailPanel
  task={selectedTask}
  onClose={() => setSelectedTask(null)}
  onUpdate={handleUpdate}
  onDelete={handleDelete}
  isUpdating={isSaving}
/>
```

**Props:**
- `task: Task | null` - Task to display (null hides panel)
- `onClose: () => void` - Callback when close button is clicked
- `onUpdate?: (taskId: string, updates: Partial<Task>) => void` - Callback for task updates
- `onDelete?: (task: Task) => void` - Callback for task deletion
- `isUpdating?: boolean` - Show loading state for updates

### TaskFilters

Filter and search component with localStorage persistence.

```tsx
import { TaskFilters } from '@agentforge/ui-components'

const [filters, setFilters] = useState<TaskFiltersType>({
  search: '',
  assignees: [],
  priorities: [],
  types: [],
})

<TaskFilters filters={filters} onChange={setFilters} />
```

**Props:**
- `filters: TaskFiltersType` - Current filter state
- `onChange: (filters: TaskFiltersType) => void` - Callback when filters change

**Filter Types:**
- `search: string` - Search by task key, title, or description
- `assignees: string[]` - Filter by assignee (pm, engineer, qa, lead)
- `priorities: TaskPriority[]` - Filter by priority
- `types: TaskType[]` - Filter by type

## Types

```typescript
export type TaskStatus = 'todo' | 'in-progress' | 'review' | 'done' | 'blocked'
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low'
export type TaskType = 'epic' | 'api' | 'backend' | 'frontend' | 'testing' | 'documentation' | 'devops'

export interface Task {
  id: string
  projectId: string
  key: string // Auto-generated (e.g., "AF-5")
  title: string
  description?: string
  type?: TaskType
  priority?: TaskPriority
  status: TaskStatus
  assignee?: string
  createdAt: string
  updatedAt: string
}
```

## Example: Full Integration

```tsx
import { TaskBoard, TaskDetailPanel, TaskForm, TaskFilters, Modal } from '@agentforge/ui-components'

function TasksPage({ projectId }: { projectId: string }) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [filters, setFilters] = useState<TaskFiltersType>({
    search: '',
    assignees: [],
    priorities: [],
    types: [],
  })

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    if (filters.search && !task.key.includes(filters.search) && !task.title.includes(filters.search)) {
      return false
    }
    if (filters.assignees.length > 0 && !filters.assignees.includes(task.assignee || '')) {
      return false
    }
    // ... more filters
    return true
  })

  return (
    <div>
      <TaskFilters filters={filters} onChange={setFilters} />
      
      <TaskBoard
        tasks={filteredTasks}
        onTaskClick={setSelectedTask}
        onTaskMove={(id, status) => updateTask(id, { status })}
        onTaskDelete={deleteTask}
      />

      <TaskDetailPanel
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        onUpdate={updateTask}
        onDelete={deleteTask}
      />

      {showCreateModal && (
        <Modal onClose={() => setShowCreateModal(false)}>
          <TaskForm
            onSubmit={createTask}
            onCancel={() => setShowCreateModal(false)}
          />
        </Modal>
      )}
    </div>
  )
}
```

## Accessibility

All components follow WCAG 2.1 Level AA standards:

- ✅ Keyboard navigation (Tab, Enter, Space, Arrow keys)
- ✅ Screen reader announcements for drag events
- ✅ Focus management for modals
- ✅ Sufficient color contrast (4.5:1+)
- ✅ ARIA labels on interactive elements

## Responsive Design

- Desktop (>768px): Horizontal scrolling board
- Tablet (768px): Optimized column widths
- Mobile (<768px): Vertical stacked columns, touch-friendly dragging
