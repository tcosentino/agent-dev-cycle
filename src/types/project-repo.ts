import type { AgentRole } from '../components/task-board/types'

// --- Project Configuration ---

export type ProjectPhase = 'discovery' | 'shaping' | 'building' | 'delivery'
export type ProjectTier = 'starter' | 'professional' | 'enterprise'
export type MilestoneStatus = 'pending' | 'in-progress' | 'completed'

export interface ProjectConfig {
  name: string
  key: string
  customer: string
  created: string
  phase: ProjectPhase
  tier: ProjectTier
  stack: {
    language: string
    framework: string
    database: string
    deployment: string
  }
}

export interface AgentConfig {
  model: 'opus' | 'sonnet' | 'haiku'
  maxTokens: number
}

export type AgentsConfig = Partial<Record<AgentRole, AgentConfig>>

// --- Memory/Knowledge ---

export interface MemoryEntry {
  id: string
  timestamp: string
  recordedBy: AgentRole
  tags: string[]
  relatedTasks?: string[]
  title: string
  content: string
}

export type MemoryCategory = 'decisions' | 'codebase' | 'research' | 'blockers'

export type ProjectMemory = Record<MemoryCategory, MemoryEntry[]>

// --- State ---

export interface Milestone {
  id: ProjectPhase
  status: MilestoneStatus
  completedAt?: string
}

export interface ProjectProgress {
  phase: ProjectPhase
  currentSprint: number
  milestones: Milestone[]
  nextActions: string[]
  lastAgent: AgentRole
  lastRunAt: string
}

// --- Prompts ---

export interface AgentPrompt {
  role: AgentRole
  content: string
}

// --- Full Repo Representation ---

export interface ProjectRepo {
  config: ProjectConfig
  agentsConfig: AgentsConfig
  prompts: AgentPrompt[]
  memory: ProjectMemory
  progress: ProjectProgress
  readme: string
}

// --- File path conventions ---

export const REPO_PATHS = {
  config: '.agentforge/project.yaml',
  agentsConfig: '.agentforge/agents.yaml',
  prompts: (role: AgentRole) => `prompts/${role}.md`,
  memory: {
    decisions: 'memory/decisions.md',
    codebase: 'memory/codebase.md',
    research: 'memory/research.md',
    blockers: 'memory/blockers.md',
  },
  progress: 'state/progress.yaml',
  readme: 'README.md',
} as const
