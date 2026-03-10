import { useState } from 'react'
import type { WizardData } from './ProjectWizard'
import styles from './ProjectWizard.module.css'

interface Step3Props {
  data: WizardData
  onUpdate: (updates: Partial<WizardData>) => void
  onNext: () => void
  onBack: () => void
  onCancel: () => void
}

const TEMPLATES = [
  {
    id: 'todo-app',
    name: 'Todo App',
    description: 'Task management with priorities and due dates',
  },
  {
    id: 'rest-api',
    name: 'REST API Server',
    description: 'Backend API with database and authentication',
  },
  {
    id: 'dashboard',
    name: 'Admin Dashboard',
    description: 'Management interface with charts and tables',
  },
  {
    id: 'component-library',
    name: 'Component Library',
    description: 'Reusable React components with Storybook',
  },
]

export function Step3InitialSetup({ data, onUpdate, onNext, onBack, onCancel }: Step3Props) {
  const [mode, setMode] = useState<'ai' | 'template'>(data.setupMethod || 'ai')
  const [description, setDescription] = useState(data.projectDescription || '')
  const [selectedTemplate, setSelectedTemplate] = useState(data.selectedTemplate || '')

  const handleNext = () => {
    if (mode === 'ai' && description.trim()) {
      onUpdate({
        setupMethod: 'ai',
        projectDescription: description.trim(),
        selectedTemplate: undefined,
      })
      onNext()
    } else if (mode === 'template' && selectedTemplate) {
      onUpdate({
        setupMethod: 'template',
        selectedTemplate,
        projectDescription: undefined,
      })
      onNext()
    }
  }

  const canProceed = (mode === 'ai' && description.trim()) || (mode === 'template' && selectedTemplate)

  return (
    <>
      <div>
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <button
              type="button"
              className={`${styles.button} ${mode === 'ai' ? styles.nextButton : styles.backButton}`}
              onClick={() => setMode('ai')}
            >
              Describe Project
            </button>
            <button
              type="button"
              className={`${styles.button} ${mode === 'template' ? styles.nextButton : styles.backButton}`}
              onClick={() => setMode('template')}
            >
              Use Template
            </button>
          </div>
        </div>

        {mode === 'ai' && (
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="projectDesc">
              What do you want to build?
              <span className={styles.labelHint}>
                Describe your project and we'll generate a PROJECT.md and initial tasks
              </span>
            </label>
            <textarea
              id="projectDesc"
              className={styles.textarea}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="A task management app with priority levels, due dates, and tagging system..."
              rows={6}
            />
          </div>
        )}

        {mode === 'template' && (
          <div>
            <label className={styles.label}>
              Choose a Template
              <span className={styles.labelHint}>Pre-configured project structure and tasks</span>
            </label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '1rem',
                marginTop: '1rem',
              }}
            >
              {TEMPLATES.map(template => (
                <div
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                  style={{
                    padding: '1rem',
                    border: `2px solid ${selectedTemplate === template.id ? 'var(--accent-blue)' : 'var(--border-color)'}`,
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    background:
                      selectedTemplate === template.id ? 'var(--accent-blue-faded)' : 'var(--bg-secondary)',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      marginBottom: '0.5rem',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {template.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {template.description}
                  </div>
                </div>
              ))}
            </div>
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
