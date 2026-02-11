import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describeSpec } from '@agentforge/testing-framework'
import { TasksPage } from './TasksPage'
import * as taskHooks from '../../../task-dataobject/hooks'

// Mock the task hooks
vi.mock('../../../task-dataobject/hooks', () => ({
  useTasks: vi.fn(),
  useCreateTask: vi.fn(),
  useUpdateTask: vi.fn(),
  useDeleteTask: vi.fn(),
}))

// Mock UI components to simplify testing
vi.mock('@agentforge/ui-components', () => ({
  TaskBoard: ({ tasks, onTaskMove, onTaskClick }: any) => (
    <div data-testid="task-board">
      {tasks.map((task: any) => (
        <div
          key={task.id}
          data-testid={`task-${task.id}`}
          data-status={task.status}
          onClick={() => onTaskClick(task)}
        >
          {task.title} - {task.status}
          <button
            data-testid={`move-${task.id}`}
            onClick={(e) => {
              e.stopPropagation()
              onTaskMove(task.id, 'done')
            }}
          >
            Move to Done
          </button>
        </div>
      ))}
    </div>
  ),
  TaskDetailPanel: ({ task, isUpdating }: any) => {
    if (!task) return null
    return (
      <div data-testid="task-detail-panel">
        <div data-testid="detail-status">{task.status}</div>
        <div data-testid="detail-title">{task.title}</div>
        {isUpdating && <div data-testid="updating-indicator">Updating...</div>}
      </div>
    )
  },
  TaskFilters: () => <div data-testid="task-filters">Filters</div>,
  TaskForm: () => <div data-testid="task-form">Form</div>,
  Modal: ({ children }: any) => <div data-testid="modal">{children}</div>,
  Spinner: () => <div data-testid="spinner">Loading...</div>,
}))

