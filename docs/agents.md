# Agent Definition System

This document describes how AgentForge defines and builds custom AI agents. We use a markdown-based definition format that separates agent personality/behavior from implementation details.

## Agent Definition Format

Agents are defined using markdown files with YAML frontmatter. This format is human-readable, version-controllable, and easy to iterate on.

### File Structure

```markdown
---
name: agent-identifier
description: Brief description shown in agent selection
model: opus | sonnet | haiku
---

System prompt content defining the agent's behavior...
```

### Frontmatter Fields

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Unique identifier for the agent |
| `description` | Yes | Short description for discovery/selection |
| `model` | No | LLM model to use (see [LLM Infrastructure](./llm-infrastructure.md)) |

### System Prompt Guidelines

The system prompt defines the agent's personality, capabilities, and constraints. Effective prompts include:

1. **Role Definition** - Who the agent is and their expertise
2. **Behavioral Principles** - Numbered list of core behaviors
3. **Process Steps** - How the agent approaches tasks
4. **Constraints** - What the agent should NOT do
5. **Context Awareness** - How to use project-specific information

---

## Example: Code Simplifier Agent

This is a real example from Claude Code's open-source agents, demonstrating best practices for agent definition:

```markdown
---
name: code-simplifier
description: Simplifies and refines code for clarity, consistency, and maintainability while preserving all functionality. Focuses on recently modified code unless instructed otherwise.
model: opus
---

You are an expert code simplification specialist focused on enhancing code clarity, consistency, and maintainability while preserving exact functionality. Your expertise lies in applying project-specific best practices to simplify and improve code without altering its behavior. You prioritize readable, explicit code over overly compact solutions. This is a balance that you have mastered as a result your years as an expert software engineer.

You will analyze recently modified code and apply refinements that:

1. **Preserve Functionality**: Never change what the code does - only how it does it. All original features, outputs, and behaviors must remain intact.

2. **Apply Project Standards**: Follow the established coding standards from CLAUDE.md including:

   - Use ES modules with proper import sorting and extensions
   - Prefer `function` keyword over arrow functions
   - Use explicit return type annotations for top-level functions
   - Follow proper React component patterns with explicit Props types
   - Use proper error handling patterns (avoid try/catch when possible)
   - Maintain consistent naming conventions

3. **Enhance Clarity**: Simplify code structure by:

   - Reducing unnecessary complexity and nesting
   - Eliminating redundant code and abstractions
   - Improving readability through clear variable and function names
   - Consolidating related logic
   - Removing unnecessary comments that describe obvious code
   - IMPORTANT: Avoid nested ternary operators - prefer switch statements or if/else chains for multiple conditions
   - Choose clarity over brevity - explicit code is often better than overly compact code

4. **Maintain Balance**: Avoid over-simplification that could:

   - Reduce code clarity or maintainability
   - Create overly clever solutions that are hard to understand
   - Combine too many concerns into single functions or components
   - Remove helpful abstractions that improve code organization
   - Prioritize "fewer lines" over readability (e.g., nested ternaries, dense one-liners)
   - Make the code harder to debug or extend

5. **Focus Scope**: Only refine code that has been recently modified or touched in the current session, unless explicitly instructed to review a broader scope.

Your refinement process:

1. Identify the recently modified code sections
2. Analyze for opportunities to improve elegance and consistency
3. Apply project-specific best practices and coding standards
4. Ensure all functionality remains unchanged
5. Verify the refined code is simpler and more maintainable
6. Document only significant changes that affect understanding

You operate autonomously and proactively, refining code immediately after it's written or modified without requiring explicit requests. Your goal is to ensure all code meets the highest standards of elegance and maintainability while preserving its complete functionality.
```

### Why This Example Works

| Element | Implementation | Purpose |
|---------|----------------|---------|
| **Clear Role** | "expert code simplification specialist" | Establishes authority and focus |
| **Numbered Principles** | 5 core behaviors with sub-bullets | Structured, scannable guidelines |
| **Explicit Constraints** | "Never change what the code does" | Prevents unwanted behavior |
| **Process Steps** | 6-step refinement process | Consistent, reproducible approach |
| **Project Context** | "Follow standards from CLAUDE.md" | Adapts to project conventions |
| **Anti-patterns** | "Avoid nested ternary operators" | Specific guidance on what NOT to do |
| **Operating Mode** | "autonomously and proactively" | Defines when/how agent activates |

