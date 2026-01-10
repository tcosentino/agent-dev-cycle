import { useRef, useLayoutEffect } from 'react'
import type { Task } from './types'
import { PriorityBadge, TypeBadge, AssigneeBadge } from '../shared/badges'
import styles from './TaskCard.module.css'

interface TaskCardProps {
  task: Task
  animate?: boolean
  animationDelay?: number
}

// Global position cache - persists across component unmount/remount
// This is needed because when a task moves columns, React unmounts the old
// TaskCard and mounts a new one. We need to remember where the old one was.
const positionCache = new Map<string, DOMRect>()

// Track which tasks are being animated to avoid conflicts
const animatingTasks = new Set<string>()

export function TaskCard({ task, animate = false, animationDelay = 0 }: TaskCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const style = animate ? { animationDelay: `${animationDelay}s` } : undefined

  // Capture position before React commits DOM changes
  // This runs during render, before useLayoutEffect
  const prevRect = positionCache.get(task.key)

  // FLIP animation: after DOM update, check if position changed
  useLayoutEffect(() => {
    const card = cardRef.current
    if (!card) return

    const currentRect = card.getBoundingClientRect()

    // If we have a previous position and aren't already animating, animate
    if (prevRect && !animatingTasks.has(task.key)) {
      const deltaX = prevRect.left - currentRect.left
      const deltaY = prevRect.top - currentRect.top

      // Only animate if there's actual movement
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
      className={`${styles.card} ${animate ? styles.animate : ''}`}
      style={style}
      data-task-key={task.key}
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
