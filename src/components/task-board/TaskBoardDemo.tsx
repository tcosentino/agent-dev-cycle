import { TaskBoard } from './TaskBoard'
import { useStoryPlayer, type Story } from '../../hooks'
import type { Task, TaskStatus } from './types'

// =============================================================================
// STORY DEFINITION
// =============================================================================

// Helper to update a task's status
const setStatus = (key: string, status: TaskStatus) =>
  (tasks: Task[]) => tasks.map(t => t.key === key ? { ...t, status } : t)

// The story: tasks moving through the board
const taskBoardStory: Story<Task[]> = {
  initialState: [
    { key: 'BAAP-1', title: 'Product database schema', type: 'backend', priority: 'high', status: 'todo', assignee: 'engineer' },
    { key: 'BAAP-2', title: 'Inventory tracking API', type: 'api', priority: 'high', status: 'todo', assignee: 'engineer' },
    { key: 'BAAP-3', title: 'POS counter interface', type: 'frontend', priority: 'medium', status: 'todo', assignee: 'engineer' },
    { key: 'BAAP-4', title: 'Reorder alert system', type: 'backend', priority: 'medium', status: 'todo', assignee: 'engineer' },
  ],
  steps: [
    { delay: 2000, state: setStatus('BAAP-1', 'in-progress') },
    { delay: 3000, state: setStatus('BAAP-2', 'in-progress') },
    { delay: 4000, state: setStatus('BAAP-1', 'done') },
  ]
}

// =============================================================================
// COMPONENT
// =============================================================================

interface TaskBoardDemoProps {
  autoPlay?: boolean
  loop?: boolean
  loopDelay?: number
  minHeight?: string | number
}

export function TaskBoardDemo({ autoPlay = false, loop = false, loopDelay = 2000, minHeight }: TaskBoardDemoProps) {
  const { state: tasks } = useStoryPlayer(taskBoardStory, { autoPlay, loop, loopDelay })

  return (
    <TaskBoard
      projectName="Bay Area Auto Parts — Inventory System"
      projectKey="BAAP-2026"
      phase="PM Planning"
      tasks={tasks}
      minHeight={minHeight}
    />
  )
}
