# AgentForge Example Projects

This directory contains example AgentForge projects as git submodules.

## Available Examples

### Todo App
**Location:** `examples/todo-app/`
**Repository:** https://github.com/tcosentino/agentforge-example-todo-app
**Description:** A simple todo list application built with AgentForge agents.

**Structure:** Legacy (needs migration to new structure)
- Uses `agents.yaml` instead of individual config files
- Prompts stored in `prompts/` instead of `.agentforge/agents/{id}/`
- Sessions stored in `sessions/` instead of agent-specific folders

## Cloning Examples

When cloning this repository, use `--recursive` to include submodules:

```bash
git clone --recursive https://github.com/your-org/agent-dev-cycle
```

Or after cloning:

```bash
git submodule update --init --recursive
```

## Updating Examples

Pull latest changes from example repositories:

```bash
# Update all submodules
git submodule update --remote

# Update specific example
cd examples/todo-app
git pull origin main
```

## Adding New Examples

To add a new example project as a submodule:

```bash
git submodule add https://github.com/your-org/example-name examples/example-name
git commit -m "Add example-name to examples"
```

## Migration Status

### New Structure (Ready to Use)
- ✅ `todo-app` - Migrated to `.agentforge/agents/` structure (commit e080186)

### Legacy Structure (Needs Migration)
- None - all examples migrated!

## New Structure Format

Example projects should follow the new `.agentforge/agents/` structure:

```
.agentforge/
  agents/
    {agent-id}/
      config.json       # Agent configuration
      prompt.md         # Agent instructions
      sessions/         # Session history
```

See [.agentforge/TESTING.md](../.agentforge/TESTING.md) for validation and structure details.

## Using Examples

Each example can be opened in the AgentForge UI:

1. Start the dev server:
   ```bash
   yarn dev
   ```

2. Open http://localhost:5173

3. The example projects should appear in the project list if they have `.agentforge/` directories

## Running Structure Tests on Examples

Validate example project structure:

```bash
cd examples/todo-app
yarn test:structure  # Run from main repo root
```

## Contributing Examples

When creating example projects:

1. Use the new `.agentforge/agents/{id}/` structure
2. Include clear README with setup instructions
3. Add meaningful agent prompts and sessions
4. Test with structure validation before publishing
5. Keep examples focused on demonstrating specific features

## Example Project Checklist

- [ ] Follows new `.agentforge/agents/` structure
- [ ] Has clear PROJECT.md and ARCHITECTURE.md
- [ ] Passes `yarn test:structure` validation
- [ ] Includes at least one complete agent session
- [ ] Has comprehensive agent prompts
- [ ] README explains what the example demonstrates
