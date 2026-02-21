import { useState, useRef, useEffect } from 'react'
import { api, type CreateAgentInput } from '../../api'
import { XIcon } from '@agentforge/ui-components'
import styles from '../AgentSessionPanel/AgentSessionPanel.module.css'

export interface CreateAgentModalProps {
  projectId: string
  existingAgentNames: string[]
  onClose: () => void
  onAgentCreated: (agentName: string) => void
}

const AGENT_TYPES = [
  { value: '', label: 'None' },
  { value: 'architect', label: 'Architect' },
  { value: 'engineer', label: 'Engineer' },
  { value: 'qa', label: 'QA' },
  { value: 'lead', label: 'Lead' },
  { value: 'pm', label: 'PM' },
  { value: 'designer', label: 'Designer' },
  { value: 'devops', label: 'DevOps' },
]

function generateTemplate(name: string): string {
  const displayName = name
    ? name.split(/[-_]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    : '{Agent Name}'

  return `# ${displayName}

## Role
You are a ${displayName.toLowerCase()} agent. Your primary responsibility is...

## Responsibilities
- Responsibility 1
- Responsibility 2
- Responsibility 3

## Guidelines
- Guideline 1
- Guideline 2
- Guideline 3

## Context
{Optional: Project-specific context or constraints}

## Tools
{Optional: Specific tools this agent should use}

## Communication Style
{Optional: How this agent should communicate}
`
}

function validateName(name: string): string | null {
  if (!name) return 'Agent name is required'
  if (name.length > 50) return 'Agent name must be 50 characters or less'
  if (!/^[a-z0-9][a-z0-9_-]*$/.test(name)) {
    return 'Agent name can only contain lowercase letters, numbers, hyphens, and underscores'
  }
  return null
}

export function CreateAgentModal({
  projectId,
  existingAgentNames,
  onClose,
  onAgentCreated,
}: CreateAgentModalProps) {
  const [name, setName] = useState('')
  const [type, setType] = useState('')
  const [prompt, setPrompt] = useState(generateTemplate(''))
  const [nameError, setNameError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasEditedPrompt, setHasEditedPrompt] = useState(false)
  const nameInputRef = useRef<HTMLInputElement>(null)

  // Auto-focus name field on mount
  useEffect(() => {
    nameInputRef.current?.focus()
  }, [])

  const handleNameChange = (rawValue: string) => {
    const value = rawValue.toLowerCase().replace(/\s+/g, '-')
    setName(value)
    setNameError(null)
    setSubmitError(null)

    // Update template if user hasn't manually edited it
    if (!hasEditedPrompt) {
      setPrompt(generateTemplate(value))
    }
  }

  const handleNameBlur = () => {
    if (!name) return
    const error = validateName(name)
    if (error) {
      setNameError(error)
      return
    }
    if (existingAgentNames.includes(name)) {
      setNameError(`Agent '${name}' already exists`)
    }
  }

  const handlePromptChange = (value: string) => {
    setPrompt(value)
    setHasEditedPrompt(true)
    setSubmitError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate
    const nameErr = validateName(name)
    if (nameErr) {
      setNameError(nameErr)
      return
    }

    if (existingAgentNames.includes(name)) {
      setNameError(`Agent '${name}' already exists`)
      return
    }

    if (!prompt.trim() || prompt.trim().length < 10) {
      setSubmitError('Agent prompt must be at least 10 characters')
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const data: CreateAgentInput = {
        name,
        prompt: prompt.trim(),
      }
      if (type) {
        data.type = type
      }

      await api.agents.create(projectId, data)
      onAgentCreated(name)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create agent'
      setSubmitError(message)
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (hasEditedPrompt && name) {
      if (!window.confirm('You have unsaved changes. Discard changes?')) {
        return
      }
    }
    onClose()
  }

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [hasEditedPrompt, name]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div className={styles.modal} style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Create New Agent</h2>
          <button className={styles.closeButton} onClick={handleClose}>
            <XIcon width={20} height={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalContent}>
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="agentName">
              Agent Name
            </label>
            <input
              ref={nameInputRef}
              id="agentName"
              type="text"
              className={styles.textarea}
              style={{ minHeight: 'auto', resize: 'none', height: '38px' }}
              value={name}
              onChange={e => handleNameChange(e.target.value)}
              onBlur={handleNameBlur}
              placeholder="e.g., code-reviewer, test-writer"
              maxLength={50}
              aria-invalid={!!nameError}
              aria-describedby={nameError ? 'nameError' : undefined}
            />
            {nameError && (
              <div id="nameError" className={styles.error} style={{ marginTop: '6px', marginBottom: 0 }}>
                {nameError}
              </div>
            )}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="agentType">
              Type <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span>
            </label>
            <select
              id="agentType"
              className={styles.textarea}
              style={{ minHeight: 'auto', resize: 'none', height: '38px' }}
              value={type}
              onChange={e => setType(e.target.value)}
            >
              {AGENT_TYPES.map(t => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="agentPrompt">
              Prompt
            </label>
            <textarea
              id="agentPrompt"
              className={styles.textarea}
              style={{ minHeight: '250px', fontFamily: 'monospace', fontSize: '13px' }}
              value={prompt}
              onChange={e => handlePromptChange(e.target.value)}
              placeholder="Enter agent prompt..."
            />
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', textAlign: 'right' }}>
              {prompt.length.toLocaleString()} characters
            </div>
          </div>

          {submitError && (
            <div className={styles.error}>
              {submitError}
            </div>
          )}

          <div className={styles.modalFooter}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={isSubmitting || !name || !!nameError}
            >
              {isSubmitting ? 'Creating...' : 'Create Agent'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
