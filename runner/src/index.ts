import { validateEnv, loadConfig } from './config.js'
import { cloneRepo, commitAndPush, commitPartialWork } from './git.js'
import { loadAgentsConfig, getAgentConfig, assembleContext, writeContextFile } from './context.js'
import { runClaude, extractSummary } from './claude.js'
import { captureTranscript } from './transcript.js'
import { updateProgress } from './state.js'
import type { RunResult } from './types.js'

async function main(): Promise<void> {
  const startedAt = new Date().toISOString()
  let config

  try {
    // 1. Load and validate config
    console.log('Loading configuration...')
    const env = validateEnv()
    config = await loadConfig(env.configPath)
    console.log(`Running agent: ${config.agent} for project: ${config.projectId}`)

    // 2. Clone repo
    console.log(`Cloning repo: ${config.repoUrl}`)
    await cloneRepo(config, env.gitToken)

    // 3. Read agent config from repo
    console.log('Loading agent configuration...')
    const agentsConfig = await loadAgentsConfig()
    const agentConfig = await getAgentConfig(agentsConfig, config.agent)
    console.log(`Using model: ${agentConfig.model}`)

    // 4. Assemble context
    console.log('Assembling context...')
    const context = await assembleContext(config)
    const contextPath = await writeContextFile(context)

    // 5. Execute Claude Code
    console.log('Starting Claude Code...')
    console.log(`Task: ${config.taskPrompt}`)
    const result = await runClaude(
      config,
      contextPath,
      agentConfig.model,
      env.anthropicApiKey
    )

    if (!result.success) {
      console.error('Claude Code failed:', result.error)
      throw new Error(result.error || 'Claude Code execution failed')
    }

    // 6. Capture transcript
    console.log('Capturing transcript...')
    await captureTranscript(config)

    // 7. Update state
    console.log('Updating state...')
    await updateProgress(config)

    // 8. Commit and push
    const summary = extractSummary(result.output)
    console.log(`Committing changes: ${summary}`)
    const commitSha = await commitAndPush(config, summary, env.gitToken)

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

    console.log('Run completed successfully')
    console.log(JSON.stringify(runResult, null, 2))
    process.exit(0)
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    console.error('Run failed:', err.message)

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

main()
