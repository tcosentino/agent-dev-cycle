import type { ChatMessage as ChatMessageType } from './types'
import { AssigneeBadge, Spinner } from '@agentforge/ui-components'
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
        </div>
        {message.action && (
          <div className={`${styles.actionBadge} ${styles[message.action.status]}`}>
            {message.action.status === 'pending' && (
              <Spinner size="sm" />
            )}
            <span className={styles.actionLabel}>{message.action.label}</span>
            {message.action.subject && (
              <a href={`#task-${message.action.subject}`} className={styles.taskMention}>
                {message.action.subject}
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
