import { useState, useEffect, useRef } from 'react'
import type { OpenSpecChange } from '../constants'
import { Badge, CheckCircleIcon, InfoIcon } from '@agentforge/ui-components'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { PanelLayout } from '../PanelLayout'
import { SectionCard } from '../SectionCard'
import styles from './OpenSpecPanel.module.css'

export type OpenSpecTab = 'overview' | 'design' | 'specs' | 'tasks'

export interface OpenSpecPanelProps {
  change: OpenSpecChange
  initialTab?: OpenSpecTab
  onTabChange?: (tab: OpenSpecTab) => void
  onApprove?: () => void
}

const OPENSPEC_TABS = [
  { id: 'overview' as OpenSpecTab, label: 'Proposal' },
  { id: 'design' as OpenSpecTab, label: 'Design' },
  { id: 'specs' as OpenSpecTab, label: 'Specs' },
  { id: 'tasks' as OpenSpecTab, label: 'Tasks' },
]

interface TaskItem {
  text: string
  completed: boolean
  indent: number
}

interface TaskSection {
  title: string
  tasks: TaskItem[]
}

function extractTitle(markdown: string): string | null {
  const match = markdown.match(/^#\s+(.+)$/m)
  return match ? match[1].trim() : null
}

function stripFirstHeading(markdown: string): string {
  // Remove the first # heading line (and any trailing newlines after it)
  return markdown.replace(/^#\s+.+\n*/, '')
}

interface TocItem {
  id: string
  text: string
  level: number
}

function extractHeadings(markdown: string): TocItem[] {
  const headings: TocItem[] = []
  const lines = markdown.split('\n')

  for (const line of lines) {
    const match = line.match(/^(#{2,4})\s+(.+)$/)
    if (match) {
      const level = match[1].length
      const text = match[2].trim()
      const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')
      headings.push({ id, text, level })
    }
  }

  return headings
}

function MarkdownWithToc({ content }: { content: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [showToc, setShowToc] = useState(false)
  const headings = extractHeadings(content)

  useEffect(() => {
    const checkWidth = () => {
      if (containerRef.current) {
        setShowToc(containerRef.current.offsetWidth >= 800)
      }
    }

    checkWidth()
    const resizeObserver = new ResizeObserver(checkWidth)
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    return () => resizeObserver.disconnect()
  }, [])

  const scrollToHeading = (id: string) => {
    const element = containerRef.current?.querySelector(`#${id}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div ref={containerRef} className={styles.markdownWithToc}>
      <div className={styles.markdownMain}>
        <div className={styles.markdownContent}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h2: ({ children }) => {
                const text = String(children)
                const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')
                return <h2 id={id}>{children}</h2>
              },
              h3: ({ children }) => {
                const text = String(children)
                const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')
                return <h3 id={id}>{children}</h3>
              },
              h4: ({ children }) => {
                const text = String(children)
                const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')
                return <h4 id={id}>{children}</h4>
              },
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>
      {showToc && headings.length > 0 && (
        <div className={styles.tocSidebar}>
          <div className={styles.tocTitle}>Contents</div>
          <nav className={styles.tocNav}>
            {headings.map((heading, idx) => (
              <button
                key={idx}
                className={`${styles.tocItem} ${styles[`tocLevel${heading.level}`]}`}
                onClick={() => scrollToHeading(heading.id)}
              >
                {heading.text}
              </button>
            ))}
          </nav>
        </div>
      )}
    </div>
  )
}

function parseTasksMarkdown(content: string): TaskSection[] {
  const lines = content.split('\n')
  const sections: TaskSection[] = []
  let currentSection: TaskSection | null = null

  for (const line of lines) {
    // Check for section header (## heading)
    const sectionMatch = line.match(/^##\s+(.+)$/)
    if (sectionMatch) {
      if (currentSection) {
        sections.push(currentSection)
      }
      currentSection = { title: sectionMatch[1], tasks: [] }
      continue
    }

    // Check for task item (- [x] or - [ ])
    const taskMatch = line.match(/^(\s*)-\s+\[([ xX])\]\s+(.+)$/)
    if (taskMatch && currentSection) {
      const indent = Math.floor(taskMatch[1].length / 2)
      const completed = taskMatch[2].toLowerCase() === 'x'
      const text = taskMatch[3]
      currentSection.tasks.push({ text, completed, indent })
    }
  }

  if (currentSection) {
    sections.push(currentSection)
  }

  return sections
}

function TasksView({ content }: { content: string }) {
  const sections = parseTasksMarkdown(content)

  if (sections.length === 0) {
    return (
      <div className={styles.emptyState}>
        <span>No tasks defined</span>
      </div>
    )
  }

  // Calculate overall stats
  const allTasks = sections.flatMap(s => s.tasks)
  const completedCount = allTasks.filter(t => t.completed).length
  const totalCount = allTasks.length
  const percentComplete = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  return (
    <div className={styles.tasksView}>
      <div className={styles.tasksHeader}>
        <div className={styles.tasksProgress}>
          <div className={styles.tasksProgressBar}>
            <div
              className={styles.tasksProgressFill}
              style={{ width: `${percentComplete}%` }}
            />
          </div>
          <span className={styles.tasksProgressText}>
            {completedCount} / {totalCount} tasks ({percentComplete}%)
          </span>
        </div>
      </div>

      {sections.map((section, idx) => {
        const sectionCompleted = section.tasks.filter(t => t.completed).length
        const sectionTotal = section.tasks.length

        return (
          <div key={idx} className={styles.taskSection}>
            <div className={styles.taskSectionHeader}>
              <span className={styles.taskSectionTitle}>{section.title}</span>
              <span className={styles.taskSectionCount}>
                {sectionCompleted}/{sectionTotal}
              </span>
            </div>
            <div className={styles.taskList}>
              {section.tasks.map((task, taskIdx) => (
                <div
                  key={taskIdx}
                  className={`${styles.taskItem} ${task.completed ? styles.taskCompleted : ''}`}
                  style={{ paddingLeft: `${16 + task.indent * 16}px` }}
                >
                  <span className={styles.taskCheckbox}>
                    {task.completed ? (
                      <CheckCircleIcon className={styles.taskCheckIcon} />
                    ) : (
                      <span className={styles.taskUnchecked} />
                    )}
                  </span>
                  <span className={styles.taskText}>{task.text}</span>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function SpecsList({ specs }: { specs: OpenSpecChange['specs'] }) {
  const [activeSpec, setActiveSpec] = useState<string | null>(
    specs && specs.length > 0 ? specs[0].name : null
  )

  if (!specs || specs.length === 0) {
    return (
      <div className={styles.emptyState}>
        <span>No specs defined</span>
      </div>
    )
  }

  const selectedSpec = specs.find(s => s.name === activeSpec)

  return (
    <div className={styles.specsView}>
      <div className={styles.specsSidebar}>
        {specs.map(spec => (
          <button
            key={spec.name}
            className={`${styles.specItem} ${activeSpec === spec.name ? styles.specItemActive : ''}`}
            onClick={() => setActiveSpec(spec.name)}
          >
            <span className={styles.specName}>{spec.name}</span>
          </button>
        ))}
      </div>
      <div className={styles.specsContent}>
        {selectedSpec?.content ? (
          <div className={styles.markdownContent}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {selectedSpec.content}
            </ReactMarkdown>
          </div>
        ) : (
          <div className={styles.emptyState}>
            <span>Spec content not loaded</span>
          </div>
        )}
      </div>
    </div>
  )
}

export function OpenSpecPanel({
  change,
  initialTab,
  onTabChange,
  onApprove,
}: OpenSpecPanelProps) {
  const [activeTab, setActiveTab] = useState<OpenSpecTab>(initialTab ?? 'overview')

  const handleTabChange = (tab: OpenSpecTab) => {
    setActiveTab(tab)
    onTabChange?.(tab)
  }

  // Determine overall status
  const hasProposal = !!change.proposal
  const hasDesign = !!change.design
  const hasTasks = !!change.tasks
  const hasSpecs = change.specs && change.specs.length > 0

  const status = hasProposal && hasDesign && hasTasks && hasSpecs
    ? 'ready'
    : hasProposal
      ? 'in-progress'
      : 'draft'

  const statusLabel = status === 'ready' ? 'Ready for Review' : status === 'in-progress' ? 'In Progress' : 'Draft'
  const statusVariant = status === 'ready' ? 'green' : status === 'in-progress' ? 'orange' : 'gray'

  // Extract title from proposal markdown, fallback to change name
  const panelTitle = (change.proposal && extractTitle(change.proposal)) || change.name

  const headerActions = (
    <div className={styles.headerActions}>
      <Badge variant={statusVariant as 'green' | 'orange' | 'gray'} size="sm">
        {statusLabel}
      </Badge>
      {status === 'ready' && onApprove && (
        <button className={styles.approveButton} onClick={onApprove}>
          <CheckCircleIcon />
          Approve
        </button>
      )}
    </div>
  )

  const renderContent = () => {
    if (activeTab === 'overview') {
      if (!change.proposal) {
        return (
          <div className={styles.emptyState}>
            <InfoIcon className={styles.emptyIcon} />
            <span>No proposal.md found</span>
            <span className={styles.emptyHint}>
              Create a proposal.md in this change directory to define the problem and solution.
            </span>
          </div>
        )
      }

      return (
        <div className={styles.overviewContent}>
          <div className={styles.markdownContent}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {stripFirstHeading(change.proposal)}
            </ReactMarkdown>
          </div>
        </div>
      )
    }

    if (activeTab === 'design') {
      if (!change.design) {
        return (
          <div className={styles.emptyState}>
            <InfoIcon className={styles.emptyIcon} />
            <span>No design.md found</span>
            <span className={styles.emptyHint}>
              Create a design.md to document implementation decisions and architecture.
            </span>
          </div>
        )
      }

      return (
        <div className={styles.overviewContent}>
          <MarkdownWithToc content={stripFirstHeading(change.design)} />
        </div>
      )
    }

    if (activeTab === 'specs') {
      return (
        <div className={styles.specsContainer}>
          <SpecsList specs={change.specs} />
        </div>
      )
    }

    if (activeTab === 'tasks') {
      if (!change.tasks) {
        return (
          <div className={styles.emptyState}>
            <InfoIcon className={styles.emptyIcon} />
            <span>No tasks.md found</span>
            <span className={styles.emptyHint}>
              Create a tasks.md with checkbox items to track implementation progress.
            </span>
          </div>
        )
      }

      return (
        <div className={styles.overviewContent}>
          <SectionCard title="Implementation Tasks">
            <TasksView content={change.tasks} />
          </SectionCard>
        </div>
      )
    }

    return null
  }

  return (
    <PanelLayout
      title={panelTitle}
      headerActions={headerActions}
      tabs={OPENSPEC_TABS}
      activeTab={activeTab}
      onTabChange={handleTabChange}
    >
      {renderContent()}
    </PanelLayout>
  )
}
