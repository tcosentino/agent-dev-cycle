# New Agent Button - Design

## Context

AgentForge projects use markdown files in the `agents/` directory to define agent prompts. Currently, users must manually create these files. We need a guided UI flow to make agent creation accessible and fast.

## Goals / Non-Goals

**Goals:**
- One-click agent creation from UI
- Pre-filled starter template with recommended structure
- Automatic file creation and Git commit
- Immediate visibility of new agent in UI

**Non-Goals:**
- Multi-file agent support (defer to future)
- Advanced Git workflow (branching, PRs) in MVP
- Agent validation/testing infrastructure
- Template library with multiple options

## Decisions

### Decision 1: Modal vs dedicated page
**Choice:** Modal dialog

**Rationale:**
- Faster workflow (no navigation away from project view)
- Less context switching
- Follows common UX patterns (GitHub, Linear, etc.)
- Can be dismissed easily

**Alternative considered:** Dedicated "/new-agent" page
- More space for complex forms
- Better for multi-step workflows
- Overkill for simple agent creation

### Decision 2: Inline prompt editor vs file upload
**Choice:** Inline editor with pre-filled template

**Rationale:**
- Lower barrier to entry (no external editor needed)
- Guided experience (users see recommended structure)
- Immediate preview of what will be created
- Can still copy/paste from external editor if desired

**Alternative considered:** File upload
- Supports advanced users with existing prompts
- Doesn't guide new users
- Can be added as secondary option later

### Decision 3: Auto-commit vs manual commit
**Choice:** Auto-commit with default message

**Rationale:**
- Reduces steps (one-click creation)
- Simplifies UX (no Git knowledge required)
- Follows principle of least friction
- Commit message is predictable and informative

**Alternative considered:** Let user write commit message
- More control for advanced users
- Adds complexity to UI
- Most users will use default anyway

### Decision 4: Template structure
**Choice:** Section-based template with Role, Responsibilities, Guidelines, Context, Tools, Communication Style

**Rationale:**
- Clear structure guides prompt engineering
- Flexible (all sections are optional)
- Based on best practices observed in existing agents
- Easy to customize by removing unused sections

**Alternative considered:** Free-form blank template
- Maximum flexibility
- No guidance for new users
- Misses opportunity to teach good prompt structure

### Decision 5: Agent naming convention
**Choice:** kebab-case (e.g., "code-reviewer", "test-writer")

**Rationale:**
- File system friendly
- URL-safe (if agents become addressable)
- Follows common naming conventions in code
- Easy to validate

**Constraints:**
- Alphanumeric + hyphens/underscores only
- No spaces or special characters
- Must be unique within project

## Architecture

### Components

**UI Layer:**
```
ProjectViewer (agents sidebar)
  └─ "New Agent" button
       └─ CreateAgentModal
            ├─ AgentNameField (text input)
            ├─ AgentTypeDropdown (optional)
            └─ PromptEditor (textarea/CodeMirror)
```

**API Layer:**
```
POST /api/projects/:projectId/agents
  └─ AgentCreationService
       ├─ validateAgentName()
       ├─ checkDuplicates()
       ├─ generateTemplate()
       ├─ createAgentFile()
       ├─ commitToRepo()
       └─ notifySuccess()
```

**File System:**
```
{projectRepo}/
  agents/
    {agent-name}.md  # New file created here
```

### Data Flow

1. **User clicks "New Agent"**
   - ProjectViewer renders CreateAgentModal
   - Modal pre-fills prompt editor with starter template

2. **User fills form**
   - Name field: validated on blur
   - Type dropdown: optional, suggests common types
   - Prompt editor: users customize template

3. **User clicks "Create Agent"**
   - Frontend validates form
   - POST request to `/api/projects/:projectId/agents`
   - Backend creates file in repo
   - Backend commits changes
   - Backend returns success + agent metadata

4. **UI updates**
   - Modal closes
   - Success toast notification
   - Agents pane reloads (fetch updated agent list)
   - New agent appears in list

### Error Handling

**Client-side validation:**
- Name field required
- Name must be valid format (alphanumeric + hyphens/underscores)
- Name must be unique (checked on blur via API)

**Server-side errors:**
- Duplicate name → "Agent '{name}' already exists"
- Invalid name → "Agent name can only contain letters, numbers, hyphens, and underscores"
- Git error → "Failed to commit agent file: {error message}"
- File system error → "Failed to create agent file: {error message}"

All errors display in modal (don't close on error), allowing user to fix and retry.

## API Design

### Create Agent Endpoint

**Request:**
```http
POST /api/projects/:projectId/agents
Content-Type: application/json

{
  "name": "code-reviewer",
  "type": "engineer",  // optional
  "prompt": "# Code Reviewer\n\n## Role\nYou are..."
}
```

**Response (Success):**
```http
HTTP/1.1 201 Created
Content-Type: application/json

{
  "agent": {
    "name": "code-reviewer",
    "type": "engineer",
    "path": "agents/code-reviewer.md",
    "createdAt": "2026-02-11T19:25:00Z"
  },
  "commitSha": "abc123def456"
}
```

**Response (Error):**
```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "error": "Agent 'code-reviewer' already exists",
  "code": "DUPLICATE_AGENT"
}
```

### Validation Rules

**Agent Name:**
- Required
- 1-50 characters
- Must match regex: `^[a-z0-9-_]+$` (lowercase, numbers, hyphens, underscores)
- Must be unique within project

**Prompt:**
- Required
- 10-50,000 characters
- Must be valid UTF-8

**Type:**
- Optional
- If provided, must be one of: `architect`, `engineer`, `qa`, `lead`, `pm`, `designer`, `devops`

## Implementation Notes

**Git Operations:**
- Use existing git integration service
- Commit message format: `Add {agent-name} agent`
- Commit directly to main branch (MVP scope)
- Future: Support branch creation for PRs

**File Creation:**
- Write to `{projectRepo}/agents/{name}.md`
- Use UTF-8 encoding
- Ensure `agents/` directory exists (create if needed)
- Set file permissions to 644

**Agent Reload:**
- After successful creation, trigger agent list refresh
- Use existing agent discovery logic
- Update sidebar to show new agent
- Auto-select newly created agent (optional UX enhancement)

## Future Enhancements

**Template Library:**
- Pre-built templates for common agent types
- Community-contributed templates
- Template preview before selection

**Agent Duplication:**
- "Duplicate Agent" action in agent context menu
- Copy existing agent as starting point
- Auto-increment name (e.g., code-reviewer-2)

**Advanced Git Options:**
- Create agent on new branch
- Custom commit message
- Push to remote (optional)

**Agent Validation:**
- Test agent before committing
- Validate prompt structure
- Check for common mistakes

**Multi-file Agents:**
- Support agents with multiple files (prompt + config + resources)
- Agent bundles/packages
