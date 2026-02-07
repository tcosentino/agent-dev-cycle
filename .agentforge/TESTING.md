# Testing Your .agentforge Structure

This document explains how to validate your AgentForge configuration.

## Quick Validation

Run this command to validate your `.agentforge` directory structure:

```bash
yarn test:structure
```

This will check:
- ✅ All required files exist
- ✅ Config files are valid JSON
- ✅ Agent IDs are unique
- ✅ Prompts are not empty
- ✅ Sessions are properly structured

## What Gets Validated

### Agent Configuration

Each agent in `.agentforge/agents/{agent-id}/` must have:

1. **config.json** - Agent configuration
   ```json
   {
     "id": "pm",
     "displayName": "Product Manager",
     "model": "sonnet",
     "maxTokens": 32000
   }
   ```

   Required fields:
   - `id` (string) - Must match directory name
   - `model` (string) - Must be: `opus`, `sonnet`, or `haiku`
   - `maxTokens` (number) - Must be positive

   Optional fields:
   - `displayName` (string) - Human-readable name
   - `orchestrator` (boolean) - Can coordinate other agents

2. **prompt.md** - Agent instructions
   - Must not be empty
   - Contains the agent's system prompt

3. **sessions/** - Session history
   - Directory for storing agent sessions
   - Each session should have `transcript.jsonl` and/or `notepad.md`

### Directory Structure

```
.agentforge/
  agents/
    README.md              ← Documentation
    {agent-id}/
      config.json         ← Configuration
      prompt.md           ← Instructions
      sessions/           ← History
        {agent-id}-001/
          transcript.jsonl
          notepad.md
```

## Common Issues

### Invalid JSON

**Error:** `Failed to parse config.json: Unexpected token`

**Fix:** Validate your JSON:
```bash
cat .agentforge/agents/pm/config.json | jq .
```

### Missing Files

**Error:** `{agent}/config.json should exist`

**Fix:** Create the missing file:
```bash
cat > .agentforge/agents/pm/config.json << 'EOF'
{
  "id": "pm",
  "displayName": "PM",
  "model": "sonnet",
  "maxTokens": 32000
}
EOF
```

### Agent ID Mismatch

**Error:** `config.json id should match directory name`

**Fix:** Ensure the `id` field matches the folder name:
```bash
# If folder is "pm", config.json should have:
{"id": "pm", ...}
```

### Duplicate Agent IDs

**Error:** `Found duplicate agent ids`

**Fix:** Each agent must have a unique ID. Check all config files.

## Running Tests in CI/CD

Add to your GitHub Actions workflow:

```yaml
- name: Validate AgentForge Structure
  run: yarn test:structure
```

This ensures all commits maintain valid structure.

## Adding a New Agent

When adding a new agent:

1. Create the directory structure:
   ```bash
   mkdir -p .agentforge/agents/new-agent/sessions
   ```

2. Create config.json:
   ```bash
   cat > .agentforge/agents/new-agent/config.json << 'EOF'
   {
     "id": "new-agent",
     "displayName": "New Agent",
     "model": "sonnet",
     "maxTokens": 50000
   }
   EOF
   ```

3. Create prompt.md:
   ```bash
   echo "# New Agent\n\nYour instructions here..." > .agentforge/agents/new-agent/prompt.md
   ```

4. Validate:
   ```bash
   yarn test:structure
   ```

## Test Output

Successful run:
```
✓ .agentforge directory should exist
✓ .agentforge/agents directory should exist
✓ each agent folder should have required files
✓ agent config.json files should be valid JSON
✓ agent prompt.md files should not be empty
✓ agent config.json id should match directory name
✓ session directories should have valid structure
✓ no duplicate agent ids across configs
✓ README.md should exist in agents directory
✓ should support legacy agents.yaml if present

10 passed (816ms)
```

## More Information

See [tests/README.md](/tests/README.md) for complete test documentation.
