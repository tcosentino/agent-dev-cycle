import { Chat } from './Chat'
import { useStoryPlayer, type Story } from '../../hooks'
import type { ChatMessage, ChatState } from './types'

// Helper to add a message
const addMessage = (message: Omit<ChatMessage, 'id' | 'timestamp'>) =>
  (state: ChatState): ChatState => {
    const newMessage: ChatMessage = {
      ...message,
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: Date.now()
    }
    return {
      ...state,
      channels: state.channels.map(channel =>
        channel.id === 'general'
          ? { ...channel, messages: [...channel.messages, newMessage] }
          : channel
      )
    }
  }

// Demo story: agents discussing and working on tasks
const chatStory: Story<ChatState> = {
  initialState: {
    channels: [
      { id: 'general', name: 'general', messages: [] },
      { id: 'dev', name: 'dev', messages: [] }
    ],
    activeChannelId: 'general'
  },
  steps: [
    {
      delay: 1000,
      state: addMessage({
        type: 'agent',
        sender: 'pm',
        content: 'Starting work on the inventory system. First up: product database schema.',
        action: { type: 'assigned', status: 'success', label: 'Assigned', subject: 'BAAP-1' }
      })
    },
    {
      delay: 2500,
      state: addMessage({
        type: 'agent',
        sender: 'engineer',
        content: 'On it. Setting up the PostgreSQL schema with proper indexing for product lookups.',
        action: { type: 'started', status: 'pending', label: 'Started', subject: 'BAAP-1' }
      })
    },
    {
      delay: 4000,
      state: addMessage({
        type: 'agent',
        sender: 'engineer',
        content: 'Database schema complete. Tables created: products, inventory_levels, warehouses, and stock_movements.',
        action: { type: 'completed', status: 'success', label: 'Completed', subject: 'BAAP-1' }
      })
    },
    {
      delay: 5500,
      state: addMessage({
        type: 'agent',
        sender: 'pm',
        content: 'Great progress! Starting the inventory tracking API next.',
        action: { type: 'created', status: 'success', label: 'Created', subject: 'BAAP-2' }
      })
    },
    {
      delay: 7000,
      state: addMessage({
        type: 'agent',
        sender: 'engineer',
        content: 'Building REST endpoints for inventory CRUD operations. Using Express with TypeScript.',
        action: { type: 'started', status: 'pending', label: 'Started', subject: 'BAAP-2' }
      })
    }
  ]
}

interface ChatDemoProps {
  autoPlay?: boolean
  loop?: boolean
  loopDelay?: number
}

export function ChatDemo({ autoPlay = false, loop = false, loopDelay = 2000 }: ChatDemoProps) {
  const { state } = useStoryPlayer(chatStory, { autoPlay, loop, loopDelay })

  return (
    <div style={{ height: 500 }}>
      <Chat state={state} />
    </div>
  )
}
