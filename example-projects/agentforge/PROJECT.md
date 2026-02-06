# AgentForge - AI-Powered Development Teams

## Customer

**Primary**: Troy Cosentino (founder/developer)

**Secondary**: Future customers who want AI teams to build custom software for them

## Problem Statement

Building custom software is expensive and slow. The traditional model requires hiring developers, managing sprints, and waiting months for delivery. AI can write code, but a single AI agent lacks the coordination, quality assurance, and strategic thinking that a real development team provides.

**The insight**: It's not just about writing code faster - it's about having a complete team with different perspectives (product thinking, engineering discipline, quality assurance, architectural oversight) working together on your project.

## Solution

AgentForge is an AI-powered software development service. Customers describe what they want to build, and a team of specialized AI agents handles the entire development lifecycle:

1. **Discovery**: PM agent interviews the customer, extracts requirements, identifies constraints
2. **Shaping**: PM + Lead agents define scope, create task breakdowns, identify risks
3. **Building**: Engineer agents implement features, QA agents test them, Lead reviews architecture
4. **Delivery**: Agents handle deployment, monitoring, and iteration

## Success Criteria

The system is working when:

1. **PM can break down work**: Given a project description, PM creates appropriately-scoped tasks with clear acceptance criteria
2. **Engineer can implement tasks**: Given a task, Engineer writes code that passes tests and meets requirements
3. **QA can verify quality**: Given completed code, QA writes tests and catches issues before delivery
4. **Lead can coordinate**: Lead agent orchestrates the team, manages dependencies, ensures architectural consistency
5. **Full cycle completes**: A project goes from idea to deployed software with minimal human intervention

## Current State

### What's Built

- **Agent Runner**: Docker-based execution engine that runs agents in isolated containers
- **Context Assembly**: Loads project context (PROJECT.md, ARCHITECTURE.md, prompts) for each agent
- **CLI for Agent Communication**: `agentforge` CLI lets agents update tasks, post messages, update status
- **Transcript Capture**: Full session transcripts saved for debugging and review
- **Session Notes**: Agents write to `sessions/{agent}/{runId}/notepad.md` with their work and wishlist

### What's Pending

**Immediate (Sprint 1)**:
- Server-side task persistence (currently CLI calls hit a mock/missing server)
- Orchestrator to sequence agent runs
- Agent handoff protocol (how PM hands off to Engineer, etc.)

**Near-term (Sprint 2)**:
- Web dashboard for project visibility
- Real-time agent status updates
- Task board UI

**Future**:
- Customer-facing project intake flow
- Billing and usage tracking
- Multi-project support

## Constraints

1. **Budget**: Using Claude subscription (Pro/Max) not API credits - cost per agent run is effectively fixed
2. **Single Agent at a Time**: Current architecture runs one agent per project at a time to avoid merge conflicts
3. **Git as Source of Truth**: All project state lives in the repo, not in a separate database
4. **Claude Code as Execution Engine**: Agents run via Claude Code CLI with `--dangerously-skip-permissions`

## Out of Scope (This Phase)

- Real-time collaboration features
- Multiple concurrent agents on same repo
- Customer self-service portal
- Payment processing

## Key Decisions

1. **Repo-centric architecture**: Everything lives in git - prompts, state, memory, transcripts. This enables versioning, rollback, and transparency.

2. **Session-based execution**: Each agent run is a discrete session with clear inputs (task prompt, context) and outputs (code changes, notes, transcript).

3. **CLI over MCP**: Agents interact with the server via a bash CLI rather than Model Context Protocol. Simpler to implement and debug.

4. **Wishlist feedback loop**: Agents report what capabilities they wish they had, informing AgentForge development priorities.

## Team

| Agent | Model | Role |
|-------|-------|------|
| PM | Sonnet | Product management, task breakdown, requirements |
| Engineer | Sonnet | Code implementation, bug fixes |
| QA | Haiku | Test writing, verification |
| Lead | Opus | Architecture, orchestration, code review |

## References

- [Product Development Flow](../../docs/product-development-flow.md) - Methodology
- [Agent Runner](../../docs/runner.md) - Execution engine docs
- [Agents](../../docs/agents.md) - Agent design principles
