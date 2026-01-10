import type { ChatChannel } from './types'
import styles from './Chat.module.css'

interface ChatSidebarProps {
  channels: ChatChannel[]
  activeChannelId: string
  onChannelSelect?: (channelId: string) => void
}

export function ChatSidebar({ channels, activeChannelId, onChannelSelect }: ChatSidebarProps) {
  return (
    <div className={styles.sidebar}>
      <div className={styles.sidebarHeader}>Channels</div>
      <div className={styles.channelList}>
        {channels.map(channel => (
          <button
            key={channel.id}
            className={`${styles.channelButton} ${channel.id === activeChannelId ? styles.active : ''}`}
            onClick={() => onChannelSelect?.(channel.id)}
          >
            <span className={styles.channelHash}>#</span>
            <span className={styles.channelName}>{channel.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
