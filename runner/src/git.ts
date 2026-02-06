import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import type { SessionConfig, AgentRole } from './types.js'
import { WORKSPACE_PATH } from './types.js'

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

  await execFileAsync('git', [
    'clone',
    '--branch',
    config.branch,
    '--depth',
    '1',
    authUrl,
    WORKSPACE_PATH,
  ])

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
    console.log('No changes to commit')
    return undefined
  }

  // Commit with structured message
  const commitMessage = `agent(${config.agent}): ${summary} [${config.runId}]`
  await execFileAsync('git', [
    '-C',
    WORKSPACE_PATH,
    'commit',
    '-m',
    commitMessage,
  ])

  // Push to remote (with pull --rebase if needed for shallow clone)
  const authUrl = getAuthenticatedUrl(config.repoUrl, gitToken)

  try {
    await execFileAsync('git', [
      '-C',
      WORKSPACE_PATH,
      'push',
      authUrl,
      config.branch,
    ])
  } catch (pushError) {
    // Push failed, likely because remote has new commits
    // Unshallow the clone and rebase on top of remote
    console.log('Push failed, fetching and rebasing...')

    // Unshallow the clone to get full history
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
    await execFileAsync('git', [
      '-C',
      WORKSPACE_PATH,
      'fetch',
      authUrl,
      config.branch,
    ])

    // Rebase local changes on top of remote
    await execFileAsync('git', [
      '-C',
      WORKSPACE_PATH,
      'rebase',
      'FETCH_HEAD',
    ])

    // Try push again
    await execFileAsync('git', [
      '-C',
      WORKSPACE_PATH,
      'push',
      authUrl,
      config.branch,
    ])
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
    await execFileAsync('git', [
      '-C',
      WORKSPACE_PATH,
      'commit',
      '-m',
      commitMessage,
    ])

    const authUrl = getAuthenticatedUrl(config.repoUrl, gitToken)

    try {
      await execFileAsync('git', [
        '-C',
        WORKSPACE_PATH,
        'push',
        authUrl,
        config.branch,
      ])
    } catch {
      // Push failed, likely because remote has new commits
      // Unshallow the clone and rebase on top of remote
      console.log('Push failed, fetching and rebasing...')

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

      await execFileAsync('git', [
        '-C',
        WORKSPACE_PATH,
        'fetch',
        authUrl,
        config.branch,
      ])

      await execFileAsync('git', [
        '-C',
        WORKSPACE_PATH,
        'rebase',
        'FETCH_HEAD',
      ])

      await execFileAsync('git', [
        '-C',
        WORKSPACE_PATH,
        'push',
        authUrl,
        config.branch,
      ])
    }
  } catch (commitError) {
    console.error('Failed to commit partial work:', commitError)
  }
}
