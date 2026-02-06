import type { AgentRole } from '../task-board/types'

export type MessageType = 'user' | 'agent' | 'system'
export type ActionStatus = 'success' | 'error' | 'pending'
export type ActionType = 'created' | 'updated' | 'assigned' | 'completed' | 'analyzed' | 'started'

export interface MessageAction {
  type: ActionType
  status: ActionStatus
  label: string
  subject?: string // e.g., task key like "BAAP-1"
}

export interface ChatMessage {
  id: string
  type: MessageType
  sender?: AgentRole
  senderName?: string
  content: string
  timestamp: number
  action?: MessageAction
}

export interface TypingIndicator {
  sender: AgentRole
  text: string // e.g., "Analyzing requirements..."
}

export interface ChatChannel {
  id: string
  name: string
  messages: ChatMessage[]
}

export interface ChatState {
  channels: ChatChannel[]
  activeChannelId: string
  typing?: TypingIndicator // Who's currently typing/working
}

export interface ChatProps {
  state: ChatState
  onChannelSelect?: (channelId: string) => void
  hideSidebar?: boolean
}
