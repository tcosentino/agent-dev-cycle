import { useState, useCallback } from 'react'
import { Chat } from './Chat'
import type { ChatState, ChatMessage } from './types'

// Pre-populated messages for different channels
const createMessages = (channelId: string): ChatMessage[] => {
  const now = Date.now()

  const channelMessages: Record<string, ChatMessage[]> = {
    'general': [
      {
        id: 'msg-1',
        type: 'agent',
        sender: 'pm',
        content: 'Welcome to the general channel! This is where we discuss project updates.',
        timestamp: now - 300000
      },
      {
        id: 'msg-2',
        type: 'agent',
        sender: 'engineer',
        content: 'The new inventory system is coming along nicely. Database schema is complete.',
        timestamp: now - 240000,
        taskRef: 'BAAP-1',
        action: { label: 'Schema complete', status: 'success' }
      },
      {
        id: 'msg-3',
        type: 'agent',
        sender: 'pm',
        content: 'Great work! Moving on to the API layer next.',
        timestamp: now - 180000
      }
    ],
    'dev': [
      {
        id: 'msg-4',
        type: 'agent',
        sender: 'engineer',
        content: 'Working on the REST API endpoints for inventory management.',
        timestamp: now - 250000,
        taskRef: 'BAAP-2'
      },
      {
        id: 'msg-5',
        type: 'agent',
        sender: 'engineer',
        content: 'Set up Express with TypeScript. Added routes for products, warehouses, and stock levels.',
        timestamp: now - 200000,
        action: { label: 'API routes created', status: 'success' }
      },
      {
        id: 'msg-6',
        type: 'agent',
        sender: 'pm',
        content: 'Nice! Can you add validation middleware next?',
        timestamp: now - 150000
      },
      {
        id: 'msg-7',
        type: 'agent',
        sender: 'engineer',
        content: 'Already on it. Using Zod for schema validation.',
        timestamp: now - 100000,
        action: { label: 'Adding validation', status: 'pending' }
      }
    ],
    'design': [
      {
        id: 'msg-8',
        type: 'agent',
        sender: 'pm',
        content: 'The design team needs to review the dashboard mockups.',
        timestamp: now - 220000
      },
      {
        id: 'msg-9',
        type: 'system',
        content: 'Design review scheduled for tomorrow at 2pm.',
        timestamp: now - 170000
      },
      {
        id: 'msg-10',
        type: 'agent',
        sender: 'engineer',
        content: 'I can prepare the component library documentation before then.',
        timestamp: now - 120000,
        taskRef: 'BAAP-5'
      }
    ],
    'alerts': [
      {
        id: 'msg-11',
        type: 'system',
        content: 'Build pipeline completed successfully.',
        timestamp: now - 280000,
        action: { label: 'Build #142', status: 'success' }
      },
      {
        id: 'msg-12',
        type: 'system',
        content: 'All 47 tests passed.',
        timestamp: now - 275000,
        action: { label: 'Tests passed', status: 'success' }
      },
      {
        id: 'msg-13',
        type: 'system',
        content: 'Deployment to staging environment complete.',
        timestamp: now - 130000,
        action: { label: 'Deployed to staging', status: 'success' }
      }
    ]
  }

  return channelMessages[channelId] ?? []
}

const initialState: ChatState = {
  channels: [
    { id: 'general', name: 'general', messages: createMessages('general') },
    { id: 'dev', name: 'dev', messages: createMessages('dev') },
    { id: 'design', name: 'design', messages: createMessages('design') },
    { id: 'alerts', name: 'alerts', messages: createMessages('alerts') }
  ],
  activeChannelId: 'general'
}

interface ChatSwitchingDemoProps {
  height?: number
}

export function ChatSwitchingDemo({ height = 500 }: ChatSwitchingDemoProps) {
  const [chatState, setChatState] = useState<ChatState>(initialState)

  const handleChannelSelect = useCallback((channelId: string) => {
    setChatState(prev => ({
      ...prev,
      activeChannelId: channelId
    }))
  }, [])

  return (
    <div style={{ height }}>
      <Chat
        state={chatState}
        onChannelSelect={handleChannelSelect}
      />
    </div>
  )
}
