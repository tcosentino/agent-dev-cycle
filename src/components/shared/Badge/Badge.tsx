import type { ReactNode } from 'react'
import styles from './Badge.module.css'

export type BadgeSize = 'xs' | 'sm' | 'md' | 'lg'
export type BadgeVariant = 'green' | 'orange' | 'red' | 'pink' | 'blue' | 'muted' | 'primary'

export interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
  size?: BadgeSize
  uppercase?: boolean
  className?: string
}

export function Badge({
  children,
  variant = 'muted',
  size = 'sm',
  uppercase = false,
  className
}: BadgeProps) {
  const classes = [
    styles.badge,
    styles[size],
    styles[variant],
    uppercase && styles.uppercase,
    className
  ].filter(Boolean).join(' ')

  return <span className={classes}>{children}</span>
}
