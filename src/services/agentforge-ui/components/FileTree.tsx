import {
  ChevronRightIcon,
  ChevronDownIcon,
  FolderIcon,
  FolderOpenIcon,
  FileDocumentIcon,
  SettingsIcon,
  BookOpenIcon,
  ClockIcon,
  CodeIcon,
  BoxIcon,
} from '@agentforge/ui-components'
import type { FileNode, FileCategory } from '../types'
import styles from '../ProjectViewer.module.css'

const categoryClass: Record<FileCategory, string> = {
  config: styles.catConfig,
  briefing: styles.catBriefing,
  prompt: styles.catPrompt,
  memory: styles.catMemory,
  session: styles.catSession,
  state: styles.catState,
  source: styles.catSource,
  other: styles.catOther,
}

function FileIcon({ category, extension }: { category: FileCategory; extension?: string }) {
  const cls = `${styles.nodeIcon} ${categoryClass[category]}`

  if (category === 'config') return <SettingsIcon className={cls} />
  if (category === 'briefing') return <BookOpenIcon className={cls} />
  if (category === 'session' && extension === 'jsonl') return <ClockIcon className={cls} />
  if (category === 'source') return <CodeIcon className={cls} />
  return <FileDocumentIcon className={cls} />
}

interface FileTreeNodeProps {
  node: FileNode
  depth: number
  expandedFolders: Set<string>
  selectedFile: string | null
  onToggle: (path: string) => void
  onSelect: (path: string) => void
  onServiceSelect?: (path: string) => void
  onOpenSpecSelect?: (path: string) => void
}

export function FileTreeNode({
  node,
  depth,
  expandedFolders,
  selectedFile,
  onToggle,
  onSelect,
  onServiceSelect,
  onOpenSpecSelect,
}: FileTreeNodeProps) {
  const isExpanded = expandedFolders.has(node.path)
  const isSelected = node.path === selectedFile

  const handleClick = () => {
    if (node.type === 'folder') {
      if (node.isService && onServiceSelect) {
        // Service folders open the service view
        onServiceSelect(node.path)
      } else if (node.isOpenSpec && onOpenSpecSelect) {
        // OpenSpec change folders open the openspec panel
        onOpenSpecSelect(node.path)
      } else {
        // Regular folders toggle expansion
        onToggle(node.path)
      }
    } else {
      onSelect(node.path)
    }
  }

  const className = [
    styles.treeNode,
    node.type === 'folder' ? styles.treeNodeFolder : '',
    node.isService ? styles.treeNodeService : '',
    node.isOpenSpec ? styles.treeNodeOpenSpec : '',
    isSelected ? styles.treeNodeSelected : '',
  ].filter(Boolean).join(' ')

  return (
    <>
      <button
        className={className}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={handleClick}
      >
        {node.type === 'folder' ? (
          <>
            {node.isService ? (
              // Service folders show a special icon
              <>
                <span
                  className={styles.nodeChevron}
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggle(node.path)
                  }}
                >
                  {isExpanded
                    ? <ChevronDownIcon />
                    : <ChevronRightIcon />
                  }
                </span>
                <BoxIcon className={styles.treeServiceIcon} />
              </>
            ) : node.isOpenSpec ? (
              // OpenSpec change folders show a book icon
              <>
                <span
                  className={styles.nodeChevron}
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggle(node.path)
                  }}
                >
                  {isExpanded
                    ? <ChevronDownIcon />
                    : <ChevronRightIcon />
                  }
                </span>
                <BookOpenIcon className={styles.treeOpenSpecIcon} />
              </>
            ) : (
              <>
                {isExpanded
                  ? <ChevronDownIcon className={styles.nodeChevron} />
                  : <ChevronRightIcon className={styles.nodeChevron} />
                }
                {isExpanded
                  ? <FolderOpenIcon className={`${styles.nodeIcon} ${categoryClass[node.category]}`} />
                  : <FolderIcon className={`${styles.nodeIcon} ${categoryClass[node.category]}`} />
                }
              </>
            )}
          </>
        ) : (
          <>
            <span className={styles.nodeChevron} />
            <FileIcon category={node.category} extension={node.extension} />
          </>
        )}
        <span className={styles.nodeName}>{node.name}</span>
        {node.isService && <span className={styles.serviceBadge}>service</span>}
        {node.isOpenSpec && <span className={styles.openspecBadge}>spec</span>}
      </button>
      {node.type === 'folder' && isExpanded && node.children?.map(child => (
        <FileTreeNode
          key={child.path}
          node={child}
          depth={depth + 1}
          expandedFolders={expandedFolders}
          selectedFile={selectedFile}
          onToggle={onToggle}
          onSelect={onSelect}
          onServiceSelect={onServiceSelect}
          onOpenSpecSelect={onOpenSpecSelect}
        />
      ))}
    </>
  )
}
