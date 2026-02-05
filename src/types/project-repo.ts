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
  orchestrator?: boolean
}

export type AgentsConfig = Partial<Record<AgentRole, AgentConfig>>

// --- Briefing Docs (loaded into agent context every run) ---

export interface ProjectBriefing {
  project: string   // PROJECT.md -- requirements, constraints, success metrics
  architecture: string // ARCHITECTURE.md -- technical decisions, data models, stack
}

// --- Memory/Knowledge (wiki -- searched on demand) ---

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

// --- Sessions ---

export interface SessionOutput {
  runId: string
  agent: AgentRole
  startedAt: string
  completedAt?: string
  phase: ProjectPhase
  transcript: string    // path to JSONL file
  notepad?: string      // path to agent's scratchpad for this session
  summary?: string      // brief description of what was accomplished
}

// --- PM Daily Log ---

export interface DailyLogEntry {
  date: string
  summary: string
  decisionsAudience: string[] // which agents need to know
}

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
  briefing: ProjectBriefing
  prompts: AgentPrompt[]
  memory: ProjectMemory
  sessions: SessionOutput[]
  progress: ProjectProgress
  readme: string
}

// --- File path conventions ---

export const REPO_PATHS = {
  config: '.agentforge/project.yaml',
  agentsConfig: '.agentforge/agents.yaml',
  briefing: {
    project: 'PROJECT.md',
    architecture: 'ARCHITECTURE.md',
  },
  prompts: (role: AgentRole) => `prompts/${role}.md`,
  memory: {
    decisions: 'memory/decisions.md',
    codebase: 'memory/codebase.md',
    research: 'memory/research.md',
    blockers: 'memory/blockers.md',
  },
  sessions: (agent: AgentRole, runId: string) => `sessions/${agent}/${runId}/`,
  sessionTranscript: (agent: AgentRole, runId: string) => `sessions/${agent}/${runId}/transcript.jsonl`,
  sessionNotepad: (agent: AgentRole, runId: string) => `sessions/${agent}/${runId}/notepad.md`,
  dailyLog: 'memory/daily-log.md',
  progress: 'state/progress.yaml',
  readme: 'README.md',
} as const
