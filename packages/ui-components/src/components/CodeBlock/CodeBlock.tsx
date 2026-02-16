import { useState } from 'react'
import styles from './CodeBlock.module.css'

export interface CodeBlockProps {
  code: string
  language?: string
  className?: string
}

export function CodeBlock({ code, className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)
  const isSingleLine = !code.includes('\n')

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy code:', err)
    }
  }

  return (
    <div className={`${styles.codeBlock} ${isSingleLine ? styles.singleLine : ''} ${className || ''}`}>
      <pre className={styles.code}>
        <code>{code}</code>
      </pre>
      <button
        type="button"
        onClick={handleCopy}
        className={styles.copyButton}
        aria-label="Copy code"
        title={copied ? 'Copied!' : 'Copy code'}
      >
        {copied ? (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" fill="currentColor"/>
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5.75 1a.75.75 0 00-.75.75v3c0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75v-3a.75.75 0 00-.75-.75h-4.5zm.75 3V2.5h3V4h-3z" fill="currentColor"/>
            <path d="M1.75 4.5a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h2a.75.75 0 010 1.5h-2A1.75 1.75 0 010 12.25v-7.5C0 3.784.784 3 1.75 3h2a.75.75 0 010 1.5h-2zm12.5 0h-2a.75.75 0 010-1.5h2c.966 0 1.75.784 1.75 1.75v7.5A1.75 1.75 0 0114.25 14h-2a.75.75 0 010-1.5h2a.25.25 0 00.25-.25v-7.5a.25.25 0 00-.25-.25z" fill="currentColor"/>
          </svg>
        )}
      </button>
    </div>
  )
}
