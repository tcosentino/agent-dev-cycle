import { ListPanel, type SidebarItem } from '../shared/ListPanel'
import { ChatMessages } from './ChatMessages'
import type { ChatProps } from './types'
import styles from './Chat.module.css'

function HashIcon() {
  return <span className={styles.channelHash}>#</span>
}

export function Chat({ state, onChannelSelect, hideSidebar = false }: ChatProps) {
  const activeChannel = state.channels.find(c => c.id === state.activeChannelId)
  const messages = activeChannel?.messages ?? []

  // If hideSidebar, render without ListPanel wrapper
  if (hideSidebar) {
    return (
      <div className={styles.containerNoSidebar}>
        <div className={styles.header}>
          <span className={styles.channelHash}>#</span>
          <span className={styles.channelTitle}>{activeChannel?.name ?? 'Select a channel'}</span>
        </div>
        <ChatMessages messages={messages} typing={state.typing} />
      </div>
    )
  }

  const sidebarItems: SidebarItem<string>[] = state.channels.map(channel => ({
    id: channel.id,
    label: channel.name,
    icon: <HashIcon />
  }))

  return (
    <ListPanel
      sidebarTitle="Channels"
      sidebarItems={sidebarItems}
      activeItemId={state.activeChannelId}
      onItemSelect={(id) => id && onChannelSelect?.(id)}
      headerTitle={activeChannel?.name ?? 'Select a channel'}
      headerContent={null}
    >
      <ChatMessages messages={messages} typing={state.typing} />
    </ListPanel>
  )
}
