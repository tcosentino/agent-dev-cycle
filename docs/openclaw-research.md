# OpenClaw Session & Memory Architecture Research

**Source:** https://github.com/openclaw/openclaw
**Date:** 2026-02-05
**Context:** Research into OpenClaw's session state management and memory architecture, analyzed for applicability to AgentForge's multi-agent software development platform.

---

## OpenClaw's Four Memory Layers

### Layer 1: Session Transcript (The Raw Record)

Every message, tool call, and tool result gets appended to a JSONL file on disk:

```
~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl
```

This is append-only and never rewritten. It's the audit trail -- everything that happened in a conversation. Think of it as a database transaction log.

**AgentForge parallel**: Each agent run (e.g., "Coding Agent works on user auth feature") would produce a transcript. This is what customers would watch in the observable interface. Keep these forever for accountability and debugging.

### Layer 2: In-Memory Context (What the LLM Actually Sees)

Before each LLM call, the system assembles what goes into the context window from:

1. System prompt (rebuilt every run)
2. Conversation history (loaded from JSONL)
3. Tool call results

The problem is this grows unboundedly. So two mechanisms trim it **in-memory only** (never touching the JSONL on disk):

#### Pruning

Targets old tool results specifically. Uses a cache-TTL approach:

- Only `toolResult` messages get trimmed
- Image blocks are never pruned
- Last 3 assistant messages are protected
- Results get either soft-trimmed (head/tail with "...") or hard-cleared with a placeholder
- Trigger: cache-TTL mode activates when last Anthropic API call exceeds a time threshold (default 5 minutes)

#### Compaction

Summarizes older conversation into a compact summary entry:

