import { useRef, useEffect } from 'react'
import type { ChatMessage as ChatMessageType } from './types'
import { ChatMessage } from './ChatMessage'
import styles from './Chat.module.css'

interface ChatMessagesProps {
  messages: ChatMessageType[]
}

export function ChatMessages({ messages }: ChatMessagesProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const prevMessageCountRef = useRef(messages.length)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > prevMessageCountRef.current && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
    prevMessageCountRef.current = messages.length
  }, [messages.length])

  // Group consecutive messages from same sender
  const shouldShowAvatar = (message: ChatMessageType, index: number): boolean => {
    if (index === 0) return true
    const prev = messages[index - 1]
    return prev.type !== message.type || prev.sender !== message.sender
  }

  return (
    <div className={styles.messagesContainer} ref={containerRef}>
      {messages.length === 0 ? (
        <div className={styles.emptyState}>No messages yet</div>
      ) : (
        messages.map((message, index) => (
          <ChatMessage
            key={message.id}
            message={message}
            showAvatar={shouldShowAvatar(message, index)}
          />
        ))
      )}
    </div>
  )
}