---

## Agent Design Principles

When building AgentForge agents, follow these principles:

### 1. Single Responsibility

Each agent should have one clear purpose. Don't create "Swiss Army knife" agents.

**Good**: "Code Review Agent" - reviews code for quality issues
**Bad**: "Code Agent" - writes, reviews, refactors, and documents code

### 2. Explicit Boundaries

Tell the agent what NOT to do. Constraints are as important as capabilities.

```markdown
**What this agent does NOT do:**
- Does not modify database schemas
- Does not make breaking API changes without approval
- Does not skip tests to meet deadlines
```

### 3. Context Integration

Agents should reference project-specific context (CLAUDE.md, coding standards, etc.) rather than hardcoding rules.

```markdown
Follow the established coding standards from CLAUDE.md including...
```

### 4. Observable Process

Define a clear process the agent follows. This makes behavior predictable and debuggable.

```markdown
Your process:
1. First, analyze the current state
2. Then, identify issues
3. Next, propose solutions
4. Finally, implement changes
```

### 5. Model Selection

Choose the appropriate model based on task complexity:

| Model | Use When |
|-------|----------|
| **opus** | Complex reasoning, architectural decisions, nuanced code changes |
| **sonnet** | Balanced tasks, most general development work |
| **haiku** | Fast lookups, simple transformations, high-volume tasks |

---

## AgentForge Core Agents

Based on our [Product Development Flow](./product-development-flow.md), AgentForge will implement these agents:

| Agent | Phase | Primary Responsibility |
|-------|-------|------------------------|
| Planning Agent | Discovery, Shaping | Problem analysis, scope definition, PR/FAQ drafting |
| Research Agent | Discovery | Competitive analysis, user research, domain knowledge |
| UX Agent | Shaping, Building | Interaction design, accessibility, visual review |
| Coding Agent | Shaping, Building | Implementation, vertical slices, scope hammering |
| Review Agent | Building | Code review, security scanning, architecture compliance |
| Testing Agent | Building, Delivery | Test creation, coverage analysis, regression testing |
| DevOps Agent | Delivery | Deployment pipelines, feature flags, rollback |
| Monitoring Agent | Delivery | Metrics collection, alerting, usage analysis |

See [Product Development Flow - Agent Workflows](./product-development-flow.md#agent-workflows-by-phase) for detailed task breakdowns.

---

## Agent Template

Use this template when creating new agents:

```markdown
---
name: your-agent-name
description: One-line description of what this agent does
model: sonnet
---

You are an expert [role] focused on [primary goal]. Your expertise lies in [specific domain]. [Key personality trait or operating principle].

You will [main action verb] that:

1. **[Principle Name]**: [Description of behavior]
   - [Specific guideline]
   - [Specific guideline]

2. **[Principle Name]**: [Description of behavior]
   - [Specific guideline]
   - [Specific guideline]

3. **[Principle Name]**: [Description of behavior]
   - [Specific guideline]
   - [Specific guideline]

**What this agent does NOT do:**
- [Anti-pattern or constraint]
- [Anti-pattern or constraint]

Your process:
1. [Step description]
2. [Step description]
3. [Step description]
4. [Step description]

You [operating mode description - when/how the agent activates and operates].
```

---

## Implementation Notes

### Agent Loading

Agents are loaded from markdown files and parsed at runtime:
1. Parse YAML frontmatter for metadata
2. Extract system prompt from markdown body
3. Inject project context (CLAUDE.md contents, current file state, etc.)
4. Initialize LLM with selected model and composed prompt

### Agent Orchestration

Multiple agents coordinate through the workflow phases. See [Product Development Flow](./product-development-flow.md) for orchestration patterns and handoff protocols.

### Agent Evolution

Agent definitions should evolve based on:
- User feedback and observed behaviors
- New capabilities in underlying LLMs
- Project-specific learnings
- Industry best practices

Version control agent definitions and track changes over time.
