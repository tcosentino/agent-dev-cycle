import { useRef, useEffect } from 'react'
import type { ChatMessage as ChatMessageType, TypingIndicator } from './types'
import { ChatMessage } from './ChatMessage'
import { AssigneeBadge } from '../shared/badges/AssigneeBadge'
import { Spinner } from '../shared/Spinner'
import styles from './Chat.module.css'

interface ChatMessagesProps {
  messages: ChatMessageType[]
  typing?: TypingIndicator
}

const agentNames: Record<string, string> = {
  pm: 'Project Manager',
  engineer: 'Engineer',
  qa: 'QA',
  lead: 'Lead'
}

export function ChatMessages({ messages, typing }: ChatMessagesProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const prevMessageCountRef = useRef(messages.length)

  // Auto-scroll to bottom when new messages arrive or typing changes
  useEffect(() => {
    if ((messages.length > prevMessageCountRef.current || typing) && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
    prevMessageCountRef.current = messages.length
  }, [messages.length, typing])

  // Group consecutive messages from same sender
  const shouldShowAvatar = (message: ChatMessageType, index: number): boolean => {
    if (index === 0) return true
    const prev = messages[index - 1]
    return prev.type !== message.type || prev.sender !== message.sender
  }

  return (
    <div className={styles.messagesContainer} ref={containerRef}>
      {messages.length === 0 && !typing ? (
        <div className={styles.emptyState}>No messages yet</div>
      ) : (
        <>
          {messages.map((message, index) => (
            <ChatMessage
              key={message.id}
              message={message}
              showAvatar={shouldShowAvatar(message, index)}
            />
          ))}
          {typing && (
            <div className={styles.typingIndicator}>
              <div className={styles.typingAvatar}>
                <AssigneeBadge role={typing.sender} />
              </div>
              <div className={styles.typingContent}>
                <span className={styles.typingName}>{agentNames[typing.sender]}</span>
                <span className={styles.typingText}>
                  <Spinner size="sm" />
                  {typing.text}
                </span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
