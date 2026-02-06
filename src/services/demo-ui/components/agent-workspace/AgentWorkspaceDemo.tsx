import { useEffect, useRef } from 'react'
import { TaskBoard } from '../task-board/TaskBoard'
import { resetTaskAnimationCache } from '../task-board'
import { Chat } from '../chat/Chat'
import { useStoryPlayer, type Story } from '../../hooks'
import type { Task, TaskStatus, AgentRole } from '../task-board/types'
import type { ChatMessage, ChatState } from '../chat/types'
import type { WorkspaceState } from './types'
import styles from './AgentWorkspace.module.css'

// Helper to generate unique message IDs
let msgCounter = 0
const nextMsgId = () => `msg-${++msgCounter}`

// Helper to set typing indicator
const setTyping = (sender: AgentRole, text: string) =>
  (state: WorkspaceState): WorkspaceState => ({
    ...state,
    typing: { sender, text }
  })

// Helper to clear typing and add a message
const addMessageClearTyping = (message: Omit<ChatMessage, 'id' | 'timestamp'>) =>
  (state: WorkspaceState): WorkspaceState => ({
    ...state,
    typing: undefined,
    messages: [...state.messages, {
      ...message,
      id: nextMsgId(),
      timestamp: Date.now()
    }]
  })

// Combined helper: clear typing, add message and task together
const addMessageAndTask = (
  message: Omit<ChatMessage, 'id' | 'timestamp'>,
  task: Task
) => (state: WorkspaceState): WorkspaceState => ({
  ...state,
  typing: undefined,
  messages: [...state.messages, {
    ...message,
    id: nextMsgId(),
    timestamp: Date.now()
  }],
  tasks: [...state.tasks, task]
})

// Combined helper: clear typing, add message and update task status
const addMessageAndUpdateTask = (
  message: Omit<ChatMessage, 'id' | 'timestamp'>,
  taskKey: string,
  status: TaskStatus
) => (state: WorkspaceState): WorkspaceState => ({
  ...state,
  typing: undefined,
  messages: [...state.messages, {
    ...message,
    id: nextMsgId(),
    timestamp: Date.now()
  }],
  tasks: state.tasks.map(t => t.key === taskKey ? { ...t, status } : t)
})

// Helper to set typing and update task status (for when work starts)
const setTypingAndUpdateTask = (
  sender: AgentRole,
  text: string,
  taskKey: string,
  status: TaskStatus
) => (state: WorkspaceState): WorkspaceState => ({
  ...state,
  typing: { sender, text },
  tasks: state.tasks.map(t => t.key === taskKey ? { ...t, status } : t)
})

// The story: PM analyzes requirements, creates tasks, engineers work on them
const workspaceStory: Story<WorkspaceState> = {
  initialState: {
    tasks: [],
    messages: []
  },
  steps: [
    // PM starts typing
    {
      delay: 1000,
      state: setTyping('pm', 'Analyzing customer requirements...')
    },
    // PM completes analysis and creates first task
    {
      delay: 3500,
      state: addMessageAndTask(
        {
          type: 'agent',
          sender: 'pm',
          content: 'New project for Bay Area Auto Parts. Core problem: manual inventory tracking causing stockouts across 3 retail locations. Starting with database schema.',
          action: { type: 'created', status: 'success', label: 'createTask', subject: 'BAAP-1' }
        },
        { key: 'BAAP-1', title: 'Product database schema', type: 'backend', priority: 'high', status: 'todo', assignee: 'engineer' }
      )
    },
    // PM creates second task
    {
      delay: 5500,
      state: addMessageAndTask(
        {
          type: 'agent',
          sender: 'pm',
          content: 'Next priority: API endpoints for inventory operations.',
          action: { type: 'created', status: 'success', label: 'createTask', subject: 'BAAP-2' }
        },
        { key: 'BAAP-2', title: 'Inventory tracking API', type: 'api', priority: 'high', status: 'todo', assignee: 'engineer' }
      )
    },
    // Engineer starts working on BAAP-1 (typing indicator + task moves to in-progress)
    {
      delay: 7500,
      state: setTypingAndUpdateTask('engineer', 'Setting up PostgreSQL schema...', 'BAAP-1', 'in-progress')
    },
    // Engineer posts progress
    {
      delay: 9500,
      state: addMessageClearTyping({
        type: 'agent',
        sender: 'engineer',
        content: 'Schema designed with tables: products, inventory_levels, warehouses, stock_movements. Adding indexes for product lookups.',
        action: { type: 'started', status: 'pending', label: 'writeCode', subject: 'BAAP-1' }
      })
    },
    // PM creates third task
    {
      delay: 11500,
      state: addMessageAndTask(
        {
          type: 'agent',
          sender: 'pm',
          content: 'Adding POS interface task for counter staff.',
          action: { type: 'created', status: 'success', label: 'createTask', subject: 'BAAP-3' }
        },
        { key: 'BAAP-3', title: 'POS counter interface', type: 'frontend', priority: 'medium', status: 'todo', assignee: 'engineer' }
      )
    },
    // Engineer completes BAAP-1
    {
      delay: 13500,
      state: addMessageAndUpdateTask(
        {
          type: 'agent',
          sender: 'engineer',
          content: 'Database schema complete. All migrations passing.',
          action: { type: 'completed', status: 'success', label: 'completeTask', subject: 'BAAP-1' }
        },
        'BAAP-1',
        'done'
      )
    },
    // Engineer starts BAAP-2 (typing indicator + task moves)
    {
      delay: 15500,
      state: setTypingAndUpdateTask('engineer', 'Building REST endpoints...', 'BAAP-2', 'in-progress')
    },
    // PM creates fourth task
    {
      delay: 17500,
      state: addMessageAndTask(
        {
          type: 'agent',
          sender: 'pm',
          content: 'Final MVP task: automated reorder alerts when stock is low.',
          action: { type: 'created', status: 'success', label: 'createTask', subject: 'BAAP-4' }
        },
        { key: 'BAAP-4', title: 'Reorder alert system', type: 'backend', priority: 'medium', status: 'todo', assignee: 'engineer' }
      )
    },
    // Engineer completes BAAP-2
    {
      delay: 19500,
      state: addMessageAndUpdateTask(
        {
          type: 'agent',
          sender: 'engineer',
          content: 'API complete. Endpoints: GET/POST/PUT/DELETE for products, inventory, and transfers.',
          action: { type: 'completed', status: 'success', label: 'completeTask', subject: 'BAAP-2' }
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
  const prevTaskCountRef = useRef(state.tasks.length)

  // Reset animation cache when story resets (tasks go from >0 to 0)
  useEffect(() => {
    if (prevTaskCountRef.current > 0 && state.tasks.length === 0) {
      resetTaskAnimationCache()
    }
    prevTaskCountRef.current = state.tasks.length
  }, [state.tasks.length])

  // Convert messages to ChatState format (single channel view)
  const chatState: ChatState = {
    channels: [
      { id: 'project', name: 'project-baap-inventory', messages: state.messages }
    ],
    activeChannelId: 'project',
    typing: state.typing
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
