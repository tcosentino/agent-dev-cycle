# Agent Structure

Each agent has its own folder with the following structure:

```
.agentforge/agents/{agent-id}/
  config.json      # Agent configuration
  prompt.md        # Agent-specific prompt/instructions
  sessions/        # Session history for this agent
    {session-id}/
      transcript.jsonl
      notepad.md
```

## Agent Config

The `config.json` file contains:

```json
{
  "id": "pm",
  "displayName": "Product Manager",
  "model": "sonnet",
  "maxTokens": 32000,
  "orchestrator": false
}
```

Fields:
- `id` (required): Unique identifier for the agent
- `displayName` (optional): Human-readable name shown in UI
- `model` (required): Claude model to use (opus, sonnet, haiku)
- `maxTokens` (required): Maximum tokens for context
- `orchestrator` (optional): Whether this agent can coordinate other agents

## Prompt File

The `prompt.md` file contains the agent's system prompt and instructions.
This is loaded as the "role-specific prompt" in the agent's context.

## Sessions

Each agent's session history is stored in their `sessions/` folder.
Session folders are named with the pattern `{agent-id}-{number}`.

Each session contains:
- `transcript.jsonl`: Full conversation transcript
- `notepad.md`: Agent's working notes and wishlist

## Example Structure

```
.agentforge/agents/
  pm/
    config.json
    prompt.md
    sessions/
      pm-001/
        transcript.jsonl
        notepad.md
      pm-002/
        transcript.jsonl
        notepad.md
  engineer/
    config.json
    prompt.md
    sessions/
  qa/
    config.json
    prompt.md
    sessions/
```
