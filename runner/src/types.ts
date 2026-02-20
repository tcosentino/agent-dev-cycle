import { z } from 'zod'

// Agent roles matching the frontend types
export const AgentRole = z.enum(['pm', 'engineer', 'qa', 'lead'])
export type AgentRole = z.infer<typeof AgentRole>

// Project phases matching the frontend types
export const ProjectPhase = z.enum(['discovery', 'shaping', 'building', 'delivery'])
export type ProjectPhase = z.infer<typeof ProjectPhase>

// Session config schema - passed to the runner via JSON file
export const SessionConfig = z.object({
  // Identity
  runId: z.string(),
  projectId: z.string(),
  agent: AgentRole,
  phase: ProjectPhase,

  // Repo (supports HTTPS, SSH, or local file path for testing)
  repoUrl: z.string().refine(
    (url) => url.startsWith('https://') || url.startsWith('git@') || url.startsWith('/'),
    { message: 'Must be an HTTPS, SSH, or local file path' }
  ),
  branch: z.string().default('main'),

  // Task
  taskPrompt: z.string(),
  assignedTasks: z.array(z.string()).optional(),

  // Server (for agent to call back during execution)
  serverUrl: z.string().url().optional(),
})

export type SessionConfig = z.infer<typeof SessionConfig>

// Agent config from agents.yaml in the project repo
export const ModelTier = z.enum(['opus', 'sonnet', 'haiku'])
export type ModelTier = z.infer<typeof ModelTier>

export const AgentConfig = z.object({
  model: ModelTier,
  maxTokens: z.number(),
  orchestrator: z.boolean().optional(),
})

export type AgentConfig = z.infer<typeof AgentConfig>

export type AgentsConfig = Partial<Record<AgentRole, AgentConfig>>

// Progress state from state/progress.yaml
export const MilestoneStatus = z.enum(['pending', 'in-progress', 'completed'])

export const Milestone = z.object({
  id: ProjectPhase,
  status: MilestoneStatus,
  completedAt: z.string().optional(),
})

export const ProjectProgress = z.object({
  phase: ProjectPhase,
  currentSprint: z.number(),
  milestones: z.array(Milestone),
  nextActions: z.array(z.string()),
  lastAgent: AgentRole,
  lastRunAt: z.string(),
})

export type ProjectProgress = z.infer<typeof ProjectProgress>

// Run result returned by the runner
export interface RunResult {
  success: boolean
  runId: string
  agent: AgentRole
  startedAt: string
  completedAt: string
  summary?: string
  error?: string
  commitSha?: string
}

// Model ID mapping for Claude Code CLI
export const MODEL_MAP = {
  opus: 'claude-opus-4-5-20251101',
  sonnet: 'claude-sonnet-4-20250514',
  haiku: 'claude-haiku-4-20250414',
} as const satisfies Record<ModelTier, string>

// Constants - use env vars for local dev flexibility
export const WORKSPACE_PATH = process.env.WORKSPACE_PATH || '/workspace'
export const CONFIG_PATH = process.env.SESSION_CONFIG_PATH || './session.local.json'
export const CONTEXT_PATH = process.env.CONTEXT_PATH || '/tmp/agent-context.md'
export const MAX_FILE_SIZE = 20000 // 20K chars, matching OpenClaw's pattern
export const DEFAULT_TIMEOUT_MS = 30 * 60 * 1000 // 30 minutes