describe('TasksPage - React Query Synchronization', () => {
  let queryClient: QueryClient
  const mockProjectId = 'test-project-123'

  const mockTasks = [
    {
      id: 'task-1',
      projectId: mockProjectId,
      key: 'AETA-9',
      title: 'etatfsdf',
      status: 'in-progress',
      priority: 'medium',
      type: 'backend',
    },
    {
      id: 'task-2',
      projectId: mockProjectId,
      key: 'AETA-10',
      title: 'Another task',
      status: 'todo',
      priority: 'high',
      type: 'frontend',
    },
  ]

  beforeEach(() => {
    // Create a fresh QueryClient for each test
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
        mutations: {
          retry: false,
        },
      },
    })

    // Reset all mocks
    vi.clearAllMocks()
  })

  describeSpec(
    {
      spec: 'openspec/changes/task-management-ui/specs/task-board/spec.md',
      scenario: 'task-board-001',
      requirement: 'Kanban board layout',
      title: 'Board displays status columns',
      priority: 'critical',
    },
    () => {
      it('should show task board and detail panel with same status initially', async () => {
        // Mock useTasks to return initial tasks
        vi.mocked(taskHooks.useTasks).mockReturnValue({
          data: mockTasks,
          isLoading: false,
          error: null,
          isError: false,
          refetch: vi.fn(),
        } as any)

        vi.mocked(taskHooks.useUpdateTask).mockReturnValue({
          mutateAsync: vi.fn(),
          isPending: false,
        } as any)

        vi.mocked(taskHooks.useCreateTask).mockReturnValue({
          mutateAsync: vi.fn(),
          isPending: false,
        } as any)

        vi.mocked(taskHooks.useDeleteTask).mockReturnValue({
          mutateAsync: vi.fn(),
        } as any)

        const { container } = render(
          <QueryClientProvider client={queryClient}>
            <TasksPage projectId={mockProjectId} />
          </QueryClientProvider>
        )

        // Verify tasks are displayed on the board
        expect(screen.getByTestId('task-task-1')).toHaveAttribute('data-status', 'in-progress')
        expect(screen.getByText('etatfsdf - in-progress')).toBeInTheDocument()

        // Click on the task to open detail panel
        const user = userEvent.setup()
        await user.click(screen.getByTestId('task-task-1'))

        // Verify detail panel shows the same status
        await waitFor(() => {
          expect(screen.getByTestId('task-detail-panel')).toBeInTheDocument()
        })

        expect(screen.getByTestId('detail-status')).toHaveTextContent('in-progress')
        expect(screen.getByTestId('detail-title')).toHaveTextContent('etatfsdf')
      })
    }
  )

  describeSpec(
    {
      spec: 'openspec/changes/task-management-ui/specs/task-crud/spec.md',
      scenario: 'task-crud-022',
      requirement: 'Centralized state management and automatic UI updates',
      title: 'Task update propagates to all views',
      priority: 'critical',
    },
    () => {
      it('BUG FIX: dragging task should update detail panel status via derived state', async () => {
        // This test verifies the fix: selectedTask is derived from React Query cache
        // instead of being stored in local state

        // Mock useUpdateTask to simulate cache update
        const mockMutateAsync = vi.fn(async ({ id, status }: any) => {
          const updatedTask = { ...mockTasks.find((t) => t.id === id)!, status }
          return updatedTask
        })

        // Start with initial tasks
        const usTasksMock = vi.mocked(taskHooks.useTasks)
        usTasksMock.mockReturnValue({
          data: mockTasks,
          isLoading: false,
          error: null,
          isError: false,
          refetch: vi.fn(),
        } as any)

        vi.mocked(taskHooks.useUpdateTask).mockReturnValue({
          mutateAsync: mockMutateAsync,
          isPending: false,
        } as any)

        vi.mocked(taskHooks.useCreateTask).mockReturnValue({
          mutateAsync: vi.fn(),
          isPending: false,
        } as any)

        vi.mocked(taskHooks.useDeleteTask).mockReturnValue({
          mutateAsync: vi.fn(),
        } as any)

        const { rerender } = render(
          <QueryClientProvider client={queryClient}>
            <TasksPage projectId={mockProjectId} />
          </QueryClientProvider>
        )

        // Open the task detail panel
        const user = userEvent.setup()
        await user.click(screen.getByTestId('task-task-1'))

        await waitFor(() => {
          expect(screen.getByTestId('task-detail-panel')).toBeInTheDocument()
        })

        // Verify initial status in both board and detail panel
        expect(screen.getByTestId('task-task-1')).toHaveAttribute('data-status', 'in-progress')
        expect(screen.getByTestId('detail-status')).toHaveTextContent('in-progress')

        // Simulate React Query cache update after task is moved
        const updatedTasks = mockTasks.map((t) =>
          t.id === 'task-1' ? { ...t, status: 'done' as any } : t
        )

        usTasksMock.mockReturnValue({
          data: updatedTasks,
          isLoading: false,
          error: null,
          isError: false,
          refetch: vi.fn(),
        } as any)

        // Drag task to "done" status (simulate by clicking the move button)
        await user.click(screen.getByTestId('move-task-1'))

        // Wait for the mutation to complete
        await waitFor(() => {
          expect(mockMutateAsync).toHaveBeenCalledWith({
            id: 'task-1',
            status: 'done',
          })
        })

        // Force re-render to simulate React Query refetch
        rerender(
          <QueryClientProvider client={queryClient}>
            <TasksPage projectId={mockProjectId} />
          </QueryClientProvider>
        )

        // THE FIX: The detail panel status should now update to 'done'
        // because selectedTask is derived from the tasks array
        await waitFor(() => {
          expect(screen.getByTestId('detail-status')).toHaveTextContent('done')
        })

        // The board should also show the updated status
        expect(screen.getByTestId('task-task-1')).toHaveAttribute('data-status', 'done')
      })
    }
  )

  describeSpec(
    {
      spec: 'openspec/changes/task-management-ui/specs/task-board/spec.md',
      scenario: 'task-board-014',
      requirement: 'Board interactions',
      title: 'Click card to open detail view',
      priority: 'high',
    },
    () => {
      it('should show loading state while updating task', async () => {
        vi.mocked(taskHooks.useTasks).mockReturnValue({
          data: mockTasks,
          isLoading: false,
          error: null,
          isError: false,
          refetch: vi.fn(),
        } as any)

        // Mock isPending as true to show updating state
        vi.mocked(taskHooks.useUpdateTask).mockReturnValue({
          mutateAsync: vi.fn(),
          isPending: true,
        } as any)

        vi.mocked(taskHooks.useCreateTask).mockReturnValue({
          mutateAsync: vi.fn(),
          isPending: false,
        } as any)

        vi.mocked(taskHooks.useDeleteTask).mockReturnValue({
          mutateAsync: vi.fn(),
        } as any)

        render(
          <QueryClientProvider client={queryClient}>
            <TasksPage projectId={mockProjectId} />
          </QueryClientProvider>
        )

        // Open task detail
        const user = userEvent.setup()
        await user.click(screen.getByTestId('task-task-1'))

        await waitFor(() => {
          expect(screen.getByTestId('task-detail-panel')).toBeInTheDocument()
        })

        // Should show updating indicator when isPending is true
        expect(screen.getByTestId('updating-indicator')).toBeInTheDocument()
      })
    }
  )

  describeSpec(
    {
      spec: 'openspec/changes/task-management-ui/specs/task-crud/spec.md',
      scenario: 'task-crud-021',
      requirement: 'Task form validation',
      title: 'API error handling',
      priority: 'high',
    },
    () => {
      it('should handle update errors gracefully', async () => {
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
        const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})

        vi.mocked(taskHooks.useTasks).mockReturnValue({
          data: mockTasks,
          isLoading: false,
          error: null,
          isError: false,
          refetch: vi.fn(),
        } as any)

        const mockMutateAsync = vi.fn().mockRejectedValue(new Error('Network error'))

        vi.mocked(taskHooks.useUpdateTask).mockReturnValue({
          mutateAsync: mockMutateAsync,
          isPending: false,
        } as any)

        vi.mocked(taskHooks.useCreateTask).mockReturnValue({
          mutateAsync: vi.fn(),
          isPending: false,
        } as any)

        vi.mocked(taskHooks.useDeleteTask).mockReturnValue({
          mutateAsync: vi.fn(),
        } as any)

        render(
          <QueryClientProvider client={queryClient}>
            <TasksPage projectId={mockProjectId} />
          </QueryClientProvider>
        )

        // Try to move task
        const user = userEvent.setup()
        await user.click(screen.getByTestId('move-task-1'))

        await waitFor(() => {
          expect(alertSpy).toHaveBeenCalledWith('Failed to update task status. Please try again.')
        })

        consoleError.mockRestore()
        alertSpy.mockRestore()
      })
    }
  )
})
