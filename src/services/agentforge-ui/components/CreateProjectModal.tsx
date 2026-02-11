import { useState, useEffect, useRef, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { api, type ApiProject, type ApiGitHubRepo } from '../api'
import { Modal, ChevronDownIcon } from '@agentforge/ui-components'
import styles from '@agentforge/ui-components/components/Modal/Modal.module.css'

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
  const [localPath, setLocalPath] = useState('')
  const [selectedRepo, setSelectedRepo] = useState<ApiGitHubRepo | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Repo dropdown state
  const [repos, setRepos] = useState<ApiGitHubRepo[]>([])
  const [reposLoading, setReposLoading] = useState(true)
  const [reposError, setReposError] = useState<string | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 })
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load repos on mount
  useEffect(() => {
    async function loadRepos() {
      try {
        setReposLoading(true)
        setReposError(null)
        const { repos } = await api.github.getRepos()
        setRepos(repos)
      } catch (err) {
        setReposError(err instanceof Error ? err.message : 'Failed to load repositories')
      } finally {
        setReposLoading(false)
      }
    }
    loadRepos()
  }, [])

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node
      if (
        dropdownRef.current && !dropdownRef.current.contains(target) &&
        inputRef.current && !inputRef.current.contains(target)
      ) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Update dropdown position when open
  useLayoutEffect(() => {
    if (dropdownOpen && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom,
        left: rect.left,
        width: rect.width,
      })
    }
  }, [dropdownOpen])

  // Auto-generate key from name
  const handleNameChange = (value: string) => {
    setName(value)
    // Generate key: first letters of words, uppercase, max 10 chars
    if (!key || key === generateKey(name)) {
      setKey(generateKey(value))
    }
  }

  // Filter repos by search query
  const filteredRepos = repos.filter(repo =>
    repo.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (repo.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  )

  const handleRepoSelect = (repo: ApiGitHubRepo) => {
    setSelectedRepo(repo)
    setSearchQuery('')
    setDropdownOpen(false)

    // Auto-fill name if empty
    if (!name.trim()) {
      handleNameChange(repo.name.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()))
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

    setIsSubmitting(true)
    setError(null)

    try {
      const project = await api.projects.create({
        userId,
        name: name.trim(),
        key: key.toUpperCase().trim(),
        repoUrl: selectedRepo?.html_url,
        localPath: localPath.trim() || undefined,
      })

      onProjectCreated(project)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project')
      setIsSubmitting(false)
    }
  }

  return (
    <Modal title="Create Project" onClose={onClose}>
      <form onSubmit={handleSubmit} className={styles.modalContent}>
        <div className={styles.formGroup}>
          <label className={styles.label}>
            GitHub Repository
            <span className={styles.labelHint}>Optional - link to view source files</span>
          </label>
          <div className={styles.selectContainer}>
            <input
              ref={inputRef}
              type="text"
              className={`${styles.selectInput} ${dropdownOpen ? styles.open : ''}`}
              value={dropdownOpen ? searchQuery : (selectedRepo?.full_name ?? '')}
              onChange={e => setSearchQuery(e.target.value)}
              onClick={() => {
                setDropdownOpen(true)
                setSearchQuery('')
              }}
              placeholder="Search repositories..."
            />
            <ChevronDownIcon
              width={16}
              height={16}
              className={`${styles.selectChevron} ${dropdownOpen ? styles.open : ''}`}
            />
            {dropdownOpen && createPortal(
              <div
                ref={dropdownRef}
                className={styles.selectDropdownPortal}
                style={{
                  top: dropdownPosition.top,
                  left: dropdownPosition.left,
                  width: dropdownPosition.width,
                }}
              >
                {reposLoading ? (
                  <div className={styles.selectLoading}>Loading repositories...</div>
                ) : reposError ? (
                  <div className={styles.selectEmpty}>{reposError}</div>
                ) : filteredRepos.length === 0 ? (
                  <div className={styles.selectEmpty}>
                    {searchQuery ? 'No matching repositories' : 'No repositories found'}
                  </div>
                ) : (
                  filteredRepos.map(repo => (
                    <div
                      key={repo.id}
                      className={`${styles.selectOption} ${selectedRepo?.id === repo.id ? styles.selected : ''}`}
                      onClick={() => handleRepoSelect(repo)}
                    >
                      <div className={styles.selectOptionName}>
                        {repo.full_name}
                        {repo.private && <span className={styles.privateTag}>Private</span>}
                      </div>
                      {repo.description && (
                        <div className={styles.selectOptionDescription}>{repo.description}</div>
                      )}
                    </div>
                  ))
                )}
              </div>,
              document.body
            )}
          </div>
        </div>

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
          <label className={styles.label} htmlFor="localPath">
            Local Path
            <span className={styles.labelHint}>Optional - filesystem path for development</span>
          </label>
          <input
            id="localPath"
            type="text"
            className={styles.input}
            value={localPath}
            onChange={e => setLocalPath(e.target.value)}
            placeholder="/path/to/project"
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
    </Modal>
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
