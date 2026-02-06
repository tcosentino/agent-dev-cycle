# AgentForge Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              AgentForge System                               │
│                                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │   Customer   │───▶│    Server    │───▶│    Runner    │                  │
│  │  (Web UI)    │    │   (Hub)      │    │   (Docker)   │                  │
│  └──────────────┘    └──────────────┘    └──────────────┘                  │
│                             │                    │                          │
│                             │                    │                          │
│                             ▼                    ▼                          │
│                      ┌──────────────┐    ┌──────────────┐                  │
│                      │   Project    │◀──▶│    Agent     │                  │
│                      │    Repo      │    │  (Claude)    │                  │
│                      │   (Git)      │    │              │                  │
│                      └──────────────┘    └──────────────┘                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Components

### 1. Agent Runner (`runner/`)

The execution engine for AI agents. Handles the complete lifecycle of an agent session.

**Tech Stack**: Node.js, TypeScript, Docker

**Key Files**:
- `src/index.ts` - Main orchestration
- `src/context.ts` - Prompt assembly from repo files
- `src/claude.ts` - Claude Code CLI execution
- `src/git.ts` - Clone/commit/push operations
- `src/cli/` - AgentForge CLI for agent-to-server communication

**Flow**:
```
Load Config → Clone Repo → Assemble Context → Run Claude → Capture Transcript → Commit → Push
```

### 2. Project Repository (Per-Project)

Each customer project is a git repo with a standard structure:

```
project-repo/
├── PROJECT.md           # Customer requirements, success criteria
├── ARCHITECTURE.md      # Technical architecture (this file)
├── .agentforge/
│   └── agents.yaml      # Model config per agent role
├── prompts/
│   ├── system.md        # Shared context for all agents
│   ├── pm.md            # PM-specific prompt
│   ├── engineer.md      # Engineer-specific prompt
│   ├── qa.md            # QA-specific prompt
│   └── lead.md          # Lead-specific prompt
├── state/
│   └── progress.yaml    # Current phase, sprint, next actions
├── memory/
│   ├── daily-log.md     # Timestamped activity log
│   ├── decisions.md     # Architectural decisions
│   └── blockers.md      # Known issues, blockers
├── sessions/
│   └── {agent}/{runId}/ # Session artifacts
│       ├── notepad.md   # Agent's session notes
│       └── transcript.jsonl
└── src/                 # Actual project code (varies by project)
```

### 3. AgentForge Server (Planned)

Central hub for project management and agent coordination.

**Planned Responsibilities**:
- Task persistence and assignment
- Agent status tracking
- Project dashboard
- Orchestration logic (which agent runs next)

**API Endpoints** (planned):
- `POST /api/projects/:id/tasks` - Create task
- `PATCH /api/projects/:id/tasks/:key` - Update task
- `GET /api/projects/:id/tasks` - List tasks
- `POST /api/projects/:id/chat` - Post message
- `PATCH /api/agents/:id/status` - Update agent status

### 4. Web Dashboard (Planned)

Customer-facing interface for project visibility.

**Tech Stack**: Vite, TypeScript, React

**Current State**: Landing page exists, dashboard components in progress

## Data Flow

### Agent Session

```
1. Orchestrator triggers agent run
   │
   ▼
2. Runner loads session config
   │
   ▼
3. Runner clones project repo
   │
   ▼
4. Runner assembles context from repo files:
   - prompts/system.md (shared)
   - prompts/{agent}.md (role-specific)
   - PROJECT.md, ARCHITECTURE.md
   - state/progress.yaml
   - memory/daily-log.md (recent entries)
   │
   ▼
5. Runner executes Claude Code with task prompt
   │
   ▼
6. Agent works on task:
   - Reads/writes code
   - Uses `agentforge` CLI to update tasks
   - Writes notes to sessions/{agent}/{runId}/notepad.md
   │
   ▼
7. Runner captures transcript
   │
   ▼
8. Runner commits and pushes changes
   │
   ▼
9. Orchestrator determines next agent (if any)
```

### Agent Communication

Agents don't communicate directly. They share context through:

1. **Git commits** - Code and file changes
2. **Session notes** - `sessions/{agent}/{runId}/notepad.md`
3. **Memory files** - `memory/daily-log.md`, `memory/decisions.md`
4. **Task updates** - Via `agentforge` CLI → server API
5. **State files** - `state/progress.yaml`

## Technology Choices

| Component | Technology | Rationale |
|-----------|------------|-----------|
| Agent Runtime | Claude Code CLI | Built-in file ops, tool use, sandboxing |
| Container | Docker | Isolation, reproducibility |
| Source Control | Git | Versioning, rollback, transparency |
| Agent Models | Claude (Opus/Sonnet/Haiku) | Best code generation, reasoning |
| Runner | Node.js + TypeScript | Fast iteration, good Claude SDK support |
| Server | TBD (likely Node.js) | Consistency with runner |
| Dashboard | React + Vite | Fast, type-safe frontend |

## Security Model

1. **Agent Isolation**: Each agent runs in a fresh Docker container
2. **Repo Access**: Agents only access their assigned project repo
3. **API Tokens**: GitHub tokens scoped to specific repos
4. **No Secrets in Repo**: Credentials passed via environment variables

## Scaling Considerations

**Current (Single Agent)**:
- One agent runs at a time per project
- No concurrent access to repo
- Git push always succeeds (no conflicts)

**Future (Parallel Agents)**:
- Multiple agents on different tasks
- Feature branches per agent
- Merge coordination via Lead agent

## Open Questions

1. **Orchestration Logic**: How does the system decide which agent runs next?
   - Option A: Lead agent coordinates
   - Option B: Rule-based state machine
   - Option C: Human approval gates

2. **Long-Running Tasks**: What if a task takes multiple sessions?
   - Option A: Agent continues where it left off
   - Option B: Task split into smaller sub-tasks
   - Option C: Time-boxed with explicit handoff

3. **Conflict Resolution**: If an agent's changes conflict with recent commits?
   - Option A: Fail and notify
   - Option B: Auto-merge if possible
   - Option C: Lead agent resolves

## Key Files Reference

| File | Purpose |
|------|---------|
| `runner/src/index.ts` | Runner entrypoint |
| `runner/src/context.ts` | Context assembly |
| `runner/src/claude.ts` | Claude Code execution |
| `runner/src/cli/index.ts` | AgentForge CLI entrypoint |
| `runner/Dockerfile` | Container image |
| `runner/scripts/dev.sh` | Development helper |
