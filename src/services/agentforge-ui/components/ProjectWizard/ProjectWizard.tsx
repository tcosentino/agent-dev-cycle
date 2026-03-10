import { useState, useEffect } from 'react'
import { Modal } from '@agentforge/ui-components'
import type { ApiProject } from '../../api'
import { Step1ProjectBasics } from './Step1ProjectBasics'
import { Step2GitHubRepo } from './Step2GitHubRepo'
import { Step3InitialSetup } from './Step3InitialSetup'
import { Step4ReviewLaunch } from './Step4ReviewLaunch'
import styles from './ProjectWizard.module.css'

export interface ProjectWizardProps {
  userId: string
  onClose: () => void
  onProjectCreated: (project: ApiProject) => void
}

export interface WizardData {
  // Step 1
  projectName: string
  projectKey: string
  description: string

  // Step 2
  githubRepo?: {
    id: number
    full_name: string
    html_url: string
    clone_url: string
    default_branch: string
  }
  createNewRepo?: {
    name: string
    description: string
    isPrivate: boolean
    initializeWithReadme: boolean
  }
  manualRepoUrl?: string

  // Step 3
  setupMethod: 'ai' | 'template' | null
  projectDescription?: string
  selectedTemplate?: string
  generatedProjectMd?: string
  generatedTasks?: Array<{ title: string; description: string; type: string }>
}

const DRAFT_KEY = 'agentforge_project_wizard_draft'
const DRAFT_EXPIRY_MS = 24 * 60 * 60 * 1000 // 24 hours

export function ProjectWizard({ userId, onClose, onProjectCreated }: ProjectWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [wizardData, setWizardData] = useState<WizardData>(() => {
    // Try to restore from localStorage
    const draft = localStorage.getItem(DRAFT_KEY)
    if (draft) {
      try {
        const parsed = JSON.parse(draft)
        const age = Date.now() - parsed.timestamp
        if (age < DRAFT_EXPIRY_MS) {
          return parsed.data
        }
      } catch {
        // Invalid draft, ignore
      }
    }
    return {
      projectName: '',
      projectKey: '',
      description: '',
      setupMethod: null,
    }
  })

  // Save draft to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({
        data: wizardData,
        timestamp: Date.now(),
      })
    )
  }, [wizardData])

  // Clear draft on unmount or successful creation
  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY)
  }

  const updateWizardData = (updates: Partial<WizardData>) => {
    setWizardData(prev => ({ ...prev, ...updates }))
  }

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleCancel = () => {
    const confirmed = window.confirm('Discard project creation?')
    if (confirmed) {
      clearDraft()
      onClose()
    }
  }

  const handleProjectCreated = (project: ApiProject) => {
    clearDraft()
    onProjectCreated(project)
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1ProjectBasics
            data={wizardData}
            onUpdate={updateWizardData}
            onNext={handleNext}
            onCancel={handleCancel}
          />
        )
      case 2:
        return (
          <Step2GitHubRepo
            data={wizardData}
            onUpdate={updateWizardData}
            onNext={handleNext}
            onBack={handleBack}
            onCancel={handleCancel}
          />
        )
      case 3:
        return (
          <Step3InitialSetup
            data={wizardData}
            onUpdate={updateWizardData}
            onNext={handleNext}
            onBack={handleBack}
            onCancel={handleCancel}
          />
        )
      case 4:
        return (
          <Step4ReviewLaunch
            userId={userId}
            data={wizardData}
            onBack={handleBack}
            onCancel={handleCancel}
            onProjectCreated={handleProjectCreated}
          />
        )
      default:
        return null
    }
  }

  return (
    <Modal
      title={
        <div className={styles.header}>
          <span>Create Project</span>
          <span className={styles.progress}>Step {currentStep} of 4</span>
        </div>
      }
      onClose={handleCancel}
    >
      <div className={styles.wizard}>
        <div className={styles.progressBar}>
          {[1, 2, 3, 4].map(step => (
            <div
              key={step}
              className={`${styles.progressStep} ${step <= currentStep ? styles.active : ''}`}
            >
              <div className={styles.progressCircle}>{step}</div>
              <div className={styles.progressLabel}>
                {step === 1 && 'Basics'}
                {step === 2 && 'GitHub'}
                {step === 3 && 'Setup'}
                {step === 4 && 'Review'}
              </div>
            </div>
          ))}
        </div>
        <div className={styles.stepContent}>{renderStep()}</div>
      </div>
    </Modal>
  )
}