- Fires automatically when approaching token limits
- Keeps recent messages intact, replaces older history with an LLM-generated summary
- The summary **does** persist back to the JSONL (it's a new entry), so future session loads start from the compacted state
- Users can also trigger manually with `/compact Focus on decisions and open questions`

**Key insight: pruning is per-request and ephemeral; compaction is persistent and changes the baseline.**

### Layer 3: Workspace Memory (Durable Knowledge)

Durable knowledge stored as plain Markdown files in the agent workspace:

- **`MEMORY.md`** -- Curated long-term facts (user preferences, key decisions, environment details). Loaded in private sessions only.
- **`memory/YYYY-MM-DD.md`** -- Daily append-only logs. Today's + yesterday's file loaded at session start.

The agent is explicitly prompted to write important things to these files. Writing triggers:

- Recording decisions and preferences -> `MEMORY.md`
- Logging daily context and running notes -> dated daily file
- User explicitly requests to "remember this"

**Pre-compaction memory flush**: Before context gets compacted, a silent agentic turn runs telling the model "you are about to lose context -- write anything durable to memory files now." This prevents knowledge loss.

### Layer 4: Semantic Search (Recall Across Time)

For retrieving old memories not in the current context window:

- Markdown files chunked (~400 tokens) and embedded
- **Vector search** (semantic similarity) + **BM25** (keyword/exact match) combined with weighted scoring
- Stored in per-agent SQLite with optional `sqlite-vec` acceleration
- Two tools: `memory_search` (find relevant snippets) and `memory_get` (read specific files)

---

## How This Maps to AgentForge

### Key Difference

OpenClaw's memory is per-agent and personal. AgentForge's memory needs to be **per-project and shared**, with agent-specific views.

### Three Memory Scopes

| Scope | What lives here | Who reads it |
|---|---|---|
| **Project memory** | Requirements, architecture decisions, API contracts, deployment config | All agents |
| **Phase memory** | Discovery findings, shaped pitch, build progress, delivery checklist | Agents in current + later phases |
| **Agent memory** | Agent-specific working notes, partial progress, tool preferences | Only that agent |

### The Hard Problem: Context Across Agent Handoffs

When the Planning Agent finishes Discovery and the Coding Agent picks up for Building, the Coding Agent cannot load the Planning Agent's full transcript -- it would blow the context window and most of it is irrelevant. You need a **handoff artifact** -- a structured summary of what matters.

This is essentially a forced compaction at phase boundaries, but with a twist: it's not just summarizing for the same agent, it's **translating for a different agent with different concerns**.

- The Planning Agent cares about user needs and market context
- The Coding Agent cares about technical requirements, API contracts, and acceptance criteria
- The handoff needs to transform one into the other

### Proposed File Structure

```
project/
  PROJECT.md          # Living doc: requirements, constraints, success metrics
  ARCHITECTURE.md     # Technical decisions, stack choices, data models
  STATUS.md           # Current phase, blocklist, open questions

  phases/
    discovery/
      transcript.jsonl        # Raw record
      findings.md             # Handoff artifact -> Shaping
    shaping/
      transcript.jsonl
      pitch.md                # Handoff artifact -> Building
    building/
      coding/
        transcript.jsonl
        working-notes.md      # Agent-specific scratchpad
      testing/
        transcript.jsonl
        test-results.md
      review/
        transcript.jsonl
    delivery/
      transcript.jsonl
      deployment-log.md

  memory/
    YYYY-MM-DD.md             # Daily cross-agent project log
```

### Per-Agent Context Injection

Each agent gets:

1. **Project-level context** injected into system prompt (PROJECT.md, ARCHITECTURE.md, STATUS.md)
2. **The handoff artifact** from the previous phase
3. **Its own transcript** with pruning + compaction
4. **`memory_search`** across the full `memory/` directory for recall

The pre-compaction memory flush pattern is directly useful -- when any agent is about to hit context limits, it should dump important state to its working notes and the project-level files before compaction fires.

### PM as Orchestrator

The PM agent acts as the "parent" that:

- Receives structured status updates from each agent (like OpenClaw's announce step with status/summary/stats/cost)
- Maintains `STATUS.md` as the source of truth for project state
- Decides when a phase is complete and triggers handoff artifact generation
- Routes customer questions to the right agent or answers from project context

This keeps the PM's context window manageable -- it reads summaries, not full transcripts.

---

## Other Relevant OpenClaw Patterns

### Agent Loop

Pipeline: `intake -> context assembly -> model inference -> tool execution -> streaming replies -> persistence`

- Runs serialized per session via queue lanes, preventing tool/session race conditions
- Each run gets a `runId` and returns immediately -- caller can poll with `agent.wait`
- 600-second default timeout with abort, plus configurable per-run timeouts
- Compaction happens automatically when approaching token limits, with hooks before/after

### Sub-Agent Spawning

- Sub-agents spawn via `sessions_spawn` and run in their own isolated session
- Non-blocking -- parent gets back `{ status: "accepted", runId, childSessionKey }` immediately
- Up to 8 concurrent sub-agents by default (`maxConcurrent`)
- **Cannot spawn further sub-agents** (no recursive fan-out) -- deliberate design constraint
- Get all tools **except session management tools** (can't spawn siblings or read other sessions)
- Results announced back to parent's chat channel with status, summary, stats, cost

### System Prompt Assembly

Custom system prompt built per run from composable pieces. Bootstrap files:

- `AGENTS.md` -- Operating instructions and memory
- `SOUL.md` -- Persona, boundaries, tone
- `TOOLS.md` -- User-maintained tool notes
- `IDENTITY.md` -- Agent name/vibe
- `USER.md` -- User profile
- `BOOTSTRAP.md` -- One-time first-run ritual

Large files auto-truncated at 20K chars.

### Tool Policy

- Allow/deny per agent
- Shell execution has approval workflow (`exec-approvals`)
- Tool results sanitized for size before adding to context
- Non-main sessions can run in Docker sandboxes with restricted tool allowlists

### Hook System

Lifecycle hooks available:

- `before_agent_start` / `agent_end`
- `before_tool_call` / `after_tool_call`
- `before_compaction` / `after_compaction`
- `message_received` / `message_sending` / `message_sent`
- `session_start` / `session_end`
- `gateway_start` / `gateway_stop`

**AgentForge use**: Useful for implementing human checkpoints in Phase 1. A `before_tool_call` hook could pause for human review on high-risk operations. Unlike OpenClaw where hooks enable user extensibility, AgentForge would use hooks internally for orchestration control -- the system should not be self-evolving.