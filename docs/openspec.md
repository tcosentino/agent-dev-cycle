# OpenSpec - Spec-Driven Development

## Overview

OpenSpec is a spec-driven development (SDD) framework that adds a lightweight specification layer between human intent and AI implementation. It helps ensure alignment on requirements before code is written, reducing wasted effort and improving software quality.

**Core Philosophy:**
- **Fluid not rigid** - No phase gates, update any artifact anytime
- **Iterative not waterfall** - Learn and adjust as you build
- **Easy not complex** - Lightweight setup, works with existing projects
- **Brownfield-first** - Designed for modifying existing codebases

## Installation

```bash
# Install globally (requires Node.js 20.19.0+)
npm install -g @fission-ai/openspec@latest

# Initialize in project
cd your-project
openspec init --tools claude

# Restart IDE for slash commands to take effect
```

## Key Concepts

### Changes
A **change** is a self-contained proposal for modifying the codebase. Each change lives in `openspec/changes/<change-name>/` and contains four types of artifacts:

1. **Proposal** - Why this change is needed, what will change, impact analysis
2. **Delta Specs** - Specifications describing ADDED/MODIFIED/REMOVED requirements
3. **Design** - Technical approach, architecture decisions, trade-offs
4. **Tasks** - Implementation checklist with concrete, trackable steps

### Specs
The `openspec/specs/` directory contains the **source of truth** for current system behavior. Specs are organized by capability (e.g., `user-auth/spec.md`, `data-export/spec.md`).

### Delta Specs
Instead of rewriting full specs, **delta specs** show only what's changing relative to current specs:
- `## ADDED Requirements` - New capabilities
- `## MODIFIED Requirements` - Changed behavior (must include full updated content)
- `## REMOVED Requirements` - Deprecated features (with reason and migration path)
- `## RENAMED Requirements` - Name changes only

### Schemas
A **schema** defines the workflow by specifying artifact types and their dependencies. The default `spec-driven` schema follows:
```
proposal → specs + design → tasks
```

Custom schemas can be created for different workflows (research-first, rapid-prototyping, etc.).

## Directory Structure

```
your-project/
├── openspec/
│   ├── changes/          # Active and archived changes
│   │   ├── command-palette/
│   │   │   ├── proposal.md
│   │   │   ├── design.md
│   │   │   ├── specs/
│   │   │   │   ├── command-palette/spec.md
│   │   │   │   └── keyboard-shortcuts/spec.md
│   │   │   └── tasks.md
│   │   └── archive/      # Completed changes (timestamped)
│   └── specs/            # Source of truth for current system
│       ├── user-auth/
│       │   └── spec.md
│       └── data-export/
│           └── spec.md
└── .claude/              # AI tool configurations (auto-generated)
    ├── skills/
    └── commands/
```

## Workflow

### Typical Development Cycle

1. **Start a new change**
   ```bash
   /opsx:new command-palette
   ```
   Creates `openspec/changes/command-palette/` directory

2. **Create planning artifacts**
   ```bash
   # Create next artifact based on dependencies
   /opsx:continue

   # Or fast-forward through all planning at once
   /opsx:ff
   ```

3. **Implement the change**
   ```bash
   /opsx:apply
   ```
   Agent works through tasks.md checklist

4. **Verify implementation**
   ```bash
   /opsx:verify
   ```
   Validates implementation matches artifacts

5. **Archive completed change**
   ```bash
   /opsx:archive command-palette
   ```
   Merges delta specs into main specs, moves change to archive

### Workflow Commands

| Command | Purpose |
|---------|---------|
| `/opsx:explore` | Think through ideas before committing to a change |
| `/opsx:new` | Start a new change |
| `/opsx:continue` | Create the next artifact based on dependencies |
| `/opsx:ff` | Fast-forward: create all planning artifacts at once |
| `/opsx:apply` | Implement tasks from the change |
| `/opsx:verify` | Validate implementation matches artifacts |
| `/opsx:sync` | Merge delta specs into main specs (without archiving) |
| `/opsx:archive` | Archive a completed change |
| `/opsx:bulk-archive` | Archive multiple changes at once |
| `/opsx:onboard` | Guided tutorial through the workflow |

## CLI Commands

### Setup & Browsing

