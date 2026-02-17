import { useState, useEffect, useRef } from 'react'
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

type TabId = 'overview' | 'stages' | 'results'

export function AgentSessionProgressPanel({
  sessionId,
  onRetry,
}: AgentSessionProgressPanelProps) {
  const { progress, isLoading, error } = useAgentSessionProgress(sessionId)
  const { session: initialSession } = useAgentSession(sessionId)
  const { showToast } = useToast()
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [isRetrying, setIsRetrying] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set())
  const [isUntouched, setIsUntouched] = useState(true)
  const prevStageRef = useRef<string | null>(null)

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
    // Mark as touched when user manually toggles
    setIsUntouched(false)
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

  // Transform stageOutputs to StageOutput[] format for ExecutionLogPanel
  // (Moved before early returns to avoid hook ordering issues)
  const stageOutputsRaw: Record<string, { logs: any[]; duration?: number; completedAt?: Date }> =
    session && 'stageOutputs' in session && session.stageOutputs !== null
      ? session.stageOutputs
      : {} as Record<string, { logs: any[]; duration?: number; completedAt?: Date }>

  const transformedStageOutputs: StageOutput[] = session ? stages.map((stage, idx) => {
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
  }) : []

  // Auto-expand current running stage if view is untouched
  useEffect(() => {
    if (!isUntouched || !session) return

    const currentStage = session.stage
    if (currentStage === prevStageRef.current) return

    prevStageRef.current = currentStage

    // Find the running stage
    const runningStage = transformedStageOutputs.find(s => s.status === 'running')
    if (runningStage) {
      setExpandedStages(new Set([runningStage.stage]))
    }
  }, [session?.stage, transformedStageOutputs, isUntouched])

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
    // Mark as touched when user uses expand/collapse all
    setIsUntouched(false)
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
            <div className={styles.sessionHeaderActions}>
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
            </div>
          </div>

          {/* Tab Navigation */}
          <div className={styles.tabNav}>
            <button
              className={`${styles.tab} ${activeTab === 'overview' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'stages' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('stages')}
            >
              Stages
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'results' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('results')}
              disabled={session.stage !== 'completed'}
            >
              Results
            </button>
          </div>

          {/* Tab Content */}
          <div className={styles.tabContent}>
            {activeTab === 'overview' && (
              <div className={styles.overviewTab}>
                {/* Task Prompt */}
                <div className={styles.sessionInfo}>
                  <h3>Task Prompt</h3>
                  <p className={styles.taskPrompt}>{session.taskPrompt}</p>
                </div>

                {/* Stage Progress Summary */}
                <div className={styles.sessionInfo}>
                  <h3>Progress</h3>
                  <div className={styles.stageProgress}>
                    {stages.map((stage, idx) => {
                      const current = stageIndex[session.stage] ?? -1
                      const isComplete = session.stage === 'completed'
                      const isStageFailed = session.stage === 'failed'

                      let status: 'pending' | 'running' | 'success' | 'failed' = 'pending'
                      if (isStageFailed && idx === current) {
                        status = 'failed'
                      } else if (isComplete || idx < current) {
                        status = 'success'
                      } else if (idx === current) {
                        status = 'running'
                      }

                      return (
                        <div key={stage.key} className={styles.stageProgressItem}>
                          <div className={`${styles.stageStatus} ${styles[`stageStatus-${status}`]}`} />
                          <span>{stage.label}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Summary (if completed) */}
                {session.stage === 'completed' && session.summary && (
                  <div className={styles.sessionInfo}>
                    <h3>Summary</h3>
                    <p className={styles.sessionSummary}>{session.summary}</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'stages' && (
              <div className={styles.stagesTab}>
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
            )}

            {activeTab === 'results' && (
              <div className={styles.resultsTab}>
                {session.stage === 'completed' ? (
                  <>
                    {/* Commit Info */}
                    {session.commitSha && (
                      <div className={styles.sessionInfo}>
                        <h3>Commit</h3>
                        <div className={styles.commitHash}>
                          <GitBranchIcon width={16} height={16} />
                          <code>{session.commitSha}</code>
                        </div>
                      </div>
                    )}

                    {/* Context Files */}
                    {'stageOutputs' in session && session.stageOutputs?.loading?.logs && (
                      (() => {
                        const contextLog = session.stageOutputs.loading.logs.find(
                          (log: any) => log.message.startsWith('Context files')
                        )
                        if (contextLog) {
                          return (
                            <div className={styles.sessionInfo}>
                              <h3>Context Files</h3>
                              <pre className={styles.contextFiles}>{contextLog.message}</pre>
                            </div>
                          )
                        }
                        return null
                      })()
                    )}

                    {/* Summary */}
                    {session.summary && (
                      <div className={styles.sessionInfo}>
                        <h3>Summary</h3>
                        <p className={styles.sessionSummary}>{session.summary}</p>
                      </div>
                    )}

                    {/* Memory Files Section */}
                    <div className={styles.sessionInfo}>
                      <h3>Memory & Artifacts</h3>
                      <p className={styles.helpText}>
                        Session artifacts (notepad, transcript, etc.) are saved in the repository under:
                      </p>
                      <code className={styles.pathDisplay}>sessions/{session.agent}/{session.sessionId}/</code>
                      <p className={styles.helpText}>
                        View these files in your repository to see the agent's working notes and conversation history.
                      </p>
                    </div>
                  </>
                ) : (
                  <div className={styles.emptyState}>
                    Results will be available when the session completes.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
