import styles from './Spinner.module.css'

export type SpinnerSize = 'sm' | 'md' | 'lg'
export type SpinnerVariant = 'muted' | 'primary'

export interface SpinnerProps {
  size?: SpinnerSize
  variant?: SpinnerVariant
  className?: string
}

export function Spinner({
  size = 'sm',
  variant = 'muted',
  className
}: SpinnerProps) {
  const classes = [
    styles.spinner,
    styles[size],
    styles[variant],
    className
  ].filter(Boolean).join(' ')

  return <span className={classes} />
}
