import { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
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
import { PanelLayout } from '../PanelLayout'
import { SectionCard } from '../SectionCard'
import styles from './AgentSessionPanel.module.css'

export interface AgentSessionProgressPanelProps {
  sessionId: string
  onClose?: () => void
  onRetry?: (newSessionId: string) => void
  initialTab?: TabId
  onTabChange?: (tab: TabId) => void
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

// ---- Transcript parsing ----

interface AgentForgeAction {
  type: 'task' | 'message' | 'other'
  method: string
  endpoint: string
  payload?: Record<string, unknown>
  timestamp?: string
}

function parseTranscriptForActions(jsonl: string): AgentForgeAction[] {
  const actions: AgentForgeAction[] = []
  const lines = jsonl.split('\n').filter(l => l.trim())

  for (const line of lines) {
    try {
      const entry = JSON.parse(line)
      const msg = entry.message
      if (!msg || typeof msg !== 'object') continue
      const content = msg.content
      if (!Array.isArray(content)) continue

      for (const block of content) {
        if (block.type !== 'tool_use' || block.name !== 'Bash') continue
        const cmd: string = block.input?.command || ''

        // Match agentforge CLI commands
        const afMatch = cmd.match(/agentforge\s+task\s+(create|update|delete|comment)\s+(.*)/)
        if (afMatch) {
          const subcommand = afMatch[1]
          const rest = afMatch[2].trim()

          if (subcommand === 'create') {
            // agentforge task create "<title>" [--type x] [--priority y] [--assignee z]
            const titleMatch = rest.match(/^["']?([^"']+?)["']?\s*(?:--|$)/)
            const typeMatch = rest.match(/--type\s+(\S+)/)
            const priorityMatch = rest.match(/--priority\s+(\S+)/)
            const assigneeMatch = rest.match(/--assignee\s+(\S+)/)
            const payload: Record<string, unknown> = { title: titleMatch?.[1]?.trim() }
            if (typeMatch) payload.type = typeMatch[1]
            if (priorityMatch) payload.priority = priorityMatch[1]
            if (assigneeMatch) payload.assignee = assigneeMatch[1]
            actions.push({ type: 'task', method: 'POST', endpoint: '/api/tasks', payload, timestamp: entry.timestamp })
          } else if (subcommand === 'update') {
            // agentforge task update <key> [--status x] [--assignee y]
            const keyMatch = rest.match(/^(\S+)/)
            const statusMatch = rest.match(/--status\s+(\S+)/)
            const assigneeMatch = rest.match(/--assignee\s+(\S+)/)
            const payload: Record<string, unknown> = { key: keyMatch?.[1] }
            if (statusMatch) payload.status = statusMatch[1]
            if (assigneeMatch) payload.assignee = assigneeMatch[1]
            actions.push({ type: 'task', method: 'PATCH', endpoint: '/api/tasks', payload, timestamp: entry.timestamp })
          } else if (subcommand === 'delete') {
            const keyMatch = rest.match(/^(\S+)/)
            actions.push({ type: 'task', method: 'DELETE', endpoint: '/api/tasks', payload: { key: keyMatch?.[1] }, timestamp: entry.timestamp })
          } else if (subcommand === 'comment') {
            const addMatch = rest.match(/^add\s+(\S+)\s+["']?(.+?)["']?$/)
            if (addMatch) {
              actions.push({ type: 'task', method: 'POST', endpoint: '/api/taskComments', payload: { key: addMatch[1], content: addMatch[2] }, timestamp: entry.timestamp })
            }
          }
          continue
        }

        // Match agentforge chat post
        const chatMatch = cmd.match(/agentforge\s+chat\s+post\s+["']?(.+?)["']?$/)
        if (chatMatch) {
          actions.push({ type: 'message', method: 'POST', endpoint: '/api/messages', payload: { content: chatMatch[1] }, timestamp: entry.timestamp })
          continue
        }

        // Match curl -X POST/PATCH to /api/* endpoints
        const methodMatch = cmd.match(/curl\s+.*?(?:-X\s+(\w+)|--request\s+(\w+))/s)
        const urlMatch = cmd.match(/https?:\/\/[^\s'"]+\/api\/(\w+)/)
        if (!urlMatch) continue

        const resource = urlMatch[1]
        const method = methodMatch?.[1] || methodMatch?.[2] || 'GET'
        if (!['POST', 'PATCH', 'PUT'].includes(method.toUpperCase())) continue

        let type: AgentForgeAction['type'] = 'other'
        if (resource === 'tasks') type = 'task'
        else if (resource === 'messages') type = 'message'

        let payload: Record<string, unknown> | undefined
        const dataMatch = cmd.match(/-d\s+'({[^']+})'/) || cmd.match(/-d\s+"({[^"]+})"/)
        if (dataMatch) {
          try { payload = JSON.parse(dataMatch[1]) } catch { /* ignore */ }
        }

        actions.push({ type, method: method.toUpperCase(), endpoint: `/api/${resource}`, payload, timestamp: entry.timestamp })
      }
    } catch { /* skip malformed lines */ }
  }

  return actions
}

function getActionLabel(action: AgentForgeAction): string {
  const p = action.payload
  if (action.type === 'task') {
    if (p?.title) return String(p.title)
    if (p?.key && p?.status) return `${p.key} → ${p.status}`
    if (p?.key && p?.content) return `${p.key}: ${String(p.content).slice(0, 60)}`
    if (p?.key) return String(p.key)
  }
  if (action.type === 'message' && p?.content) return String(p.content).slice(0, 80)
  return action.endpoint
}

// ---- Component ----

export function AgentSessionProgressPanel({
  sessionId,
  onRetry,
  initialTab,
  onTabChange,
}: AgentSessionProgressPanelProps) {
  const { progress, isLoading, error } = useAgentSessionProgress(sessionId)
  const { session: initialSession } = useAgentSession(sessionId)
  const { showToast } = useToast()
  const [activeTab, setActiveTab] = useState<TabId>(initialTab ?? 'overview')

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab)
    onTabChange?.(tab)
  }

  const [isRetrying, setIsRetrying] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set())
  const [isUntouched, setIsUntouched] = useState(true)
  const prevStageRef = useRef<string | null>(null)

  // Artifact state
  const [notepad, setNotepad] = useState<string | null>(null)
  const [transcript, setTranscript] = useState<string | null>(null)
  const [changedFiles, setChangedFiles] = useState<Array<{ path: string; status: 'added' | 'modified' | 'deleted' }>>([])
  const [agentForgeActions, setAgentForgeActions] = useState<AgentForgeAction[]>([])
  const [artifactsLoaded, setArtifactsLoaded] = useState(false)
  const [commitTab, setCommitTab] = useState<'files' | 'notepad' | 'transcript'>('files')

  // Elapsed time counter — uses progress (live) or initialSession (static) for timing data
  const [elapsedMs, setElapsedMs] = useState(0)
  const timerSession = progress || initialSession
  const timerStartedAt = timerSession?.startedAt
  const timerCompletedAt = (timerSession as any)?.completedAt
  const timerStage = timerSession?.stage
  useEffect(() => {
    const startTime = timerStartedAt ? new Date(timerStartedAt).getTime() : null
    if (!startTime) return
    const isRunning = timerStage !== 'completed' && timerStage !== 'failed' && timerStage !== 'cancelled'
    if (!isRunning) {
      const endTime = timerCompletedAt ? new Date(timerCompletedAt).getTime() : Date.now()
      setElapsedMs(endTime - startTime)
      return
    }
    setElapsedMs(Date.now() - startTime)
    const interval = setInterval(() => setElapsedMs(Date.now() - startTime), 1000)
    return () => clearInterval(interval)
  }, [timerStartedAt, timerCompletedAt, timerStage])

  const handleRetry = async () => {
    if (!sessionId || !onRetry) return
    setIsRetrying(true)
    try {
      const newSession = await api.agentSessions.retry(sessionId)
      showToast({ type: 'info', title: 'Session retried', message: `Started retry as ${newSession.sessionId}`, duration: 3000 })
      onRetry(newSession.id)
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

  const handleCancelClick = () => setShowCancelDialog(true)

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
    setIsUntouched(false)
    setExpandedStages(prev => {
      const next = new Set(prev)
      if (next.has(stage)) next.delete(stage)
      else next.add(stage)
      return next
    })
  }

  const session = progress || initialSession

  const stageOutputsRaw: Record<string, { logs: any[]; duration?: number; completedAt?: Date }> =
    session && 'stageOutputs' in session && session.stageOutputs !== null
      ? session.stageOutputs
      : {} as Record<string, { logs: any[]; duration?: number; completedAt?: Date }>

  const transformedStageOutputs: StageOutput[] = session ? stages.map((stage, idx) => {
    const current = stageIndex[session.stage] ?? -1
    const isComplete = session.stage === 'completed'
    const isFailed = session.stage === 'failed'

    let status: 'pending' | 'running' | 'success' | 'failed' = 'pending'
    if (isFailed && idx === current) status = 'failed'
    else if (isComplete || idx < current) status = 'success'
    else if (idx === current) status = 'running'

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

  useEffect(() => {
    if (!isUntouched || !session) return
    const currentStage = session.stage
    if (currentStage === prevStageRef.current) return
    prevStageRef.current = currentStage
    const runningStage = transformedStageOutputs.find(s => s.status === 'running')
    if (runningStage) setExpandedStages(new Set([runningStage.stage]))
  }, [session?.stage, transformedStageOutputs, isUntouched])

  // Load artifacts when on results tab and session is completed
  useEffect(() => {
    if (activeTab !== 'results' || !session || session.stage !== 'completed' || artifactsLoaded) return
    setArtifactsLoaded(true)

    Promise.all([
      api.agentSessions.getFile(sessionId, 'notepad.md').catch(() => null),
      api.agentSessions.getFile(sessionId, 'transcript.jsonl').catch(() => null),
      api.agentSessions.getChangedFiles(sessionId).catch(() => null),
    ]).then(([notepadRes, transcriptRes, changedFilesRes]) => {
      if (notepadRes?.content) setNotepad(notepadRes.content)
      if (transcriptRes?.content) {
        setTranscript(transcriptRes.content)
        setAgentForgeActions(parseTranscriptForActions(transcriptRes.content))
      }
      if (changedFilesRes?.files) setChangedFiles(changedFilesRes.files)
    })
  }, [activeTab, session?.stage, sessionId, artifactsLoaded])

  if (isLoading && !session) {
    return (
      <div className={styles.panel}>
        <div className={styles.loadingState}><Spinner /></div>
      </div>
    )
  }

  if (error && !session) {
    return (
      <div className={styles.panel}>
        <div className={styles.errorState}>{error}</div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className={styles.panel}>
        <div className={styles.errorState}>Session not found</div>
      </div>
    )
  }

  const handleCopyLogs = async () => {
    const logText = transformedStageOutputs
      .map(stage => {
        const logs = stage.logs.map((l: any) => l.message).join('\n')
        const err = stage.error || ''
        return `[${stage.stage}]\n${logs}${err ? '\nError: ' + err : ''}`
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
    setIsUntouched(false)
    if (expandedStages.size === transformedStageOutputs.length) {
      setExpandedStages(new Set())
    } else {
      setExpandedStages(new Set(transformedStageOutputs.map(s => s.stage)))
    }
  }

  const isFailed = session.stage === 'failed' || session.stage === 'cancelled'

  const sessionTabs = [
    { id: 'overview' as TabId, label: 'Overview' },
    { id: 'stages' as TabId, label: 'Stages' },
    { id: 'results' as TabId, label: 'Results', disabled: session.stage !== 'completed' },
  ]

  // Format elapsed time as m:ss or h:mm:ss
  const formatElapsed = (ms: number): string => {
    const totalSecs = Math.floor(ms / 1000)
    const h = Math.floor(totalSecs / 3600)
    const m = Math.floor((totalSecs % 3600) / 60)
    const s = totalSecs % 60
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    return `${m}:${String(s).padStart(2, '0')}`
  }

  // Filter out session-internal files from changed files list
  const SESSION_FILES = new Set(['notepad.md', 'transcript.jsonl'])
  const displayedFiles = changedFiles.filter(f => !SESSION_FILES.has(f.path.split('/').pop() || ''))

  return (
    <>
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

      <PanelLayout
        title="Agent Session"
        headerActions={
          <>
            {elapsedMs > 0 && (
              <span className={styles.elapsedTime}>{formatElapsed(elapsedMs)}</span>
            )}
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
          </>
        }
        tabs={sessionTabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      >
        {activeTab === 'overview' && (
          <div className={styles.overviewTab}>
            <SectionCard title="Task Prompt" className={styles.resultSection}>
              <p className={styles.taskPrompt}>{session.taskPrompt}</p>
            </SectionCard>

            <SectionCard title="Progress" className={styles.resultSection}>
              <div className={styles.stageTimeline}>
                {stages.map((stage, idx) => {
                  const current = stageIndex[session.stage] ?? -1
                  const isComplete = session.stage === 'completed'
                  const isStageFailed = session.stage === 'failed'

                  let status: 'pending' | 'running' | 'success' | 'failed' = 'pending'
                  if (isStageFailed && idx === current) status = 'failed'
                  else if (isComplete || idx < current) status = 'success'
                  else if (idx === current) status = 'running'

                  return (
                    <div key={stage.key} className={styles.stageTimelineItem}>
                      <div className={styles.stageTimelineTrack}>
                        <div className={`${styles.stageTimelineCircle} ${styles[`stageCircle-${status}`]}`} />
                        {idx < stages.length - 1 && (
                          <div className={`${styles.stageTimelineConnector} ${status === 'success' ? styles.connectorDone : styles.connectorPending}`} />
                        )}
                      </div>
                      <span className={`${styles.stageTimelineLabel} ${styles[`stageLabel-${status}`]}`}>
                        {stage.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </SectionCard>

            {session.tokenUsage && (
              <SectionCard title="Token Usage" className={styles.resultSection}>
                <div className={styles.metricsGrid}>
                  <div className={styles.metricItem}>
                    <span className={styles.metricLabel}>Input</span>
                    <span className={styles.metricValue}>{session.tokenUsage.inputTokens.toLocaleString()}</span>
                  </div>
                  <div className={styles.metricItem}>
                    <span className={styles.metricLabel}>Output</span>
                    <span className={styles.metricValue}>{session.tokenUsage.outputTokens.toLocaleString()}</span>
                  </div>
                  {session.tokenUsage.cacheReadTokens > 0 && (
                    <div className={styles.metricItem}>
                      <span className={styles.metricLabel}>Cache Read</span>
                      <span className={styles.metricValue}>{session.tokenUsage.cacheReadTokens.toLocaleString()}</span>
                    </div>
                  )}
                  {session.tokenUsage.cacheWriteTokens > 0 && (
                    <div className={styles.metricItem}>
                      <span className={styles.metricLabel}>Cache Write</span>
                      <span className={styles.metricValue}>{session.tokenUsage.cacheWriteTokens.toLocaleString()}</span>
                    </div>
                  )}
                  <div className={`${styles.metricItem} ${styles.metricItemTotal}`}>
                    <span className={styles.metricLabel}>Total</span>
                    <span className={styles.metricValue}>{session.tokenUsage.totalTokens.toLocaleString()}</span>
                  </div>
                  {session.tokenUsage.totalCostUsd !== undefined && (
                    <div className={styles.metricItem}>
                      <span className={styles.metricLabel}>Cost</span>
                      <span className={styles.metricValue}>${session.tokenUsage.totalCostUsd.toFixed(4)}</span>
                    </div>
                  )}
                </div>
              </SectionCard>
            )}

            {session.resourceMetrics && session.resourceMetrics.snapshots.length > 0 && (
              <SectionCard title="Container Resources" className={styles.resultSection}>
                <div className={styles.metricsGrid}>
                  {session.resourceMetrics.peakCpuPercent !== undefined && (
                    <div className={styles.metricItem}>
                      <span className={styles.metricLabel}>Peak CPU</span>
                      <span className={styles.metricValue}>{session.resourceMetrics.peakCpuPercent.toFixed(1)}%</span>
                    </div>
                  )}
                  {session.resourceMetrics.avgCpuPercent !== undefined && (
                    <div className={styles.metricItem}>
                      <span className={styles.metricLabel}>Avg CPU</span>
                      <span className={styles.metricValue}>{session.resourceMetrics.avgCpuPercent.toFixed(1)}%</span>
                    </div>
                  )}
                  {session.resourceMetrics.peakMemoryMb !== undefined && (
                    <div className={styles.metricItem}>
                      <span className={styles.metricLabel}>Peak Memory</span>
                      <span className={styles.metricValue}>{session.resourceMetrics.peakMemoryMb.toFixed(0)} MB</span>
                    </div>
                  )}
                  {session.resourceMetrics.avgMemoryMb !== undefined && (
                    <div className={styles.metricItem}>
                      <span className={styles.metricLabel}>Avg Memory</span>
                      <span className={styles.metricValue}>{session.resourceMetrics.avgMemoryMb.toFixed(0)} MB</span>
                    </div>
                  )}
                </div>
              </SectionCard>
            )}

            {session.stage === 'completed' && session.summary && (
              <SectionCard title="Summary" className={styles.resultSection}>
                <div className={styles.markdownContent}><ReactMarkdown remarkPlugins={[remarkGfm]}>{session.summary}</ReactMarkdown></div>
              </SectionCard>
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
                {/* Summary */}
                {session.summary && (
                  <SectionCard title="Summary" className={styles.resultSection}>
                    <div className={styles.markdownContent}><ReactMarkdown remarkPlugins={[remarkGfm]}>{session.summary}</ReactMarkdown></div>
                  </SectionCard>
                )}

                {/* AgentForge Actions */}
                {agentForgeActions.length > 0 && (
                  <SectionCard title="AgentForge Actions" className={styles.resultSection}>
                    <div className={styles.actionsList}>
                      {agentForgeActions.map((action, i) => (
                        <div key={i} className={`${styles.actionBadge} ${styles[`actionBadge-${action.type}`]}`}>
                          <span className={styles.actionMethod}>{action.method}</span>
                          <span className={styles.actionLabel}>{getActionLabel(action)}</span>
                        </div>
                      ))}
                    </div>
                  </SectionCard>
                )}

                {/* Commit — tabs for Files / Notepad / Transcript */}
                {session.commitSha && (
                  <SectionCard
                    title={
                      <span className={styles.commitCardTitle}>
                        <GitBranchIcon width={14} height={14} />
                        Commit
                      </span>
                    }
                    headerMeta={<code className={styles.commitHashCode}>{session.commitSha.slice(0, 7)}</code>}
                    tabs={[
                      { id: 'files' as const, label: `Files${displayedFiles.length > 0 ? ` (${displayedFiles.length})` : ''}` },
                      { id: 'notepad' as const, label: 'Notepad', disabled: !notepad },
                      { id: 'transcript' as const, label: 'Transcript', disabled: !transcript },
                    ]}
                    activeTab={commitTab}
                    onTabChange={setCommitTab}
                    className={styles.resultSection}
                  >
                    {commitTab === 'files' && (
                      displayedFiles.length > 0 ? (
                        <div className={styles.changedFiles}>
                          {displayedFiles.map((f, i) => (
                            <span
                              key={i}
                              className={`${styles.fileBadge} ${styles[`fileBadge-${f.status}`]}`}
                              title={f.path}
                            >
                              <span className={styles.fileBadgeStatus}>{f.status === 'added' ? 'A' : f.status === 'deleted' ? 'D' : 'M'}</span>
                              <span className={styles.fileBadgePath}>{f.path.split('/').pop()}</span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className={styles.emptyState}>No changed files recorded.</p>
                      )
                    )}

                    {commitTab === 'notepad' && notepad && (
                      <div className={styles.markdownContent}><ReactMarkdown remarkPlugins={[remarkGfm]}>{notepad}</ReactMarkdown></div>
                    )}

                    {commitTab === 'transcript' && transcript && (
                      <div className={styles.transcriptViewer}>
                        {transcript.split('\n').filter(l => l.trim()).map((line, i) => {
                          try {
                            const entry = JSON.parse(line)
                            const msg = entry.message
                            if (!msg || typeof msg !== 'object') return null
                            const role: string = msg.role || ''
                            if (!['user', 'assistant'].includes(role)) return null
                            const content = msg.content
                            const texts: string[] = []
                            if (typeof content === 'string') {
                              texts.push(content)
                            } else if (Array.isArray(content)) {
                              for (const b of content) {
                                if (b.type === 'text' && b.text && !b.text.startsWith('<ide_')) {
                                  texts.push(b.text)
                                }
                              }
                            }
                            if (texts.length === 0) return null
                            return (
                              <div key={i} className={`${styles.transcriptEntry} ${styles[`transcriptEntry-${role}`]}`}>
                                <span className={styles.transcriptRole}>{role}</span>
                                <p className={styles.transcriptText}>{texts.join('\n')}</p>
                              </div>
                            )
                          } catch { return null }
                        })}
                      </div>
                    )}
                  </SectionCard>
                )}

              </>
            ) : (
              <div className={styles.emptyState}>
                Results will be available when the session completes.
              </div>
            )}
          </div>
        )}
      </PanelLayout>
    </>
  )
}
