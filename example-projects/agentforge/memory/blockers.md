# Blockers and Known Issues

## Active Blockers

### B-001: No Server-Side Task Persistence
**Reported**: 2026-02-05
**Impact**: High
**Description**: The `agentforge` CLI makes HTTP calls to a server that doesn't exist yet. Task create/update commands fail.
**Workaround**: Agents can document tasks in their notepad rather than using the CLI.
**Resolution**: Implement task API endpoints in AgentForge server.

---

## Resolved Blockers

### B-000: Claude Code Hanging on Stdin
**Reported**: 2026-02-05
**Resolved**: 2026-02-05
**Description**: Claude Code process would hang at 0% CPU when spawned from runner.
**Root Cause**: Stdin was being piped, causing Claude Code to wait for input.
**Resolution**: Changed stdio config to `['ignore', 'pipe', 'pipe']` in `claude.ts`.
