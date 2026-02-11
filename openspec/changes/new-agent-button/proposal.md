# New Agent Button - Proposal

## Why

Currently, adding a new agent to an AgentForge project requires:
- Manually creating a new `.md` file in the project repo
- Understanding the agent prompt structure
- Knowing where to place the file (`agents/` directory)
- Manually committing and pushing changes
- Manually reloading the UI to see the new agent

This creates friction for users who want to quickly create and iterate on agents. **Users should be able to add new agents with a single button click** and a guided creation flow.

## What Changes

Add a **"New Agent" button** to the agents pane in ProjectViewer that:
1. Opens a modal with an agent creation form
2. Provides a starter template with recommended sections
3. Allows users to edit the agent prompt inline
4. Commits the new agent file to the project repo
5. Reloads the agents pane to show the new agent

### User Flow

1. **User clicks "New Agent" button** in agents pane
2. **Modal opens** with agent creation form:
   - Agent name field (e.g., "code-reviewer", "test-writer")
   - Agent type dropdown (optional: architect, engineer, qa, etc.)
   - Prompt editor (pre-filled with starter template)
3. **User edits** the prompt to customize the agent
4. **User clicks "Create Agent"**
5. **System creates** `agents/{name}.md` file in project repo
6. **System commits** changes with message "Add {name} agent"
7. **System reloads** agents pane to show new agent
8. **User sees** new agent in the list and can start using it

### Starter Template

The prompt editor should be pre-filled with a recommended structure:

```markdown
# {Agent Name}

## Role
You are a {role description} agent. Your primary responsibility is...

## Responsibilities
- Responsibility 1
- Responsibility 2
- Responsibility 3

## Guidelines
- Guideline 1
- Guideline 2
- Guideline 3

## Context
{Optional: Project-specific context or constraints}

## Tools
{Optional: Specific tools this agent should use}

## Communication Style
{Optional: How this agent should communicate}
```

Users can customize this template fully in the modal before creating the agent.

## Capabilities

### New Capabilities
- `create-agent-modal`: Modal UI for creating new agents
- `agent-file-management`: Create agent files in project repo
- `agent-repo-sync`: Commit agent files and reload agents pane

### Modified Capabilities
- `project-viewer`: Add "New Agent" button to agents sidebar
- `agent-list`: Reload after new agent creation

## Impact

**UI Changes:**
- Add "New Agent" button to agents sidebar header (next to existing + icons)
- New modal component `CreateAgentModal` with form fields
- Pre-filled prompt editor with starter template
- Success notification after agent creation

**API Changes:**
- New endpoint: `POST /api/projects/:projectId/agents`
  - Accepts: `{ name, prompt, type? }`
  - Returns: `{ agent, commitSha }`
- New endpoint: `POST /api/projects/:projectId/agents/reload`
  - Refreshes agent list from repo

**Backend Changes:**
- Agent file creation logic (write to `agents/{name}.md`)
- Git operations (commit and push new file)
- Agent validation (check for duplicate names, invalid characters)
- Template generation

**No Breaking Changes:**
- All changes are additive
- Existing agents continue to work unchanged

## Risks & Mitigations

**[Risk]** User creates agent with invalid name (e.g., spaces, special chars)
→ **Mitigation:** Validate name field (alphanumeric + hyphens/underscores only), show error message

**[Risk]** Agent file already exists with same name
→ **Mitigation:** Check for duplicates before creating, show error or suggest alternate name

**[Risk]** Git commit fails (permissions, conflicts, etc.)
→ **Mitigation:** Show error message, allow retry, provide manual fallback instructions

**[Risk]** User closes modal after editing but before creating
→ **Mitigation:** Show confirmation dialog if prompt has been edited

**[Risk]** Template might not fit all use cases
→ **Mitigation:** Make template fully editable and provide clear examples in docs

## MVP Scope

For initial implementation:
1. **"New Agent" button** in agents sidebar
2. **Modal with form**:
   - Name field (required)
   - Type dropdown (optional)
   - Prompt editor with starter template
3. **File creation** in project repo (`agents/{name}.md`)
4. **Git commit** with default message
5. **Reload agents pane** after creation

**Defer to future:**
- Agent templates library (multiple pre-built templates)
- Agent duplication (copy existing agent as starting point)
- Multi-file agent support (agent + config files)
- Advanced Git options (branch selection, custom commit messages)
- Agent validation/testing before commit

## Success Criteria

**A user can:**
1. Create a new agent in < 2 minutes
2. See the starter template and understand how to customize it
3. Create the agent without touching Git or the file system
4. Immediately start using the new agent in their project

**Metrics to track:**
- Number of agents created via UI vs manually
- Time from button click to agent creation
- Agent creation success rate vs errors
- Starter template usage vs full customization
