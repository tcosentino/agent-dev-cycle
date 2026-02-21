import { useState, useEffect, useRef, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { api, type ApiGitHubRepo } from '../../api'
import { ChevronDownIcon } from '@agentforge/ui-components'
import type { WizardData } from './ProjectWizard'
import styles from './ProjectWizard.module.css'
import modalStyles from '@agentforge/ui-components/components/Modal/Modal.module.css'

interface Step2Props {
  data: WizardData
  onUpdate: (updates: Partial<WizardData>) => void
  onNext: () => void
  onBack: () => void
  onCancel: () => void
}

type RepoMode = 'existing' | 'new' | 'manual'

export function Step2GitHubRepo({ data, onUpdate, onNext, onBack, onCancel }: Step2Props) {
  const [mode, setMode] = useState<RepoMode>('existing')
  const [repos, setRepos] = useState<ApiGitHubRepo[]>([])
  const [reposLoading, setReposLoading] = useState(true)
  const [reposError, setReposError] = useState<string | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 })
  const [selectedRepo, setSelectedRepo] = useState<ApiGitHubRepo | null>(data.githubRepo || null)
  const [newRepoName, setNewRepoName] = useState(data.createNewRepo?.name || '')
  const [newRepoDesc, setNewRepoDesc] = useState(data.createNewRepo?.description || '')
  const [isPrivate, setIsPrivate] = useState(data.createNewRepo?.isPrivate ?? true)
  const [initWithReadme, setInitWithReadme] = useState(data.createNewRepo?.initializeWithReadme ?? true)
  const [manualUrl, setManualUrl] = useState(data.manualRepoUrl || '')

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
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        inputRef.current &&
        !inputRef.current.contains(target)
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

  // Filter repos by search query
  const filteredRepos = repos.filter(
    repo =>
      repo.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (repo.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  )

  const handleRepoSelect = (repo: ApiGitHubRepo) => {
    setSelectedRepo(repo)
    setSearchQuery('')
    setDropdownOpen(false)
    onUpdate({
      githubRepo: {
        id: repo.id,
        full_name: repo.full_name,
        html_url: repo.html_url,
        clone_url: repo.clone_url,
        default_branch: repo.default_branch,
      },
      createNewRepo: undefined,
      manualRepoUrl: undefined,
    })
  }

  const handleNext = () => {
    if (mode === 'existing' && selectedRepo) {
      onUpdate({
        githubRepo: {
          id: selectedRepo.id,
          full_name: selectedRepo.full_name,
          html_url: selectedRepo.html_url,
          clone_url: selectedRepo.clone_url,
          default_branch: selectedRepo.default_branch,
        },
        createNewRepo: undefined,
        manualRepoUrl: undefined,
      })
      onNext()
    } else if (mode === 'new' && newRepoName.trim()) {
      onUpdate({
        createNewRepo: {
          name: newRepoName.trim(),
          description: newRepoDesc.trim(),
          isPrivate,
          initializeWithReadme: initWithReadme,
        },
        githubRepo: undefined,
        manualRepoUrl: undefined,
      })
      onNext()
    } else if (mode === 'manual' && manualUrl.trim()) {
      onUpdate({
        manualRepoUrl: manualUrl.trim(),
        githubRepo: undefined,
        createNewRepo: undefined,
      })
      onNext()
    }
  }

  const canProceed =
    (mode === 'existing' && selectedRepo) ||
    (mode === 'new' && newRepoName.trim() && !newRepoName.includes(' ')) ||
    (mode === 'manual' && manualUrl.trim())

  return (
    <>
      <div>
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <button
              type="button"
              className={`${styles.button} ${mode === 'existing' ? styles.nextButton : styles.backButton}`}
              onClick={() => setMode('existing')}
            >
              Connect Existing
            </button>
            <button
              type="button"
              className={`${styles.button} ${mode === 'new' ? styles.nextButton : styles.backButton}`}
              onClick={() => setMode('new')}
            >
              Create New
            </button>
            <button
              type="button"
              className={`${styles.button} ${mode === 'manual' ? styles.nextButton : styles.backButton}`}
              onClick={() => setMode('manual')}
            >
              Manual URL
            </button>
          </div>
        </div>

        {mode === 'existing' && (
          <div className={styles.formGroup}>
            <label className={styles.label}>
              Select Repository
              <span className={styles.labelHint}>Choose from your GitHub repositories</span>
            </label>
            <div className={modalStyles.selectContainer}>
              <input
                ref={inputRef}
                type="text"
                className={`${modalStyles.selectInput} ${dropdownOpen ? modalStyles.open : ''}`}
                value={dropdownOpen ? searchQuery : selectedRepo?.full_name ?? ''}
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
                className={`${modalStyles.selectChevron} ${dropdownOpen ? modalStyles.open : ''}`}
              />
              {dropdownOpen &&
                createPortal(
                  <div
                    ref={dropdownRef}
                    className={modalStyles.selectDropdownPortal}
                    style={{
                      top: dropdownPosition.top,
                      left: dropdownPosition.left,
                      width: dropdownPosition.width,
                    }}
                  >
                    {reposLoading ? (
                      <div className={modalStyles.selectLoading}>Loading repositories...</div>
                    ) : reposError ? (
                      <div className={modalStyles.selectEmpty}>{reposError}</div>
                    ) : filteredRepos.length === 0 ? (
                      <div className={modalStyles.selectEmpty}>
                        {searchQuery ? 'No matching repositories' : 'No repositories found'}
                      </div>
                    ) : (
                      filteredRepos.map(repo => (
                        <div
                          key={repo.id}
                          className={`${modalStyles.selectOption} ${selectedRepo?.id === repo.id ? modalStyles.selected : ''}`}
                          onClick={() => handleRepoSelect(repo)}
                        >
                          <div className={modalStyles.selectOptionName}>
                            {repo.full_name}
                            {repo.private && <span className={modalStyles.privateTag}>Private</span>}
                          </div>
                          {repo.description && (
                            <div className={modalStyles.selectOptionDescription}>{repo.description}</div>
                          )}
                        </div>
                      ))
                    )}
                  </div>,
                  document.body
                )}
            </div>
          </div>
        )}

        {mode === 'new' && (
          <>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="newRepoName">
                Repository Name
              </label>
              <input
                id="newRepoName"
                type="text"
                className={styles.input}
                value={newRepoName}
                onChange={e => setNewRepoName(e.target.value)}
                placeholder="my-project"
              />
              {newRepoName.includes(' ') && (
                <div className={styles.error}>Repository name cannot contain spaces</div>
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="newRepoDesc">
                Description
                <span className={styles.labelHint}>Optional</span>
              </label>
              <input
                id="newRepoDesc"
                type="text"
                className={styles.input}
                value={newRepoDesc}
                onChange={e => setNewRepoDesc(e.target.value)}
                placeholder="A brief description of the repository"
              />
            </div>

            <div className={styles.formGroup}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={e => setIsPrivate(e.target.checked)}
                />
                Make repository private
              </label>
            </div>

            <div className={styles.formGroup}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                <input
                  type="checkbox"
                  checked={initWithReadme}
                  onChange={e => setInitWithReadme(e.target.checked)}
                />
                Initialize with README
              </label>
            </div>
          </>
        )}

        {mode === 'manual' && (
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="manualUrl">
              Git Repository URL
              <span className={styles.labelHint}>HTTPS or SSH URL</span>
            </label>
            <input
              id="manualUrl"
              type="text"
              className={styles.input}
              value={manualUrl}
              onChange={e => setManualUrl(e.target.value)}
              placeholder="https://github.com/username/repo.git"
            />
          </div>
        )}
      </div>

      <div className={styles.footer}>
        <div className={styles.footerLeft}>
          <button type="button" className={styles.cancelButton} onClick={onCancel}>
            Cancel
          </button>
        </div>
        <div className={styles.footerRight}>
          <button type="button" className={styles.backButton} onClick={onBack}>
            Back
          </button>
          <button type="button" className={styles.nextButton} onClick={handleNext} disabled={!canProceed}>
            Next
          </button>
        </div>
      </div>
    </>
  )
}
