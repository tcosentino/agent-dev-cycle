import { useState } from 'react'
import { api, type ApiProject } from '../api'
import { XIcon } from './shared/icons'
import styles from './CreateProjectModal.module.css'

export interface CreateProjectModalProps {
  userId: string
  onClose: () => void
  onProjectCreated: (project: ApiProject) => void
}

export function CreateProjectModal({
  userId,
  onClose,
  onProjectCreated,
}: CreateProjectModalProps) {
  const [name, setName] = useState('')
  const [key, setKey] = useState('')
  const [repoUrl, setRepoUrl] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Auto-generate key from name
  const handleNameChange = (value: string) => {
    setName(value)
    // Generate key: first letters of words, uppercase, max 10 chars
    if (!key || key === generateKey(name)) {
      setKey(generateKey(value))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      setError('Please enter a project name')
      return
    }

    if (!key.trim() || key.length < 2) {
      setError('Please enter a project key (at least 2 characters)')
      return
    }

    if (repoUrl && !isValidGitHubUrl(repoUrl)) {
      setError('Please enter a valid GitHub repository URL')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const project = await api.projects.create({
        userId,
        name: name.trim(),
        key: key.toUpperCase().trim(),
        repoUrl: repoUrl.trim() || undefined,
      })

      onProjectCreated(project)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project')
      setIsSubmitting(false)
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Create Project</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <XIcon width={20} height={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalContent}>
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="projectName">
              Project Name
            </label>
            <input
              id="projectName"
              type="text"
              className={styles.input}
              value={name}
              onChange={e => handleNameChange(e.target.value)}
              placeholder="My Awesome Project"
              autoFocus
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="projectKey">
              Project Key
              <span className={styles.labelHint}>2-10 characters, used as prefix for tasks</span>
            </label>
            <input
              id="projectKey"
              type="text"
              className={styles.input}
              value={key}
              onChange={e => setKey(e.target.value.toUpperCase().slice(0, 10))}
              placeholder="MAP"
              maxLength={10}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="repoUrl">
              GitHub Repository
              <span className={styles.labelHint}>Optional - link to view source files</span>
            </label>
            <input
              id="repoUrl"
              type="text"
              className={styles.input}
              value={repoUrl}
              onChange={e => setRepoUrl(e.target.value)}
              placeholder="https://github.com/owner/repo"
            />
          </div>

          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}

          <div className={styles.modalFooter}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={isSubmitting || !name.trim() || !key.trim()}
            >
              {isSubmitting ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function generateKey(name: string): string {
  if (!name.trim()) return ''

  // Take first letter of each word
  const words = name.trim().split(/\s+/)
  const key = words
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 10)

  // Ensure at least 2 characters
  if (key.length < 2 && name.length >= 2) {
    return name.slice(0, 3).toUpperCase()
  }

  return key
}

function isValidGitHubUrl(url: string): boolean {
  return /^https:\/\/github\.com\/[\w-]+\/[\w.-]+\/?$/.test(url) ||
    /^git@github\.com:[\w-]+\/[\w.-]+\.git$/.test(url)
}
