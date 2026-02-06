import { useRef, useLayoutEffect } from 'react'
import type { Task } from './types'
import { PriorityBadge, TypeBadge, AssigneeBadge } from '../shared/badges'
import styles from './TaskCard.module.css'

interface TaskCardProps {
  task: Task
  animate?: boolean
  animationDelay?: number
  selected?: boolean
  onClick?: (taskKey: string) => void
}

// Global position cache - persists across component unmount/remount
// This is needed because when a task moves columns, React unmounts the old
// TaskCard and mounts a new one. We need to remember where the old one was.
const positionCache = new Map<string, DOMRect>()

// Track which tasks are being animated to avoid conflicts
const animatingTasks = new Set<string>()

// Track tasks that have completed their entrance animation
const enteredTasks = new Set<string>()

// Export function to reset animation caches (call when story resets)
export function resetTaskAnimationCache() {
  positionCache.clear()
  animatingTasks.clear()
  enteredTasks.clear()
}

export function TaskCard({ task, animate = false, animationDelay = 0, selected = false, onClick }: TaskCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const style = animate ? { animationDelay: `${animationDelay}s` } : undefined

  // Check if this is a new task (hasn't entered yet)
  const isNewTask = !enteredTasks.has(task.key)

  // Capture position before React commits DOM changes
  // This runs during render, before useLayoutEffect
  const prevRect = positionCache.get(task.key)

  // FLIP animation: after DOM update, check if position changed
  useLayoutEffect(() => {
    const card = cardRef.current
    if (!card) return

    const currentRect = card.getBoundingClientRect()

    // New task entrance animation - grow from top
    if (isNewTask) {
      enteredTasks.add(task.key)

      // Start collapsed
      card.style.opacity = '0'
      card.style.transform = 'scaleY(0)'
      card.style.transformOrigin = 'top center'
      card.style.transition = 'none'

      // Force reflow
      card.offsetHeight

      // Animate to full size - grow out from top
      card.style.opacity = '1'
      card.style.transform = 'scaleY(1)'
      card.style.transition = 'opacity 0.35s ease-out, transform 0.35s ease-out'

      // Clean up inline styles after animation
      const cleanup = () => {
        card.style.opacity = ''
        card.style.transform = ''
        card.style.transformOrigin = ''
        card.style.transition = ''
        card.removeEventListener('transitionend', cleanup)
      }
      card.addEventListener('transitionend', cleanup)

      // Cache position after entrance
      positionCache.set(task.key, currentRect)
      return
    }

    // FLIP animation for existing tasks moving between columns
    if (prevRect && !animatingTasks.has(task.key)) {
      const deltaX = prevRect.left - currentRect.left
      const deltaY = prevRect.top - currentRect.top

      // Only animate if there's actual movement (column change)
      if (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1) {
        animatingTasks.add(task.key)

        // Start from old position (inverted)
        card.style.transform = `translate(${deltaX}px, ${deltaY}px)`
        card.style.transition = 'none'

        // Force reflow to apply the transform immediately
        card.offsetHeight

        // Animate to new position (play)
        card.style.transform = ''
        card.style.transition = 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)'

        // Clean up after animation
        const cleanup = () => {
          animatingTasks.delete(task.key)
          card.removeEventListener('transitionend', cleanup)
        }
        card.addEventListener('transitionend', cleanup)
      }
    }

    // Always update cache after layout
    positionCache.set(task.key, currentRect)

    // On unmount, capture final position for the next mount
    return () => {
      if (card) {
        positionCache.set(task.key, card.getBoundingClientRect())
      }
    }
  })

  return (
    <div
      ref={cardRef}
      className={`${styles.card} ${animate ? styles.animate : ''} ${selected ? styles.selected : ''}`}
      style={style}
      data-task-key={task.key}
      onClick={() => onClick?.(task.key)}
    >
      <div className={styles.key}>{task.key}</div>
      <div className={styles.title}>{task.title}</div>
      <div className={styles.meta}>
        <TypeBadge type={task.type} />
        <PriorityBadge priority={task.priority} />
        {task.assignee && <AssigneeBadge role={task.assignee} />}
      </div>
    </div>
  )
}
