import { readFile } from 'node:fs/promises'
import { SessionConfig, CONFIG_PATH } from './types.js'

export interface EnvConfig {
  anthropicApiKey: string | undefined
  gitToken: string | undefined
  configPath: string
}

export function validateEnv(): EnvConfig {
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY
  const gitToken = process.env.GIT_TOKEN
  const configPath = process.env.SESSION_CONFIG_PATH || CONFIG_PATH

  // ANTHROPIC_API_KEY is optional if using Claude subscription auth (~/.claude/)
  // Claude Code will use subscription if no API key is set

  // GIT_TOKEN is optional if using system git credentials (gh auth, ssh keys, credential helper)

  return {
    anthropicApiKey,
    gitToken,
    configPath,
  }
}

export async function loadConfig(path: string): Promise<SessionConfig> {
  const content = await readFile(path, 'utf-8')
  const json = JSON.parse(content)
  return SessionConfig.parse(json)
}
