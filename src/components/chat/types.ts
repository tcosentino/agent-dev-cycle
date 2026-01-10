import type { AgentRole } from '../task-board/types'

export type MessageType = 'user' | 'agent' | 'system'
export type ActionStatus = 'success' | 'error' | 'pending'

export interface MessageAction {
  label: string
  status: ActionStatus
}

export interface ChatMessage {
  id: string
  type: MessageType
  sender?: AgentRole
  senderName?: string
  content: string
  timestamp: number
  taskRef?: string
  action?: MessageAction
}

export interface ChatChannel {
  id: string
  name: string
  messages: ChatMessage[]
}

export interface ChatState {
  channels: ChatChannel[]
  activeChannelId: string
}

export interface ChatProps {
  state: ChatState
  onChannelSelect?: (channelId: string) => void
  hideSidebar?: boolean
}
