import type { ChatMessage as ChatMessageType } from './types'
import { AssigneeBadge } from '../shared/badges/AssigneeBadge'
import styles from './Chat.module.css'

interface ChatMessageProps {
  message: ChatMessageType
  showAvatar?: boolean
}

const agentNames: Record<string, string> = {
  pm: 'Project Manager',
  engineer: 'Engineer',
  qa: 'QA',
  lead: 'Lead'
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export function ChatMessage({ message, showAvatar = true }: ChatMessageProps) {
  const isAgent = message.type === 'agent'
  const isSystem = message.type === 'system'
  const isUser = message.type === 'user'

  const displayName = message.senderName ||
    (message.sender ? agentNames[message.sender] : null) ||
    (isUser ? 'You' : null)

  return (
    <div className={`${styles.message} ${styles[message.type]} ${!showAvatar ? styles.grouped : ''}`}>
      {showAvatar ? (
        <div className={styles.avatar}>
          {isAgent && message.sender && (
            <AssigneeBadge role={message.sender} />
          )}
          {isUser && <div className={styles.userAvatar}>U</div>}
          {isSystem && <div className={styles.systemAvatar}>S</div>}
        </div>
      ) : (
        <div className={styles.avatarSpacer} />
      )}
      <div className={styles.messageContent}>
        {showAvatar && displayName && (
          <div className={styles.messageHeader}>
            <span className={`${styles.senderName} ${message.sender ? styles[message.sender] : ''}`}>
              {displayName}
            </span>
            <span className={styles.timestamp}>{formatTime(message.timestamp)}</span>
          </div>
        )}
        <div className={styles.messageText}>
          {message.content}
          {message.taskRef && !message.action && (
            <span className={styles.taskRef}>{message.taskRef}</span>
          )}
        </div>
        {message.action && (
          <div className={`${styles.actionBadge} ${styles[message.action.status]}`}>
            <span className={styles.actionLabel}>{message.action.label}</span>
            {message.taskRef && (
              <a href={`#task-${message.taskRef}`} className={styles.taskMention}>
                {message.taskRef}
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
