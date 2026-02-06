# Architectural Decisions

## AD-001: Git as Source of Truth

**Date**: 2026-02-04
**Status**: Accepted
**Context**: Need to decide where project state lives - database, files, or git.

**Decision**: All project state lives in git:
- Task definitions in markdown or yaml files
- Session notes in `sessions/` directory
- Memory in `memory/` directory
- Progress in `state/progress.yaml`

**Rationale**:
- Full version history for free
- Easy rollback if agent makes mistakes
- Transparency - customers can see everything
- No separate database to manage
- Works offline

**Consequences**:
- Need merge strategy for concurrent changes
- Large files (transcripts) may bloat repo
- Query operations require file parsing

---

## AD-002: CLI over MCP for Agent Communication

**Date**: 2026-02-04
**Status**: Accepted
**Context**: Agents need to communicate with the server (update tasks, post messages). Options: MCP protocol or bash CLI.

**Decision**: Use a bash CLI (`agentforge`) that agents invoke via shell commands.

**Rationale**:
- Bash is already available to Claude Code
- Simpler to implement and debug
- Easier to test independently
- No MCP server setup required

**Consequences**:
- Slightly more verbose than native tool calls
- Depends on network access from container
- Need to handle CLI failures gracefully

---

## AD-003: Session-Based Execution

**Date**: 2026-02-04
**Status**: Accepted
**Context**: How should agents operate - long-running daemons or discrete sessions?

**Decision**: Each agent run is a discrete session with:
- Clear inputs (task prompt, context files)
- Clear outputs (code changes, notes, transcript)
- Defined start and end

**Rationale**:
- Easier to reason about and debug
- Clear cost per session
- Can retry failed sessions
- Supports context compaction between sessions

**Consequences**:
- No real-time collaboration between agents
- Handoff between sessions requires explicit state passing
- Long tasks may need multiple sessions

---

## AD-004: Model Selection by Role

**Date**: 2026-02-04
**Status**: Accepted
**Context**: Which Claude model should each agent use?

**Decision**:
- PM: Sonnet (balanced reasoning for task breakdown)
- Engineer: Sonnet (good code generation)
- QA: Haiku (fast, simple test generation)
- Lead: Opus (complex reasoning, orchestration)

**Rationale**:
- Match model capability to task complexity
- Opus for strategic/architectural decisions
- Sonnet for implementation work
- Haiku for high-volume, simpler tasks

**Consequences**:
- Higher cost for Lead/Opus sessions
- May need to revisit if Haiku struggles with QA tasks
