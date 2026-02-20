import { validateEnv, loadConfig } from './config.js'
import { cloneRepo, commitAndPush, commitPartialWork } from './git.js'
import { loadAgentsConfig, getAgentConfig, assembleContext, writeContextFile } from './context.js'
import { runClaude, extractSummary } from './claude.js'
import { captureTranscript } from './transcript.js'
import { updateProgress } from './state.js'
import { reportStageStart, reportStageComplete, reportComplete, reportFailure, reportProgress, reportContextFiles } from './progress.js'
import type { RunResult } from './types.js'

async function main(): Promise<void> {
  const startedAt = new Date().toISOString()
  let config

  console.log('=== AgentForge Runner Starting ===')
  console.log(`Session ID: ${process.env.AGENTFORGE_SESSION_ID}`)
  console.log(`Server URL: ${process.env.AGENTFORGE_SERVER_URL}`)
  console.log(`Config Path: ${process.env.SESSION_CONFIG_PATH}`)

  try {
    // 1. Load and validate config
    console.log('[1/8] Loading configuration...')
    await reportStageStart('loading', 5, 'Loading configuration...')
    const env = validateEnv()
    console.log(`  - ANTHROPIC_API_KEY: ${env.anthropicApiKey ? 'set' : 'not set (using subscription)'}`)
    console.log(`  - GIT_TOKEN: ${env.gitToken ? 'set' : 'not set (using system credentials)'}`)
    config = await loadConfig(env.configPath)
    console.log(`  - Agent: ${config.agent}`)
    console.log(`  - Project: ${config.projectId}`)
    console.log(`  - Repo: ${config.repoUrl}`)

    // 2. Clone repo
    console.log(`[2/8] Cloning repo: ${config.repoUrl}`)
    await reportStageStart('cloning', 10, `Cloning repository: ${config.repoUrl}`)
    await cloneRepo(config, env.gitToken)
    console.log('  - Clone complete')
    await reportStageComplete('cloning')

    // 3. Read agent config from repo
    console.log('[3/8] Loading agent configuration...')
    await reportStageStart('loading', 20, 'Loading agent configuration...')
    const agentsConfig = await loadAgentsConfig()
    const agentConfig = await getAgentConfig(agentsConfig, config.agent)
    console.log(`  - Model: ${agentConfig.model}`)
    await reportStageComplete('loading')

    // 4. Assemble context
    console.log('[4/8] Assembling context...')
    await reportProgress({ progress: 25, currentStep: 'Assembling context...' })
    const { context, files } = await assembleContext(config)
    const contextPath = await writeContextFile(context)
    console.log(`  - Context written to: ${contextPath}`)
    await reportContextFiles(files)

    // 5. Execute Claude Code
    console.log('[5/8] Starting Claude Code...')
    console.log(`  - Task: ${config.taskPrompt}`)
    await reportStageStart('executing', 30, 'Starting Claude Code...')
    const claudeStartedAtMs = Date.now()
    const result = await runClaude(
      config,
      contextPath,
      agentConfig.model,
      env.anthropicApiKey
    )

    if (!result.success) {
      console.error('  - Claude Code failed:', result.error)
      throw new Error(result.error || 'Claude Code execution failed')
    }
    console.log('  - Claude Code completed successfully')
    await reportStageComplete('executing')

    // 6. Capture transcript
    console.log('[6/8] Capturing transcript...')
    await reportStageStart('capturing', 80, 'Capturing transcript...')
    await captureTranscript(config, claudeStartedAtMs, result.isolatedHome)
    console.log('  - Transcript captured')
    await reportStageComplete('capturing')

    // 7. Update state
    console.log('[7/8] Updating state...')
    await reportProgress({ progress: 85, currentStep: 'Updating state...' })
    await updateProgress(config)
    console.log('  - State updated')

    // 8. Commit and push
    const summary = extractSummary(result.output)
    console.log(`[8/8] Committing changes...`)
    console.log(`  - Summary: ${summary}`)
    await reportStageStart('committing', 90, 'Committing and pushing changes...')
    const commitSha = await commitAndPush(config, summary, env.gitToken)
    console.log(`  - Commit SHA: ${commitSha}`)
    await reportStageComplete('committing')

    // 9. Success
    const runResult: RunResult = {
      success: true,
      runId: config.runId,
      agent: config.agent,
      startedAt,
      completedAt: new Date().toISOString(),
      summary,
      commitSha,
    }

    console.log('=== Run completed successfully ===')
    await reportComplete(summary, commitSha, result.tokenUsage)
    console.log(JSON.stringify(runResult, null, 2))
    process.exit(0)
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    console.error('=== Run failed ===')
    console.error(`Error: ${err.message}`)
    if (err.stack) {
      console.error('Stack trace:')
      console.error(err.stack)
    }

    // Report failure to server
    await reportFailure(err.message)

    // Try to commit partial work
    if (config) {
      const env = validateEnv()
      await commitPartialWork(config, err, env.gitToken)
    }

    const runResult: RunResult = {
      success: false,
      runId: config?.runId || 'unknown',
      agent: config?.agent || 'unknown' as any,
      startedAt,
      completedAt: new Date().toISOString(),
      error: err.message,
    }

    console.log(JSON.stringify(runResult, null, 2))
    process.exit(1)
  }
}

// Global error handlers for uncaught errors
process.on('uncaughtException', async (error) => {
  console.error('=== UNCAUGHT EXCEPTION ===')
  console.error(error)
  try {
    await reportFailure(`Uncaught exception: ${error.message}`)
  } catch {
    // Ignore reporting errors
  }
  process.exit(1)
})

process.on('unhandledRejection', async (reason) => {
  console.error('=== UNHANDLED REJECTION ===')
  console.error(reason)
  try {
    const message = reason instanceof Error ? reason.message : String(reason)
    await reportFailure(`Unhandled rejection: ${message}`)
  } catch {
    // Ignore reporting errors
  }
  process.exit(1)
})

main()
