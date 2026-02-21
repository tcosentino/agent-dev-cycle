import { useState } from 'react'
import type { WizardData } from './ProjectWizard'
import styles from './ProjectWizard.module.css'

interface Step1Props {
  data: WizardData
  onUpdate: (updates: Partial<WizardData>) => void
  onNext: () => void
  onCancel: () => void
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

export function Step1ProjectBasics({ data, onUpdate, onNext, onCancel }: Step1Props) {
  const [keyManuallyEdited, setKeyManuallyEdited] = useState(false)

  const handleNameChange = (value: string) => {
    onUpdate({ projectName: value })
    // Auto-generate key if not manually edited
    if (!keyManuallyEdited) {
      onUpdate({ projectKey: generateKey(value) })
    }
  }

  const handleKeyChange = (value: string) => {
    setKeyManuallyEdited(true)
    onUpdate({ projectKey: value.toUpperCase().slice(0, 10) })
  }

  const handleNext = () => {
    if (data.projectName.trim() && data.projectKey.trim().length >= 2) {
      onNext()
    }
  }

  const canProceed = data.projectName.trim() && data.projectKey.trim().length >= 2

  return (
    <>
      <div>
        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="projectName">
            Project Name
          </label>
          <input
            id="projectName"
            type="text"
            className={styles.input}
            value={data.projectName}
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
            value={data.projectKey}
            onChange={e => handleKeyChange(e.target.value)}
            placeholder="MAP"
            maxLength={10}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="projectDescription">
            Description
            <span className={styles.labelHint}>Optional - what is this project about?</span>
          </label>
          <textarea
            id="projectDescription"
            className={styles.textarea}
            value={data.description}
            onChange={e => onUpdate({ description: e.target.value })}
            placeholder="A brief description of your project..."
          />
        </div>
      </div>

      <div className={styles.footer}>
        <div className={styles.footerLeft}>
          <button type="button" className={styles.cancelButton} onClick={onCancel}>
            Cancel
          </button>
        </div>
        <div className={styles.footerRight}>
          <button
            type="button"
            className={styles.nextButton}
            onClick={handleNext}
            disabled={!canProceed}
          >
            Next
          </button>
        </div>
      </div>
    </>
  )
}
