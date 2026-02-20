import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import type { SessionConfig, ModelTier } from './types.js'
import { MODEL_MAP, WORKSPACE_PATH, DEFAULT_TIMEOUT_MS } from './types.js'
import { reportLog, reportProgress, reportClaudeOutput } from './progress.js'
import type { TokenUsage } from './progress.js'

export interface ClaudeResult {
  success: boolean
  output: string
  error?: string
  isolatedHome: string
  tokenUsage?: TokenUsage
}

// Shape of the final JSON object Claude emits with --output-format json
interface ClaudeJsonResult {
  type: 'result'
  subtype: string
  result?: string
  is_error: boolean
  duration_ms?: number
  total_cost_usd?: number
  usage?: {
    input_tokens?: number | null
    output_tokens?: number | null
    cache_creation_input_tokens?: number | null
    cache_read_input_tokens?: number | null
  }
}

function parseTokenUsage(jsonResult: ClaudeJsonResult): TokenUsage | undefined {
  const u = jsonResult.usage
  if (!u) return undefined
  const inputTokens = u.input_tokens ?? 0
  const outputTokens = u.output_tokens ?? 0
  const cacheReadTokens = u.cache_read_input_tokens ?? 0
  const cacheWriteTokens = u.cache_creation_input_tokens ?? 0
  return {
    inputTokens,
    outputTokens,
    cacheReadTokens,
    cacheWriteTokens,
    totalTokens: inputTokens + outputTokens + cacheReadTokens + cacheWriteTokens,
    totalCostUsd: jsonResult.total_cost_usd,
  }
}

function buildArgs(
  taskPrompt: string,
  contextPath: string,
  model: ModelTier
): string[] {
  return [
    '--print',
    taskPrompt,
    '--append-system-prompt-file',
    contextPath,
    '--output-format',
    'json',
    '--dangerously-skip-permissions',
    '--model',
    MODEL_MAP[model],
    '--verbose',
  ]
}

function createIsolatedHome(runId: string): string {
  const isolatedHome = join(tmpdir(), `agentforge-${runId}`)
  const claudeDir = join(isolatedHome, '.claude')
  mkdirSync(claudeDir, { recursive: true })
  // Skip interactive onboarding
  writeFileSync(
    join(isolatedHome, '.claude.json'),
    JSON.stringify({ hasCompletedOnboarding: true })
  )
  return isolatedHome
}

function buildEnvWithHome(
  config: SessionConfig,
  anthropicApiKey: string | undefined,
  isolatedHome: string
): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    HOME: isolatedHome,
    AGENTFORGE_SERVER_URL: config.serverUrl || '',
    AGENTFORGE_PROJECT_ID: config.projectId,
    AGENTFORGE_RUN_ID: config.runId,
    AGENTFORGE_SESSION_ID: process.env.AGENTFORGE_SESSION_ID || config.runId,
    AGENTFORGE_AGENT_ROLE: config.agent,
  }

  // Only set API key if provided (otherwise Claude Code uses subscription auth)
  if (anthropicApiKey) {
    env.ANTHROPIC_API_KEY = anthropicApiKey
  }

  return env
}

