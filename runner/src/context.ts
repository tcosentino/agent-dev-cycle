import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import YAML from 'yaml'
import type { SessionConfig, ProjectProgress, AgentsConfig, AgentConfig } from './types.js'
import { WORKSPACE_PATH, CONTEXT_PATH, MAX_FILE_SIZE } from './types.js'

function truncate(content: string, maxLength: number = MAX_FILE_SIZE): string {
  if (content.length <= maxLength) return content
  return content.slice(0, maxLength) + '\n\n[... truncated ...]'
}

async function readRepoFile(relativePath: string): Promise<string | null> {
  try {
    const fullPath = join(WORKSPACE_PATH, relativePath)
    const content = await readFile(fullPath, 'utf-8')
    return truncate(content)
  } catch {
    return null
  }
}

export async function loadAgentsConfig(): Promise<AgentsConfig> {
  const content = await readRepoFile('.agentforge/agents.yaml')
  if (!content) {
    throw new Error('agents.yaml not found in repo')
  }
  return YAML.parse(content) as AgentsConfig
}

export async function getAgentConfig(
  agentsConfig: AgentsConfig,
  agent: SessionConfig['agent']
): Promise<AgentConfig> {
  const config = agentsConfig[agent]
  if (!config) {
    throw new Error(`No config found for agent: ${agent}`)
  }
  return config
}

function formatProgress(progress: ProjectProgress): string {
  const lines = [
    `Phase: ${progress.phase}, Sprint: ${progress.currentSprint}`,
    `Last agent: ${progress.lastAgent} at ${progress.lastRunAt}`,
    '',
    'Next actions:',
    ...progress.nextActions.map((a) => `- ${a}`),
  ]
  return lines.join('\n')
}

export async function assembleContext(config: SessionConfig): Promise<string> {
  const sections: string[] = []

  // Shared system prompt (all agents get this)
  const systemPrompt = await readRepoFile('prompts/system.md')
  if (systemPrompt) {
    sections.push(systemPrompt)
  }

  // Role-specific prompt
  const rolePrompt = await readRepoFile(`prompts/${config.agent}.md`)
  if (rolePrompt) {
    sections.push(`## Your Role\n\n${rolePrompt}`)
  }

  // Project briefing
  const projectDoc = await readRepoFile('PROJECT.md')
  if (projectDoc) {
    sections.push(`## Project\n\n${projectDoc}`)
  }

  // Architecture
  const archDoc = await readRepoFile('ARCHITECTURE.md')
  if (archDoc) {
    sections.push(`## Architecture\n\n${archDoc}`)
  }

  // Current state
  const progressYaml = await readRepoFile('state/progress.yaml')
  if (progressYaml) {
    try {
      const progress = YAML.parse(progressYaml) as ProjectProgress
      sections.push(`## Current State\n\n${formatProgress(progress)}`)
    } catch {
      // Skip if invalid YAML
    }
  }

  // Recent history from daily log
  const dailyLog = await readRepoFile('memory/daily-log.md')
  if (dailyLog) {
    const lines = dailyLog.split('\n')
    const recentLines = lines.slice(-30).join('\n')
    sections.push(`## Recent History\n\n${recentLines}`)
  }

  // Session metadata
  const sessionInfo = [
    `## This Session`,
    '',
    `- Run ID: ${config.runId}`,
    `- Phase: ${config.phase}`,
  ]

  if (config.assignedTasks?.length) {
    sessionInfo.push(`- Assigned tasks: ${config.assignedTasks.join(', ')}`)
  }

  if (config.serverUrl) {
    sessionInfo.push(`- Server API: ${config.serverUrl}`)
  }

  sections.push(sessionInfo.join('\n'))

  // Session-specific instructions
  const instructions = `## Your Task

${config.taskPrompt}

---

**Remember:**
1. Work on the task above. Be focused -- do one thing well.
2. Write session notes to \`sessions/${config.agent}/${config.runId}/notepad.md\`
3. Include a "Wishlist" section noting any tools or capabilities you wished you had.
4. Update \`memory/daily-log.md\` with what you accomplished.`

  sections.push(instructions)

  return sections.join('\n\n---\n\n')
}

export async function writeContextFile(context: string): Promise<string> {
  await writeFile(CONTEXT_PATH, context, 'utf-8')
  return CONTEXT_PATH
}
