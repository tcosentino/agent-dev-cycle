import { StrictMode, useState, useCallback, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import { TaskBoard, type Task, type TaskStatus } from './components/task-board'
import { ChatDemo } from './components/chat'
import { AgentWorkspaceDemo } from './components/agent-workspace'
import { Nav } from './components/nav'
import './components/shared/tokens.css'
import './component-preview.css'

const initialTasks: Task[] = [
  {
    key: 'BAAP-1',
    title: 'Product database schema',
    type: 'backend',
    priority: 'high',
    status: 'todo',
    assignee: 'engineer'
  },
  {
    key: 'BAAP-2',
    title: 'Inventory tracking API',
    type: 'api',
    priority: 'high',
    status: 'todo',
    assignee: 'engineer'
  },
  {
    key: 'BAAP-3',
    title: 'POS counter interface',
    type: 'frontend',
    priority: 'medium',
    status: 'todo',
    assignee: 'engineer'
  },
  {
    key: 'BAAP-4',
    title: 'Reorder alert system',
    type: 'backend',
    priority: 'medium',
    status: 'todo',
    assignee: 'engineer'
  }
]

function ComponentPreview() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [isAnimating, setIsAnimating] = useState(false)
  const animationRef = useRef<number[]>([])

  // Update a single task's status
  const updateTaskStatus = useCallback((taskKey: string, newStatus: TaskStatus) => {
    setTasks(prev => prev.map(task =>
      task.key === taskKey ? { ...task, status: newStatus } : task
    ))
  }, [])

  // Reset all tasks to todo
  const resetTasks = useCallback(() => {
    // Clear any pending animations
    animationRef.current.forEach(id => clearTimeout(id))
    animationRef.current = []
    setIsAnimating(false)
    setTasks(initialTasks)
  }, [])

  // Run the full animation sequence
  const runAnimation = useCallback(() => {
    // Clear any existing animations
    animationRef.current.forEach(id => clearTimeout(id))
    animationRef.current = []

    // Reset first
    setTasks(initialTasks)
    setIsAnimating(true)

    // Animation sequence matching the demo page story:
    // - BAAP-1 moves to In Progress, then to Done
    // - BAAP-2 moves to In Progress (stays there)
    // - BAAP-3 and BAAP-4 remain in To Do
    const sequence: Array<{ delay: number; taskKey: string; status: TaskStatus }> = [
      // First task starts work
      { delay: 2000, taskKey: 'BAAP-1', status: 'in-progress' },
      // Second task starts work
      { delay: 3000, taskKey: 'BAAP-2', status: 'in-progress' },
      // First task completes
      { delay: 4000, taskKey: 'BAAP-1', status: 'done' },
    ]

    sequence.forEach(({ delay, taskKey, status }) => {
      const id = window.setTimeout(() => {
        updateTaskStatus(taskKey, status)
      }, delay)
      animationRef.current.push(id)
    })

    // Mark animation as complete
    const completeId = window.setTimeout(() => {
      setIsAnimating(false)
    }, 5000)
    animationRef.current.push(completeId)
  }, [updateTaskStatus])

  return (
    <>
      <Nav currentPage="components" />
      <div className="preview-container">
        <header className="preview-header">
          <h1>Component Preview</h1>
          <p>AgentForge UI Components</p>
        </header>

      <section className="preview-section">
        <div className="section-header">
          <h2>TaskBoard</h2>
          <div className="button-group">
            <button
              onClick={runAnimation}
              className="animate-btn"
              disabled={isAnimating}
            >
              {isAnimating ? 'Animating...' : 'Run Animation'}
            </button>
            <button onClick={resetTasks} className="animate-btn secondary">
              Reset
            </button>
          </div>
        </div>
        <div className="demo-wrapper">
          <TaskBoard
            projectName="Bay Area Auto Parts — Inventory System"
            projectKey="BAAP-2026"
            phase="PM Planning"
            tasks={tasks}
            minHeight={340}
          />
        </div>
      </section>

      <section className="preview-section">
        <div className="section-header">
          <h2>Chat</h2>
        </div>
        <div className="demo-wrapper">
          <ChatDemo autoPlay loop loopDelay={3000} />
        </div>
      </section>

      <section className="preview-section-full">
        <div className="section-header">
          <h2>Agent Workspace</h2>
          <p className="section-description">Combined chat and task board with synchronized state</p>
        </div>
        <div className="demo-wrapper">
          <AgentWorkspaceDemo autoPlay loop loopDelay={4000} />
        </div>
      </section>
      </div>
    </>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ComponentPreview />
  </StrictMode>
)
