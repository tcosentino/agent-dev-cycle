import type { ChatProps } from './types'
import { ChatSidebar } from './ChatSidebar'
import { ChatMessages } from './ChatMessages'
import styles from './Chat.module.css'

export function Chat({ state, onChannelSelect, hideSidebar = false }: ChatProps) {
  const activeChannel = state.channels.find(c => c.id === state.activeChannelId)
  const messages = activeChannel?.messages ?? []

  return (
    <div className={styles.container}>
      {!hideSidebar && (
        <ChatSidebar
          channels={state.channels}
          activeChannelId={state.activeChannelId}
          onChannelSelect={onChannelSelect}
        />
      )}
      <div className={styles.main}>
        <div className={styles.header}>
          <span className={styles.channelHash}>#</span>
          <span className={styles.channelTitle}>{activeChannel?.name ?? 'Select a channel'}</span>
        </div>
        <ChatMessages messages={messages} />
      </div>
    </div>
  )
}
