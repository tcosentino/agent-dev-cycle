import { useState } from 'react'
import { api, type ApiProject } from '../../api'
import type { WizardData } from './ProjectWizard'
import styles from './ProjectWizard.module.css'

interface Step4Props {
  userId: string
  data: WizardData
  onBack: () => void
  onCancel: () => void
  onProjectCreated: (project: ApiProject) => void
}

type CreationStep = 'idle' | 'creating-project' | 'creating-repo' | 'initializing' | 'starting-agent' | 'done'

export function Step4ReviewLaunch({ userId, data, onBack, onCancel, onProjectCreated }: Step4Props) {
  const [isCreating, setIsCreating] = useState(false)
  const [currentStep, setCurrentStep] = useState<CreationStep>('idle')
  const [error, setError] = useState<string | null>(null)

  const handleCreate = async () => {
    setIsCreating(true)
    setError(null)

    try {
      let repoUrl = data.githubRepo?.html_url || data.manualRepoUrl

      // Step 1: Create GitHub repo if needed
      if (data.createNewRepo) {
        setCurrentStep('creating-repo')
        const { repo } = await api.github.createRepo({
          name: data.createNewRepo.name,
          description: data.createNewRepo.description,
          isPrivate: data.createNewRepo.isPrivate,
          initializeWithReadme: data.createNewRepo.initializeWithReadme,
        })
        repoUrl = repo.html_url
      }

      // Step 2: Create project
      setCurrentStep('creating-project')
      const project = await api.projects.create({
        userId,
        name: data.projectName.trim(),
        key: data.projectKey.toUpperCase().trim(),
        repoUrl,
      })

      // Step 3: Initialize project (AI generation or template)
      if (data.setupMethod) {
        setCurrentStep('initializing')
        // TODO: Call POST /api/projects/:id/initialize endpoint
        // For now, we'll skip this
        console.warn('Project initialization not yet implemented')
      }

      // Step 4: Start first agent session (optional for MVP)
      // setCurrentStep('starting-agent')
      // TODO: Automatically start first agent session

      setCurrentStep('done')
      onProjectCreated(project)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project')
      setCurrentStep('idle')
      setIsCreating(false)
    }
  }

  const getStepMessage = () => {
    switch (currentStep) {
      case 'creating-project':
        return 'Creating project...'
      case 'creating-repo':
        return 'Setting up GitHub repository...'
      case 'initializing':
        return 'Generating PROJECT.md and tasks...'
      case 'starting-agent':
        return 'Starting first agent session...'
      default:
        return ''
    }
  }

  return (
    <>
      <div>
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Review Project</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                Project Name
              </div>
              <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{data.projectName}</div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                Project Key
              </div>
              <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{data.projectKey}</div>
            </div>

            {data.description && (
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                  Description
                </div>
                <div style={{ fontSize: '0.875rem' }}>{data.description}</div>
              </div>
            )}

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                GitHub Repository
              </div>
              <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                {data.githubRepo?.full_name ||
                  (data.createNewRepo ? `New repo: ${data.createNewRepo.name}` : null) ||
                  data.manualRepoUrl ||
                  'None'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                Setup Method
              </div>
              <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                {data.setupMethod === 'ai'
                  ? 'AI-generated PROJECT.md and tasks'
                  : data.setupMethod === 'template'
                    ? `Template: ${data.selectedTemplate}`
                    : 'Manual setup'}
              </div>
            </div>
          </div>
        </div>

        {isCreating && (
          <div
            style={{
              padding: '1rem',
              background: 'var(--bg-secondary)',
              borderRadius: '0.5rem',
              marginBottom: '1rem',
            }}
          >
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{getStepMessage()}</div>
          </div>
        )}

        {error && <div className={styles.error}>{error}</div>}
      </div>

      <div className={styles.footer}>
        <div className={styles.footerLeft}>
          <button type="button" className={styles.cancelButton} onClick={onCancel} disabled={isCreating}>
            Cancel
          </button>
        </div>
        <div className={styles.footerRight}>
          <button type="button" className={styles.backButton} onClick={onBack} disabled={isCreating}>
            Back
          </button>
          <button
            type="button"
            className={styles.submitButton}
            onClick={handleCreate}
            disabled={isCreating}
          >
            {isCreating ? getStepMessage() : 'Create Project'}
          </button>
        </div>
      </div>
    </>
  )
}
