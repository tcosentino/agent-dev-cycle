import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import type { SessionConfig, AgentRole } from './types.js'
import { WORKSPACE_PATH } from './types.js'
import { reportLog, reportGitOutput } from './progress.js'

const execFileAsync = promisify(execFile)

function getAuthenticatedUrl(repoUrl: string, token: string | undefined): string {
  if (!token) {
    // No token - use URL as-is, rely on system git credentials
    return repoUrl
  }
  const url = new URL(repoUrl)
  url.username = 'x-access-token'
  url.password = token
  return url.toString()
}

function getAgentEmail(agent: AgentRole): string {
  return `${agent}@agentforge.dev`
}

export async function cloneRepo(
  config: SessionConfig,
  gitToken: string | undefined
): Promise<void> {
  const authUrl = getAuthenticatedUrl(config.repoUrl, gitToken)

  // Clone repo
  const { stdout, stderr } = await execFileAsync('git', [
    'clone',
    '--branch',
    config.branch,
    '--depth',
    '1',
    authUrl,
    WORKSPACE_PATH,
  ])

  // Report clone output
  await reportGitOutput(stdout, stderr, 'cloning')

  // Configure git user for commits
  await execFileAsync('git', [
    '-C',
    WORKSPACE_PATH,
    'config',
    'user.name',
    `AgentForge ${config.agent}`,
  ])

  await execFileAsync('git', [
    '-C',
    WORKSPACE_PATH,
    'config',
    'user.email',
    getAgentEmail(config.agent),
  ])

  // Store credentials for push
  await execFileAsync('git', [
    '-C',
    WORKSPACE_PATH,
    'config',
    'credential.helper',
    'store',
  ])
}

export async function commitAndPush(
  config: SessionConfig,
  summary: string,
  gitToken: string | undefined
): Promise<string | undefined> {
  // Stage all changes
  await execFileAsync('git', ['-C', WORKSPACE_PATH, 'add', '-A'])

  // Check if there are changes to commit
  const { stdout: status } = await execFileAsync('git', [
    '-C',
    WORKSPACE_PATH,
    'status',
    '--porcelain',
  ])

  if (!status.trim()) {
    await reportLog({
      level: 'info',
      message: 'nothing to commit, working tree clean'
    }, 'committing')
    return undefined
  }

  // Commit with structured message
  const commitMessage = `agent(${config.agent}): ${summary} [${config.runId}]`

  const { stdout: commitOutput } = await execFileAsync('git', [
    '-C',
    WORKSPACE_PATH,
    'commit',
    '-m',
    commitMessage,
  ])

  // Log the actual git commit output (shows files changed, insertions/deletions)
  await reportLog({
    level: 'info',
    message: commitOutput
  }, 'committing')

  // Push to remote
  const authUrl = getAuthenticatedUrl(config.repoUrl, gitToken)

  try {
    const { stdout, stderr } = await execFileAsync('git', [
      '-C',
      WORKSPACE_PATH,
      'push',
      authUrl,
      config.branch,
    ])

    // Log the actual git push output
    await reportGitOutput(stdout, stderr, 'committing')
  } catch (pushError) {
    // Push rejected, need to pull and rebase first
    await reportLog({
      level: 'warn',
      message: 'push rejected, fetching remote changes...'
    }, 'committing')

    // Unshallow the clone to get full history (needed for rebase)
    await execFileAsync('git', [
      '-C',
      WORKSPACE_PATH,
      'fetch',
      '--unshallow',
      authUrl,
      config.branch,
    ]).catch(() => {
      // Already unshallowed or full clone, ignore error
    })

    // Fetch latest from remote
    const { stdout: fetchOutput, stderr: fetchError } = await execFileAsync('git', [
      '-C',
      WORKSPACE_PATH,
      'fetch',
      authUrl,
      config.branch,
    ])
    await reportGitOutput(fetchOutput, fetchError, 'committing')

    // Rebase local changes on top of remote
    const { stdout: rebaseOutput, stderr: rebaseError } = await execFileAsync('git', [
      '-C',
      WORKSPACE_PATH,
      'rebase',
      'FETCH_HEAD',
    ])
    await reportGitOutput(rebaseOutput, rebaseError, 'committing')

    // Push again after rebase
    const { stdout, stderr } = await execFileAsync('git', [
      '-C',
      WORKSPACE_PATH,
      'push',
      authUrl,
      config.branch,
    ])
    await reportGitOutput(stdout, stderr, 'committing')
  }

  // Get commit SHA
  const { stdout: sha } = await execFileAsync('git', [
    '-C',
    WORKSPACE_PATH,
    'rev-parse',
    'HEAD',
  ])

  return sha.trim()
}

export async function commitPartialWork(
  config: SessionConfig,
  error: Error,
  gitToken: string | undefined
): Promise<void> {
  try {
    await execFileAsync('git', ['-C', WORKSPACE_PATH, 'add', '-A'])

    const { stdout: status } = await execFileAsync('git', [
      '-C',
      WORKSPACE_PATH,
      'status',
      '--porcelain',
    ])

    if (!status.trim()) {
      return
    }

    const commitMessage = `agent(${config.agent}): FAILED - ${error.message} [${config.runId}]`
    const { stdout: commitOutput } = await execFileAsync('git', [
      '-C',
      WORKSPACE_PATH,
      'commit',
      '-m',
      commitMessage,
    ])

    // Log the actual git commit output for partial work
    await reportLog({
      level: 'warn',
      message: `Committing partial work:\n${commitOutput}`
    }, 'committing')

    const authUrl = getAuthenticatedUrl(config.repoUrl, gitToken)

    try {
      const { stdout, stderr } = await execFileAsync('git', [
        '-C',
        WORKSPACE_PATH,
        'push',
        authUrl,
        config.branch,
      ])

      await reportGitOutput(stdout, stderr, 'committing')
    } catch {
      // Push rejected, need to pull and rebase first
      await reportLog({
        level: 'warn',
        message: 'push rejected, fetching remote changes...'
      }, 'committing')

      await execFileAsync('git', [
        '-C',
        WORKSPACE_PATH,
        'fetch',
        '--unshallow',
        authUrl,
        config.branch,
      ]).catch(() => {
        // Already unshallowed or full clone
      })

      const { stdout: fetchOutput, stderr: fetchError } = await execFileAsync('git', [
        '-C',
        WORKSPACE_PATH,
        'fetch',
        authUrl,
        config.branch,
      ])
      await reportGitOutput(fetchOutput, fetchError, 'committing')

      const { stdout: rebaseOutput, stderr: rebaseError } = await execFileAsync('git', [
        '-C',
        WORKSPACE_PATH,
        'rebase',
        'FETCH_HEAD',
      ])
      await reportGitOutput(rebaseOutput, rebaseError, 'committing')

      const { stdout, stderr } = await execFileAsync('git', [
        '-C',
        WORKSPACE_PATH,
        'push',
        authUrl,
        config.branch,
      ])
      await reportGitOutput(stdout, stderr, 'committing')
    }
  } catch (commitError) {
    console.error('Failed to commit partial work:', commitError)
  }
}
