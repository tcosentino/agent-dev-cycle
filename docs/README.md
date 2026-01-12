# AgentForge Documentation

## Vision

The next generation of software development isn't AI replacing developers—it's **teams of developers working with AI** to build faster and better. AgentForge is the shepherd through this transition.

We provide the **tools a team needs** (project management, components, workflows) **coupled with AI agents** that can execute alongside humans. The key differentiator: AgentForge includes an **actual execution environment** where code runs, tests execute, and deployments happen—not just planning and code generation.

### Competitive Landscape

The market is fragmenting across the human→AI progression spectrum. Most tools optimize for one phase; AgentForge is designed to **carry teams through all three**.

#### Feature Comparison

| Platform | Planning | Code | Execution | AI Agents |
|----------|----------|------|-----------|-----------|
| GitHub | ✓ Issues/Projects | ✓ Repos | ✗ Limited Actions | ✓ Copilot |
| Linear/Jira | ✓ Strong | ✗ | ✗ | ✗ |
| Vercel/Netlify | ✗ | ✗ | ✓ Deploys | ✗ |
| Replit | ✗ | ✓ | ✓ Runtime | ✓ Agent |
| **AgentForge** | ✓ | ✓ | ✓ Full env | ✓ Team |

#### Phase Positioning

| Platform | Phase 1 | Phase 2 | Phase 3 | Progression Path |
|----------|---------|---------|---------|------------------|
| **GitHub** | ✓ Strong | ◐ Partial | ✗ | Stuck—no execution layer |
| **Linear/Jira** | ✓ Planning only | ✗ | ✗ | No AI, no code |
| **Cursor/Windsurf** | ✓ Coding assist | ◐ | ✗ | Single-agent, no orchestration |
| **Replit** | ◐ | ◐ | ◐ | Has pieces, not integrated |
| **AgentForge** | ✓ | ✓ | ✓ | **Full progression** |

#### Why Competitors Get Stuck

