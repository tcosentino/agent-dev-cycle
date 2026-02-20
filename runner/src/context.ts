import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import YAML from 'yaml'
import type { SessionConfig, ProjectProgress, AgentsConfig, AgentConfig, AgentRole } from './types.js'
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
  // Try new structure first: .agentforge/agents/{id}/config.json
  const agentDirs = ['.agentforge/agents/pm', '.agentforge/agents/engineer', '.agentforge/agents/qa', '.agentforge/agents/lead']
  const configs: AgentsConfig = {}

  for (const dir of agentDirs) {
    const configPath = `${dir}/config.json`
    const configContent = await readRepoFile(configPath)
    if (configContent) {
      try {
        const config = JSON.parse(configContent)
        configs[config.id as AgentRole] = {
          model: config.model,
          maxTokens: config.maxTokens,
          orchestrator: config.orchestrator
        }
      } catch (err) {
        console.error(`Failed to parse ${configPath}:`, err)
      }
    }
  }

  // If we found configs in new structure, use them
  if (Object.keys(configs).length > 0) {
    return configs
  }

  // Fall back to legacy agents.yaml
  const content = await readRepoFile('.agentforge/agents.yaml')
  if (!content) {
    throw new Error('No agent configs found in .agentforge/agents/')
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

export async function assembleContext(config: SessionConfig): Promise<{ context: string; files: string[] }> {
  const sections: string[] = []
  const loadedFiles: string[] = []

  // Shared system prompt (all agents get this)
  const systemPrompt = await readRepoFile('prompts/system.md')
  if (systemPrompt) {
    sections.push(systemPrompt)
    loadedFiles.push('prompts/system.md')
  }

  // Role-specific prompt - try new structure first, then legacy
  let rolePrompt = await readRepoFile(`.agentforge/agents/${config.agent}/prompt.md`)
  if (rolePrompt) {
    sections.push(`## Your Role\n\n${rolePrompt}`)
    loadedFiles.push(`.agentforge/agents/${config.agent}/prompt.md`)
  } else {
    rolePrompt = await readRepoFile(`prompts/${config.agent}.md`)
    if (rolePrompt) {
      sections.push(`## Your Role\n\n${rolePrompt}`)
      loadedFiles.push(`prompts/${config.agent}.md`)
    }
  }

  // Project briefing
  const projectDoc = await readRepoFile('PROJECT.md')
  if (projectDoc) {
    sections.push(`## Project\n\n${projectDoc}`)
    loadedFiles.push('PROJECT.md')
  }

  // Architecture
  const archDoc = await readRepoFile('ARCHITECTURE.md')
  if (archDoc) {
    sections.push(`## Architecture\n\n${archDoc}`)
    loadedFiles.push('ARCHITECTURE.md')
  }

  // Current state
  const progressYaml = await readRepoFile('state/progress.yaml')
  if (progressYaml) {
    try {
      const progress = YAML.parse(progressYaml) as ProjectProgress
      sections.push(`## Current State\n\n${formatProgress(progress)}`)
      loadedFiles.push('state/progress.yaml')
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
    loadedFiles.push('memory/daily-log.md')
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

  // AgentForge CLI tools documentation
  const cliDocs = `## AgentForge CLI Tools

You have access to the \`agentforge\` CLI to manage project tasks and communicate with the team.
The following commands are available via bash:

### Task Management
\`\`\`bash
# List all tasks (optionally filter)
agentforge task list
agentforge task list --status todo
agentforge task list --assignee engineer

# Get task details
agentforge task get <key>          # e.g. agentforge task get AF-12

# Create a task
agentforge task create "<title>" [--description <text>] [--type <type>] [--priority <priority>] [--assignee <agent>]
# Types: epic, api, backend, frontend, testing, documentation, devops
# Priorities: critical, high, medium, low
# Assignees: pm, engineer, qa, lead

# Update a task
agentforge task update <key> --status <status>
agentforge task update <key> --assignee engineer
# Statuses: todo, in-progress, review, done, blocked

# Delete a task
agentforge task delete <key>

# Task comments
agentforge task comment list <key>
agentforge task comment add <key> "<comment text>"
agentforge task comment delete <comment-id>
\`\`\`

### Communication
\`\`\`bash
# Post a message to the project chat
agentforge chat post "<message>"

# Update your agent status
agentforge status set busy "Working on AF-12"
agentforge status set active
\`\`\`

**Use these tools to:**
- List tasks to understand what needs to be done
- Update task status as you work (in-progress → review → done)
- Create new tasks when you identify additional work
- Add comments to record progress, blockers, or decisions
- Post chat messages for important updates`

  sections.push(cliDocs)

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

  return {
    context: sections.join('\n\n---\n\n'),
    files: loadedFiles
  }
}

export async function writeContextFile(context: string): Promise<string> {
  await writeFile(CONTEXT_PATH, context, 'utf-8')
  return CONTEXT_PATH
}
