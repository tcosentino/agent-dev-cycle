import { TaskBoard } from '../task-board/TaskBoard'
import { Chat } from '../chat/Chat'
import { useStoryPlayer, type Story } from '../../hooks'
import type { Task, TaskStatus } from '../task-board/types'
import type { ChatMessage, ChatState } from '../chat/types'
import type { WorkspaceState } from './types'
import styles from './AgentWorkspace.module.css'

// Helper to generate unique message IDs
let msgCounter = 0
const nextMsgId = () => `msg-${++msgCounter}`

// Helper to add a message
const addMessage = (message: Omit<ChatMessage, 'id' | 'timestamp'>) =>
  (state: WorkspaceState): WorkspaceState => ({
    ...state,
    messages: [...state.messages, {
      ...message,
      id: nextMsgId(),
      timestamp: Date.now()
    }]
  })

// Combined helper: add message and task together
const addMessageAndTask = (
  message: Omit<ChatMessage, 'id' | 'timestamp'>,
  task: Task
) => (state: WorkspaceState): WorkspaceState => ({
  ...state,
  messages: [...state.messages, {
    ...message,
    id: nextMsgId(),
    timestamp: Date.now()
  }],
  tasks: [...state.tasks, task]
})

// Combined helper: add message and update task status
const addMessageAndUpdateTask = (
  message: Omit<ChatMessage, 'id' | 'timestamp'>,
  taskKey: string,
  status: TaskStatus
) => (state: WorkspaceState): WorkspaceState => ({
  ...state,
  messages: [...state.messages, {
    ...message,
    id: nextMsgId(),
    timestamp: Date.now()
  }],
  tasks: state.tasks.map(t => t.key === taskKey ? { ...t, status } : t)
})

// The story: PM analyzes requirements, creates tasks, engineers work on them
const workspaceStory: Story<WorkspaceState> = {
  initialState: {
    tasks: [],
    messages: []
  },
  steps: [
    // PM starts analyzing
    {
      delay: 1000,
      state: addMessage({
        type: 'agent',
        sender: 'pm',
        content: 'New project: Bay Area Auto Parts needs an inventory management system. Analyzing customer requirements...'
      })
    },
    // PM identifies core problem
    {
      delay: 3000,
      state: addMessage({
        type: 'agent',
        sender: 'pm',
        content: 'Core problem identified: Manual inventory tracking causing stockouts and lost sales. Customer has 3 retail locations.',
        action: { label: 'Analyzed requirements', status: 'success' }
      })
    },
    // PM creates first task
    {
      delay: 5000,
      state: addMessageAndTask(
        {
          type: 'agent',
          sender: 'pm',
          content: 'Creating first task: We need a product database schema to store inventory data.',
          taskRef: 'BAAP-1',
          action: { label: 'Created BAAP-1', status: 'success' }
        },
        { key: 'BAAP-1', title: 'Product database schema', type: 'backend', priority: 'high', status: 'todo', assignee: 'engineer' }
      )
    },
    // PM creates second task
    {
      delay: 7000,
      state: addMessageAndTask(
        {
          type: 'agent',
          sender: 'pm',
          content: 'Next up: API endpoints for inventory operations.',
          taskRef: 'BAAP-2',
          action: { label: 'Created BAAP-2', status: 'success' }
        },
        { key: 'BAAP-2', title: 'Inventory tracking API', type: 'api', priority: 'high', status: 'todo', assignee: 'engineer' }
      )
    },
    // Engineer starts on BAAP-1
    {
      delay: 9000,
      state: addMessageAndUpdateTask(
        {
          type: 'agent',
          sender: 'engineer',
          content: 'Taking BAAP-1. Setting up PostgreSQL schema with proper indexing for product lookups.',
          taskRef: 'BAAP-1'
        },
        'BAAP-1',
        'in-progress'
      )
    },
    // PM creates third task
    {
      delay: 11000,
      state: addMessageAndTask(
        {
          type: 'agent',
          sender: 'pm',
          content: 'Adding the POS interface task for the counter staff.',
          taskRef: 'BAAP-3',
          action: { label: 'Created BAAP-3', status: 'success' }
        },
        { key: 'BAAP-3', title: 'POS counter interface', type: 'frontend', priority: 'medium', status: 'todo', assignee: 'engineer' }
      )
    },
    // Engineer completes BAAP-1
    {
      delay: 13000,
      state: addMessageAndUpdateTask(
        {
          type: 'agent',
          sender: 'engineer',
          content: 'Database schema complete. Tables: products, inventory_levels, warehouses, stock_movements.',
          taskRef: 'BAAP-1',
          action: { label: 'Completed BAAP-1', status: 'success' }
        },
        'BAAP-1',
        'done'
      )
    },
    // Engineer starts BAAP-2
    {
      delay: 15000,
      state: addMessageAndUpdateTask(
        {
          type: 'agent',
          sender: 'engineer',
          content: 'Moving to BAAP-2. Building REST endpoints with Express and TypeScript.',
          taskRef: 'BAAP-2'
        },
        'BAAP-2',
        'in-progress'
      )
    },
    // PM creates fourth task
    {
      delay: 17000,
      state: addMessageAndTask(
        {
          type: 'agent',
          sender: 'pm',
          content: 'Final task for MVP: automated reorder alerts when stock is low.',
          taskRef: 'BAAP-4',
          action: { label: 'Created BAAP-4', status: 'success' }
        },
        { key: 'BAAP-4', title: 'Reorder alert system', type: 'backend', priority: 'medium', status: 'todo', assignee: 'engineer' }
      )
    },
    // Engineer completes BAAP-2
    {
      delay: 19000,
      state: addMessageAndUpdateTask(
        {
          type: 'agent',
          sender: 'engineer',
          content: 'API complete. Endpoints: GET/POST/PUT/DELETE for products, inventory levels, and stock transfers.',
          taskRef: 'BAAP-2',
          action: { label: 'Completed BAAP-2', status: 'success' }
        },
        'BAAP-2',
        'done'
      )
    }
  ]
}

interface AgentWorkspaceDemoProps {
  autoPlay?: boolean
  loop?: boolean
  loopDelay?: number
}

export function AgentWorkspaceDemo({ autoPlay = false, loop = false, loopDelay = 3000 }: AgentWorkspaceDemoProps) {
  const { state } = useStoryPlayer(workspaceStory, { autoPlay, loop, loopDelay })

  // Convert messages to ChatState format (single channel view)
  const chatState: ChatState = {
    channels: [
      { id: 'project', name: 'project-baap-inventory', messages: state.messages }
    ],
    activeChannelId: 'project'
  }

  return (
    <div className={styles.container}>
      <div className={styles.chatPanel}>
        <Chat state={chatState} hideSidebar />
      </div>
      <div className={styles.boardPanel}>
        <TaskBoard
          projectName="Bay Area Auto Parts — Inventory System"
          projectKey="BAAP-2026"
          phase="Sprint 1"
          tasks={state.tasks}
        />
      </div>
    </div>
  )
}