**GitHub** has the best Phase 1 story—issues, PRs, Copilot. But they're missing:
- Integrated execution (Actions is CI, not runtime)
- Agent orchestration (Copilot is single-agent assist)
- The feedback loop (can't validate what agents build)

They can't progress to Phase 2/3 without agents that **run and verify** their own work.

**Cursor/Windsurf** are powerful coding assistants but:
- Single agent, not a team
- No project management layer
- Human must validate everything
- Stuck at "AI assists human" forever

**Replit** is closest—they have code + execution + an agent. But:
- No project management / planning layer
- Single agent, not specialized roles
- No graduated autonomy model
- Not designed for the Phase 1→3 transition

#### AgentForge's Moat

1. **Full loop**: Plan → Build → Run → Validate → Deploy
2. **Agent team**: Specialized roles that coordinate (not one agent doing everything)
3. **Progression by design**: Built to transition from human-heavy to autonomous
4. **Trust calibration**: Graduated autonomy based on measured agreement
5. **Gap recording**: System improves itself by logging what it can't do

The key insight: **tools optimized for Phase 1 can't reach Phase 3**. You need execution + agent orchestration + trust measurement from day one. AgentForge is built for the destination, not just the starting point.

---

## Executive Summary

AgentForge is an AI-powered custom software development platform that deploys a coordinated team of specialized AI agents to build software from requirements to production. Instead of a single AI assistant, AgentForge orchestrates multiple agents working together—each with distinct roles and responsibilities—to deliver complete software solutions.

### The AI Team

| Agent | Role |
|-------|------|
| **Product Manager** | Gathers requirements, creates project plans, prioritizes features |
| **Engineer** | Builds and implements code, APIs, database schemas, and UI components |
| **QA Engineer** | Tests and validates all artifacts, ensures quality standards |
| **Tech Lead** | Coordinates the team, reviews work, makes architectural decisions |

### How It Works

1. **Requirements Gathering** — The PM agent engages with stakeholders to understand needs
2. **Project Planning** — Requirements are broken into actionable tasks on a Kanban board
3. **Development** — Engineers build artifacts (APIs, jobs, databases, UI) in parallel
4. **Quality Assurance** — QA validates everything before delivery

### Key Benefits

- **End-to-end automation** — From idea to working software
- **Specialized expertise** — Each agent focuses on what it does best
- **Built-in quality** — QA is integrated into the workflow, not an afterthought
- **Transparent process** — Watch the team collaborate in real-time

---

## Capability Gap Recording

Agents are instructed to **log capability gaps** whenever they encounter a situation where:

1. **A human in that role could do something the agent cannot** — e.g., "A human PM would call the client to clarify this ambiguous requirement"
2. **A missing building block would enable a task** — e.g., "I need a `useDateRangePicker` component but it doesn't exist yet"
3. **External access would help** — e.g., "I'd look up the competitor's pricing page for reference"
4. **Domain knowledge is missing** — e.g., "A human engineer would know this company's deployment process"

### Why This Matters

- **Builds the roadmap** — Gaps become backlog items for new components, integrations, or capabilities
- **Identifies automation boundaries** — Shows where human involvement adds real value
- **Improves over time** — Frequently logged gaps get prioritized for implementation
- **Training signal** — Gaps + human solutions = learning opportunities

### Gap Log Format

```typescript
interface CapabilityGap {
  agent: 'pm' | 'engineer' | 'qa' | 'tech-lead'
  timestamp: string
  task: string                    // What was the agent trying to do?
  gap: string                     // What couldn't it do?
  humanWouldDo: string            // How would a human handle this?
  category: 'component' | 'integration' | 'knowledge' | 'access' | 'judgment'
  workaround?: string             // Did the agent find an alternative?
  blocked: boolean                // Did this stop progress?
}
```

### Example Gaps

| Agent | Gap | Human Would... | Category |
|-------|-----|----------------|----------|
| PM | Can't gauge stakeholder tone/frustration | Read body language, adjust approach | judgment |
| Engineer | No `useFileUpload` hook available | Build it or use a library | component |
| QA | Can't test on physical mobile devices | Use device lab, test real interactions | access |
| Tech Lead | Unsure if approach fits company culture | Ask team, know history | knowledge |

### Graduated Autonomy

Gap logging feeds into **graduated autonomy** — the system starts with more human checkpoints, then reduces them as AI-human agreement improves:

```
High gaps / Low trust    →  Human approves most decisions
Decreasing gaps          →  Async review (AI proceeds, human validates)
Low gaps / High trust    →  Auto-proceed, human spot-checks
Novel situation          →  Always escalate (even if confident)
```

Track agreement rates by decision category. When AI choices consistently match human choices, reduce oversight for that category.

---

## Product Progression Model

AgentForge itself evolves through phases—starting as a tool that helps humans work with AI agents, transitioning toward a fully autonomous agent team.

### Phase 1: AgentForge as Your PM

In the early phase, **AgentForge acts as the Product Manager** for your AI development team:

- Spins up specialized agents (Engineer, QA, Tech Lead) on your behalf
- Coordinates work between agents and humans
- Humans interface directly with agents, review outputs, make decisions
- High human involvement—agents assist, humans drive

```
┌─────────────────────────────────────────────────────┐
│                      Human                          │
│                        ↓                            │
│    ┌─────────────────────────────────────────┐     │
│    │         AgentForge (as PM)              │     │
│    │  • Spins up agents                      │     │
│    │  • Coordinates work                     │     │
│    │  • Surfaces decisions to human          │     │
│    └─────────────────────────────────────────┘     │
│         ↓              ↓              ↓            │
│    [Engineer]      [QA]        [Tech Lead]         │
│         ↑              ↑              ↑            │
│         └──────── Human reviews ──────┘            │
└─────────────────────────────────────────────────────┘
```

**What humans do:** Review code, approve decisions, clarify requirements, handle edge cases

**What agents do:** Draft code, run tests, surface issues, execute defined tasks

### Phase 2: Human in the Loop

As trust builds and gaps decrease:

- Agents execute more autonomously
- Humans review async (after the fact) rather than approve in advance
- AgentForge handles routine decisions, escalates only exceptions
- Agents learn from human corrections

```
┌─────────────────────────────────────────────────────┐
│    ┌─────────────────────────────────────────┐     │
│    │           AgentForge (PM)               │     │
│    │  • Autonomous routine decisions         │     │
│    │  • Escalates exceptions to human        │     │
│    └─────────────────────────────────────────┘     │
│         ↓              ↓              ↓            │
│    [Engineer]      [QA]        [Tech Lead]         │
│         │              │              │            │
│         └────── Async human review ───┘            │
│                        ↓                            │
│                     Human                           │
│              (spot-checks, exceptions)              │
└─────────────────────────────────────────────────────┘
```

**What humans do:** Spot-check outputs, handle escalations, set direction

**What agents do:** Execute end-to-end, self-validate, request help when uncertain

### Phase 3: Autonomous Agent Team

The end state—agents handle everything, humans are customers:

- Full agent team operates independently
- Human provides requirements, receives working software
- Agents self-coordinate, self-review, self-deploy
- Human involvement only for business decisions

```
┌─────────────────────────────────────────────────────┐
│                      Human                          │
│              (requirements in,                      │
│               software out)                         │
│                        ↓                            │
│    ┌─────────────────────────────────────────┐     │
│    │           AgentForge Team               │     │
│    │                                         │     │
│    │   [PM] ←→ [Engineer] ←→ [Tech Lead]    │     │
│    │            ↓                            │     │
│    │          [QA]                           │     │
│    │                                         │     │
│    │   Self-coordinating, self-validating   │     │
│    └─────────────────────────────────────────┘     │
│                        ↓                            │
│                Working Software                     │
└─────────────────────────────────────────────────────┘
```

**What humans do:** Define what they want, accept delivery

**What agents do:** Everything else

### Measuring Progression

| Metric | Phase 1 | Phase 2 | Phase 3 |
|--------|---------|---------|---------|
| Human decisions/day | High (50+) | Medium (10-20) | Low (1-5) |
| Agent autonomy % | 20-40% | 60-80% | 95%+ |
| Review mode | Pre-approval | Async review | Exception only |
| Capability gaps/week | Many | Decreasing | Rare |
| Human-agent agreement | Tracking | 80%+ | 95%+ |

The transition is **per-category**—some task types reach Phase 3 while others are still in Phase 1. A team might have autonomous test writing (Phase 3) but human-reviewed architecture decisions (Phase 1).

---

## Contents

- [Architecture](./architecture.md) - System architecture and component overview
- [Workflow](./workflow.md) - How the development process works
- [Agents](./agents.md) - AI agent roles and responsibilities
- [UI Components](./ui-components.md) - Functional/visual component separation
- [API](./api.md) - API specifications (future)

## Quick Links

- [Getting Started](./getting-started.md)
- [Contributing](./contributing.md)