```bash
# Initialize OpenSpec
openspec init --tools claude

# List changes or specs
openspec list [--specs | --changes] [--json]

# Interactive dashboard
openspec view

# Show details of a change or spec
openspec show command-palette [--json]

# Check change status
openspec status --change command-palette
```

### Validation

```bash
# Validate a specific change
openspec validate command-palette

# Validate all changes
openspec validate --all --changes

# Validate all specs
openspec validate --all --specs
```

### Schemas

```bash
# List available schemas
openspec schemas [--json]

# Create custom schema
openspec schema init my-workflow --description "Research-first workflow"

# Fork existing schema
openspec schema fork spec-driven rapid-prototyping
```

### Configuration

```bash
# View config
openspec config list

# Set config value
openspec config set core.defaultSchema spec-driven

# Edit config in $EDITOR
openspec config edit
```

## How AgentForge Uses OpenSpec

### Integration Points

1. **Feature Planning** - All new features start with `/opsx:new` to create structured specs
2. **Agent Context** - Specs provide clear requirements for AI agents to follow
3. **Knowledge Base** - Archived changes serve as historical context for future work
4. **Testing** - Each spec scenario becomes a potential test case

### Workflow in Practice

When developing a feature like the command palette:

1. **Create change**: `/opsx:new command-palette`
2. **Write proposal**: Define why, what changes, and capabilities
3. **Write specs**: Detail requirements with testable scenarios
4. **Write design**: Explain technical decisions and architecture
5. **Write tasks**: Break down implementation into checkboxes
6. **Implement**: Work through tasks, checking them off as you go
7. **Archive**: Merge specs into `openspec/specs/` for future reference

### Benefits for AgentForge

- **Alignment** - Human and AI agree on requirements before coding
- **Context** - Specs provide clear context for future agents/developers
- **Quality** - Testable scenarios ensure comprehensive coverage
- **Documentation** - Artifacts double as design docs and ADRs
- **History** - Archived changes show evolution of the system

## Best Practices

### 1. Start Small
Don't over-plan. Create minimal viable specs and iterate as you learn.

### 2. Focus on Testability
Write spec scenarios that can become actual test cases:
```markdown
#### Scenario: User opens palette with keyboard shortcut
- **WHEN** user presses Cmd+K
- **THEN** command palette appears with search input focused
```

### 3. Use Delta Specs Correctly
- **ADDED** - Brand new capabilities
- **MODIFIED** - Include FULL updated content, not just changes
- **REMOVED** - Always explain why and provide migration path

### 4. Keep Proposals Concise
Focus on "why" not "how" (1-2 pages max). Implementation details belong in design.md.

### 5. Make Tasks Actionable
Each task should be:
- Small enough to complete in one session
- Verifiable (you know when it's done)
- Properly formatted: `- [ ] 1.1 Task description`

### 6. Iterate Freely
OpenSpec is fluid - update any artifact anytime as understanding evolves. No phase gates.

### 7. Archive Regularly
Archive completed changes to keep workspace clean and merge specs into source of truth.

## Integration with Existing Tools

### Claude Code
- Slash commands: `/opsx:new`, `/opsx:apply`, etc.
- Skills automatically installed in `.claude/skills/`
- Works seamlessly with existing Claude Code workflows

### Version Control
- Commit `openspec/` directory to git
- `.claude/` can be gitignored or committed (team preference)
- Archive folder provides git-based history

### Task Management
- OpenSpec tasks.md can reference external task IDs (e.g., "AF-42")
- Tasks supplement, not replace, existing project management tools

## Troubleshooting

### Slash commands not working
Restart your IDE after running `openspec init`

### Change validation errors
Run `openspec validate command-palette --strict` to see detailed errors

### Custom schema not found
Check schema location with `openspec schema which my-schema --all`

### Artifacts not unlocking
Run `openspec status --change command-palette` to see dependency status

## Resources

- **GitHub**: https://github.com/Fission-AI/OpenSpec
- **Documentation**: https://github.com/Fission-AI/OpenSpec/tree/main/docs
- **Feedback**: https://github.com/Fission-AI/OpenSpec/issues
- **License**: MIT

## Related Documentation

- [Agent Development](./agents.md) - How agents use specs for context
- [Testing Guide](../.agentforge/TESTING.md) - Converting specs to tests
- [Architecture](../.agentforge/ARCHITECTURE.md) - System design decisions
