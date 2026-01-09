import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { TaskBoard, type Task } from './components/task-board'
import './components/shared/tokens.css'
import './component-preview.css'

const sampleTasks: Task[] = [
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
  const [animate, setAnimate] = useState(false)

  const triggerAnimation = () => {
    setAnimate(false)
    setTimeout(() => setAnimate(true), 50)
  }

  return (
    <div className="preview-container">
      <header className="preview-header">
        <h1>Component Preview</h1>
        <p>AgentForge UI Components</p>
      </header>

      <section className="preview-section">
        <div className="section-header">
          <h2>TaskBoard</h2>
          <button onClick={triggerAnimation} className="animate-btn">
            Trigger Animation
          </button>
        </div>
        <div className="demo-wrapper">
          <TaskBoard
            projectName="Bay Area Auto Parts — Inventory System"
            projectKey="BAAP-2026"
            phase="PM Planning"
            tasks={sampleTasks}
            animate={animate}
          />
        </div>
      </section>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ComponentPreview />
  </StrictMode>
)