export async function runClaude(
  config: SessionConfig,
  contextPath: string,
  model: ModelTier,
  anthropicApiKey: string | undefined,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<ClaudeResult> {
  const args = buildArgs(config.taskPrompt, contextPath, model)
  const isolatedHome = createIsolatedHome(config.runId)
  const env = buildEnvWithHome(config, anthropicApiKey, isolatedHome)

  return new Promise((resolve) => {
    const stdoutChunks: string[] = []
    const stderrChunks: string[] = []
    let lastProgressReport = Date.now()
    let stderrLineCount = 0

    console.log('Claude args:', args.join(' '))

    const proc = spawn('claude', args, {
      cwd: WORKSPACE_PATH,
      env,
      stdio: ['ignore', 'pipe', 'pipe'], // ignore stdin - Claude doesn't need input
    })

    // Report that Claude has started
    reportLog({ level: 'info', message: 'Claude Code process started, waiting for output...' }, 'executing')

    const timeout = setTimeout(() => {
      proc.kill('SIGTERM')
      reportLog({ level: 'error', message: 'Claude Code process timed out' }, 'executing')
      resolve({
        success: false,
        output: '',
        error: 'Process timed out',
        isolatedHome,
      })
    }, timeoutMs)

    // With --output-format json, stdout contains the final JSON result object.
    // Verbose/streaming output goes to stderr.
    proc.stdout.on('data', (data: Buffer) => {
      const str = data.toString()
      process.stdout.write(str)
      stdoutChunks.push(str)
    })

    proc.stderr.on('data', (data: Buffer) => {
      const str = data.toString()
      process.stderr.write(str) // Stream verbose output live
      stderrChunks.push(str)

      // Stream stderr lines to the executing stage logs (verbose Claude output)
      const lines = str.split('\n')
      for (const line of lines) {
        const trimmed = line.trim()
        if (trimmed) {
          reportClaudeOutput(trimmed).catch(err => {
            console.warn('Failed to report Claude output:', err)
          })
          stderrLineCount++
        }
      }

      // Report progress periodically (every 5 seconds) to show activity
      const now = Date.now()
      if (now - lastProgressReport > 5000) {
        lastProgressReport = now
        // Calculate rough progress (30-75% during execution)
        const estimatedProgress = Math.min(75, 30 + Math.floor(stderrLineCount / 10))
        reportProgress({ progress: estimatedProgress, currentStep: 'Claude Code working...' })
      }
    })

    proc.on('close', (code) => {
      clearTimeout(timeout)

      // Parse the JSON result from stdout
      const rawOutput = stdoutChunks.join('')
      let jsonResult: ClaudeJsonResult | undefined
      let textOutput = ''

      try {
        jsonResult = JSON.parse(rawOutput.trim()) as ClaudeJsonResult
        textOutput = jsonResult.result ?? ''
      } catch {
        // Fallback: treat stdout as plain text if JSON parse fails
        textOutput = rawOutput
      }

      const tokenUsage = jsonResult ? parseTokenUsage(jsonResult) : undefined

      if (code === 0) {
        reportLog({ level: 'info', message: `Claude Code completed successfully` }, 'executing')
        if (tokenUsage) {
          const parts = [
            `${tokenUsage.inputTokens.toLocaleString()} input`,
            `${tokenUsage.outputTokens.toLocaleString()} output`,
          ]
          if (tokenUsage.cacheReadTokens > 0) parts.push(`${tokenUsage.cacheReadTokens.toLocaleString()} cache read`)
          if (tokenUsage.cacheWriteTokens > 0) parts.push(`${tokenUsage.cacheWriteTokens.toLocaleString()} cache write`)
          reportLog({ level: 'info', message: `Tokens: ${parts.join(', ')}` }, 'executing').catch(() => {})
        }
        resolve({
          success: true,
          output: textOutput,
          isolatedHome,
          tokenUsage,
        })
      } else {
        const errMsg = stderrChunks.join('') || `Process exited with code ${code}`
        reportLog({ level: 'error', message: `Claude Code exited with code ${code}` }, 'executing')
        resolve({
          success: false,
          output: textOutput,
          error: errMsg,
          isolatedHome,
          tokenUsage,
        })
      }
    })

    proc.on('error', (err) => {
      clearTimeout(timeout)
      reportLog({ level: 'error', message: `Failed to spawn Claude Code: ${err.message}` }, 'executing')
      resolve({
        success: false,
        output: '',
        error: err.message,
        isolatedHome,
      })
    })
  })
}

export function extractSummary(output: string): string {
  // Claude runs with --output-format text, so output is plain text / markdown.
  // Strip a leading "# Summary" (or "## Summary" etc.) header line if present.
  const trimmed = output.trim()
  const withoutHeader = trimmed.replace(/^#{1,6}\s+Summary\s*\n/, '').trim()
  return withoutHeader || 'Completed session'
}
