import type { Task } from '../task-board/types'
import type { ChatMessage } from '../chat/types'

export interface WorkspaceState {
  tasks: Task[]
  messages: ChatMessage[]
}
