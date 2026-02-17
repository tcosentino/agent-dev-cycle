import { useState } from 'react'
import { useAgentSessionProgress, useAgentSession } from '../../hooks'
import { api, cancelAgentSession } from '../../api'
import {
  Spinner,
  GitBranchIcon,
  ClipboardIcon,
  ChevronDownIcon,
  ConfirmDialog,
  useToast,
  ExecutionLogPanel,
  ExecutionHeader,
  ExecutionControls,
  type StageOutput,
} from '@agentforge/ui-components'
import styles from './AgentSessionPanel.module.css'

export interface AgentSessionProgressPanelProps {
  sessionId: string
  onClose?: () => void
  onRetry?: (newSessionId: string) => void
}

const stages = [
  { key: 'cloning', label: 'Clone' },
  { key: 'loading', label: 'Load' },
  { key: 'executing', label: 'Execute' },
  { key: 'capturing', label: 'Capture' },
  { key: 'committing', label: 'Commit' },
] as const

const stageIndex: Record<string, number> = {
  pending: -1,
  cloning: 0,
  loading: 1,
  executing: 2,
  capturing: 3,
  committing: 4,
  completed: 5,
  failed: -2,
}


export function AgentSessionProgressPanel({
  sessionId,
  onRetry,
}: AgentSessionProgressPanelProps) {
  const { progress, isLoading, error } = useAgentSessionProgress(sessionId)
  const { session: initialSession } = useAgentSession(sessionId)
  const { showToast } = useToast()
  const [isRetrying, setIsRetrying] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set())

  const handleRetry = async () => {
    if (!sessionId || !onRetry) return
    setIsRetrying(true)
    try {
      const newSession = await api.agentSessions.retry(sessionId)
      showToast({ type: 'info', title: 'Session retried', message: `Started retry as ${newSession.sessionId}`, duration: 3000 })
      // Navigate to new session immediately, then start it
      onRetry(newSession.id)
      // Start the session after navigation (fire and forget)
      api.agentSessions.start(newSession.id).catch(err => {
        console.error('Failed to start retry session:', err)
        showToast({ type: 'error', title: 'Failed to start session', message: err instanceof Error ? err.message : 'Unknown error' })
      })
    } catch (err) {
      console.error('Failed to create retry session:', err)
      showToast({ type: 'error', title: 'Failed to retry session', message: err instanceof Error ? err.message : 'Unknown error' })
      setIsRetrying(false)
    }
  }

  const handleCancelClick = () => {
    setShowCancelDialog(true)
  }

  const handleCancelConfirm = async () => {
    setShowCancelDialog(false)
    setIsCancelling(true)
    try {
      await cancelAgentSession(sessionId)
      showToast({ type: 'info', title: 'Session cancelled', duration: 3000 })
    } catch (err) {
      console.error('Failed to cancel session:', err)
      showToast({ type: 'error', title: 'Failed to cancel session', message: err instanceof Error ? err.message : 'Unknown error' })
    } finally {
      setIsCancelling(false)
    }
  }

  const handleToggleStage = (stage: string) => {
    setExpandedStages(prev => {
      const next = new Set(prev)
      if (next.has(stage)) {
        next.delete(stage)
      } else {
        next.add(stage)
      }
      return next
    })
  }

  // Use progress from SSE if connected, otherwise use initial session data
  const session = progress || initialSession

  if (isLoading && !session) {
    return (
      <div className={styles.panel}>
        <div className={styles.loadingState}>
          <Spinner />
        </div>
      </div>
    )
  }

  if (error && !session) {
    return (
      <div className={styles.panel}>
        <div className={styles.errorState}>
          {error}
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className={styles.panel}>
        <div className={styles.errorState}>
          Session not found
        </div>
      </div>
    )
  }

  const stageOutputsRaw: Record<string, { logs: any[]; duration?: number; completedAt?: Date }> =
    ('stageOutputs' in session && session.stageOutputs !== null ? session.stageOutputs : {}) as Record<string, { logs: any[]; duration?: number; completedAt?: Date }>

  // Transform stageOutputs to StageOutput[] format for ExecutionLogPanel
  const transformedStageOutputs: StageOutput[] = stages.map((stage, idx) => {
    const current = stageIndex[session.stage] ?? -1
    const isComplete = session.stage === 'completed'
    const isFailed = session.stage === 'failed'

    let status: 'pending' | 'running' | 'success' | 'failed' = 'pending'
    if (isFailed && idx === current) {
      status = 'failed'
    } else if (isComplete || idx < current) {
      status = 'success'
    } else if (idx === current) {
      status = 'running'
    }

    const stageData = stageOutputsRaw[stage.key]
    return {
      stage: stage.label,
      status,
      duration: stageData?.duration,
      completedAt: stageData?.completedAt instanceof Date
        ? stageData.completedAt.toISOString()
        : stageData?.completedAt,
      logs: stageData?.logs || [],
      error: status === 'failed' && session.error ? session.error : undefined,
    }
  })

  const handleCopyLogs = async () => {
    const logText = transformedStageOutputs
      .map(stage => {
        const logs = stage.logs.map((l: any) => l.message).join('\n')
        const error = stage.error || ''
        return `[${stage.stage}]\n${logs}${error ? '\nError: ' + error : ''}`
      })
      .join('\n\n')

    try {
      await navigator.clipboard.writeText(logText)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      console.error('Failed to copy logs:', err)
    }
  }

  const toggleAllStages = () => {
    if (expandedStages.size === transformedStageOutputs.length) {
      setExpandedStages(new Set())
    } else {
      setExpandedStages(new Set(transformedStageOutputs.map(s => s.stage)))
    }
  }

  const isFailed = session.stage === 'failed' || session.stage === 'cancelled'

  return (
    <div className={styles.panel}>
      <ConfirmDialog
        isOpen={showCancelDialog}
        title="Cancel session?"
        message="This will stop the agent. Completed work will be preserved."
        confirmLabel="Cancel Session"
        cancelLabel="Keep Running"
        variant="danger"
        onConfirm={handleCancelConfirm}
        onCancel={() => setShowCancelDialog(false)}
      />

      <div className={styles.panelLayout}>
        <div className={styles.panelMain}>
          {/* Session Details Header */}
          <div className={styles.sessionDetailHeader}>
            <div>
              <h2 className={styles.sessionDetailTitle}>Agent Session</h2>
              <div className={styles.sessionMeta}>
                <span className={styles.sessionMetaItem}>
                  <strong>Agent:</strong> {session.agent}
                </span>
                <span className={styles.sessionMetaItem}>
                  <strong>Phase:</strong> {session.phase}
                </span>
              </div>
            </div>
          </div>

          {/* Status Header with Controls */}
          <ExecutionHeader
            status={session.stage === 'cancelling' ? 'Cancelling...' : session.stage === 'cancelled' ? 'Cancelled' : session.stage}
            error={isFailed ? session.error : undefined}
            actions={
              <ExecutionControls
                mode="job"
                status={session.stage}
                onCancel={handleCancelClick}
                onRetry={handleRetry}
                isCancelling={isCancelling || session.stage === 'cancelling'}
                isRetrying={isRetrying}
              />
            }
          />

          {/* Task Prompt & Result Section */}
          <div className={styles.sessionInfo}>
            <h3>Task Prompt</h3>
            <p className={styles.taskPrompt}>{'taskPrompt' in session ? session.taskPrompt : 'Loading...'}</p>

            {session.stage === 'completed' && (
              <>
                {session.summary && (
                  <>
                    <h3>Summary</h3>
                    <p className={styles.sessionSummary}>{session.summary}</p>
                  </>
                )}
                {session.commitSha && (
                  <div className={styles.commitInfo}>
                    <h3>Commit</h3>
                    <div className={styles.commitHash}>
                      <GitBranchIcon width={16} height={16} />
                      <code>{session.commitSha}</code>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Session Stages with Logs */}
          <div className={styles.sessionStageDetails}>
            <div className={styles.stageDetailsHeader}>
              <h3>Session Stages</h3>
              <button
                className={styles.copyLogsButton}
                onClick={toggleAllStages}
                title={expandedStages.size === transformedStageOutputs.length ? 'Collapse all stages' : 'Expand all stages'}
              >
                <ChevronDownIcon />
                <span>{expandedStages.size === transformedStageOutputs.length ? 'Collapse All' : 'Expand All'}</span>
              </button>
              <button
                className={styles.copyLogsButton}
                onClick={handleCopyLogs}
                title="Copy all logs to clipboard"
              >
                <ClipboardIcon />
                <span>{copySuccess ? 'Copied!' : 'Copy All Logs'}</span>
              </button>
            </div>
            <ExecutionLogPanel
              stageOutputs={transformedStageOutputs}
              expandedStages={expandedStages}
              onToggleStage={handleToggleStage}
              autoScroll={true}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
