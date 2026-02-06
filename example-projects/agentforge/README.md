# AgentForge (Dogfood)

This is the AgentForge project being developed by AgentForge agents - dogfooding in action.

## Quick Start

```bash
# Run an agent session
cd runner
./scripts/dev.sh --docker session.dogfood.json
```

## Project Structure

```
.
├── PROJECT.md           # Goals, success criteria, current state
├── ARCHITECTURE.md      # System design and technical decisions
├── .agentforge/
│   └── agents.yaml      # Model config per agent role
├── prompts/
│   ├── system.md        # Shared context for all agents
│   ├── pm.md            # Product Manager prompt
│   ├── engineer.md      # Engineer prompt
│   ├── qa.md            # QA prompt
│   └── lead.md          # Tech Lead prompt
├── state/
│   └── progress.yaml    # Current phase and milestones
├── memory/
│   ├── daily-log.md     # Activity log
│   ├── decisions.md     # Architectural decisions
│   └── blockers.md      # Known issues
└── sessions/
    └── {agent}/{runId}/ # Session artifacts
```

## Current Focus

Sprint 1: Server-side task persistence
- Task API endpoints
- Orchestrator logic
- Agent handoff protocol

See PROJECT.md for full details.
