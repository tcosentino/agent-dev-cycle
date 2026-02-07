import { useState } from 'react'
import { api, type CreateAgentSessionInput } from '../../api'
import { XIcon } from '@agentforge/ui-components'
import type { AgentConfig } from '../AgentBrowser'
import styles from './AgentSessionPanel.module.css'

export interface StartAgentSessionModalProps {
  projectId: string
  projectName: string
  agents?: AgentConfig[]
  preselectedAgent?: string
  onClose: () => void
  onSessionCreated: (sessionId: string) => void
}

const defaultAgents = [
  { id: 'pm', displayName: 'PM', model: 'sonnet', maxTokens: 50000 },
  { id: 'engineer', displayName: 'Engineer', model: 'sonnet', maxTokens: 50000 },
  { id: 'qa', displayName: 'QA', model: 'sonnet', maxTokens: 50000 },
  { id: 'lead', displayName: 'Lead', model: 'sonnet', maxTokens: 50000 },
]

const agentDescriptions: Record<string, string> = {
  pm: 'Product Manager - shapes requirements and prioritizes work',
  engineer: 'Implements features and fixes bugs',
  qa: 'Tests and validates functionality',
  lead: 'Reviews architecture and provides guidance',
}

const phases = [
  { value: 'discovery', label: 'Discovery', description: 'Understanding the problem space' },
  { value: 'shaping', label: 'Shaping', description: 'Defining scope and approach' },
  { value: 'building', label: 'Building', description: 'Implementing the solution' },
  { value: 'delivery', label: 'Delivery', description: 'Testing and releasing' },
] as const

export function StartAgentSessionModal({
  projectId,
  projectName,
  agents: providedAgents,
  preselectedAgent,
  onClose,
  onSessionCreated,
}: StartAgentSessionModalProps) {
  const agents = providedAgents || defaultAgents
  const [agent, setAgent] = useState<string>(
    preselectedAgent || agents[0]?.id || 'pm'
  )
  const [phase, setPhase] = useState<CreateAgentSessionInput['phase']>('shaping')
  const [taskPrompt, setTaskPrompt] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!taskPrompt.trim()) {
      setError('Please enter a task prompt')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Create the session
      const session = await api.agentSessions.create({
        projectId,
        agent: agent as CreateAgentSessionInput['agent'],
        phase,
        taskPrompt: taskPrompt.trim(),
      })

      // Start the session
      await api.agentSessions.start(session.id)

      onSessionCreated(session.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start session')
      setIsSubmitting(false)
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Start Agent Session</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <XIcon width={20} height={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalContent}>
          <div className={styles.projectInfo}>
            Project: <strong>{projectName}</strong>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Agent</label>
            <div className={styles.radioGroup}>
              {agents.map(a => (
                <label
                  key={a.id}
                  className={`${styles.radioOption} ${agent === a.id ? styles.selected : ''}`}
                >
                  <input
                    type="radio"
                    name="agent"
                    value={a.id}
                    checked={agent === a.id}
                    onChange={() => setAgent(a.id)}
                    className={styles.radioInput}
                  />
                  <span className={styles.radioLabel}>{a.displayName}</span>
                  <span className={styles.radioDescription}>
                    {agentDescriptions[a.id] || `${a.displayName} agent`}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Phase</label>
            <div className={styles.radioGroup}>
              {phases.map(p => (
                <label
                  key={p.value}
                  className={`${styles.radioOption} ${phase === p.value ? styles.selected : ''}`}
                >
                  <input
                    type="radio"
                    name="phase"
                    value={p.value}
                    checked={phase === p.value}
                    onChange={() => setPhase(p.value)}
                    className={styles.radioInput}
                  />
                  <span className={styles.radioLabel}>{p.label}</span>
                  <span className={styles.radioDescription}>{p.description}</span>
                </label>
              ))}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="taskPrompt">Task Prompt</label>
            <textarea
              id="taskPrompt"
              className={styles.textarea}
              value={taskPrompt}
              onChange={e => setTaskPrompt(e.target.value)}
              placeholder="Describe what you want the agent to do..."
              rows={4}
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
              disabled={isSubmitting || !taskPrompt.trim()}
            >
              {isSubmitting ? 'Starting...' : 'Start Session'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
