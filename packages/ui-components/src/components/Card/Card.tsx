import { type ReactNode, useState } from 'react'
import { ChevronDownIcon } from '../../icons/icons'
import styles from './Card.module.css'

export interface CardProps {
  /**
   * Optional header content. If provided, the card will have a header section.
   */
  header?: ReactNode
  /**
   * Main content of the card
   */
  children: ReactNode
  /**
   * If true, the card can be collapsed/expanded
   */
  collapsible?: boolean
  /**
   * Control the expanded state externally. If provided, the card becomes controlled.
   */
  expanded?: boolean
  /**
   * Called when the expand/collapse state changes (only for collapsible cards)
   */
  onExpandChange?: (expanded: boolean) => void
  /**
   * If true, the header will not be clickable (useful for controlled cards)
   */
  disableHeaderClick?: boolean
  /**
   * Optional CSS class for the card container
   */
  className?: string
  /**
   * Optional CSS class for the header
   */
  headerClassName?: string
  /**
   * Optional CSS class for the content
   */
  contentClassName?: string
}

export function Card({
  header,
  children,
  collapsible = false,
  expanded,
  onExpandChange,
  disableHeaderClick = false,
  className = '',
  headerClassName = '',
  contentClassName = ''
}: CardProps) {
  const [internalExpanded, setInternalExpanded] = useState(true)

  // Use controlled state if provided, otherwise use internal state
  const isExpanded = expanded !== undefined ? expanded : internalExpanded

  const handleToggle = () => {
    if (!collapsible || disableHeaderClick) return

    const newExpanded = !isExpanded
    if (expanded === undefined) {
      setInternalExpanded(newExpanded)
    }
    onExpandChange?.(newExpanded)
  }

  const headerElement = header ? (
    collapsible ? (
      <button
        className={`${styles.cardHeader} ${headerClassName}`}
        onClick={handleToggle}
        disabled={disableHeaderClick}
      >
        {header}
        <span className={`${styles.toggleIcon} ${isExpanded ? styles.expanded : ''}`}>
          <ChevronDownIcon />
        </span>
      </button>
    ) : (
      <div className={`${styles.cardHeader} ${headerClassName}`}>
        {header}
      </div>
    )
  ) : null

  return (
    <div className={`${styles.card} ${className}`}>
      {headerElement}
      {(!collapsible || isExpanded) && (
        <div className={`${styles.cardContent} ${contentClassName}`}>
          {children}
        </div>
      )}
    </div>
  )
}
