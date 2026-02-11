# Agent Marketplace - Proposal

## Why

AgentForge users currently must write every agent prompt from scratch. This creates several problems:

- **Steep learning curve** - New users don't know how to write effective agent prompts
- **Reinventing the wheel** - Common agent patterns (code reviewer, test writer, documentation generator) are recreated by every user
- **No sharing mechanism** - Users who create great agents can't easily share them with the community
- **Missed best practices** - Good prompt engineering techniques aren't widely distributed

**We need an Agent Marketplace** - a curated collection of community-contributed agents that users can browse, preview, and add to their projects with one click.

## What Changes

Add an **Agent Marketplace** feature that allows users to:
1. **Browse** community-contributed agents
2. **Search** and filter by category, use case, or popularity
3. **Preview** agent prompts before adding
4. **Install** agents to their project with one click
5. **Contribute** their own agents back to the community

### User Flow

**Browsing & Installing:**
1. User clicks "Agent Marketplace" button in agents sidebar
2. Modal/page opens showing agent catalog
3. User browses agents organized by category (Code Quality, Testing, Documentation, etc.)
4. User clicks on an agent to see preview (full prompt, description, use cases)
5. User clicks "Add to Project"
6. Agent is installed to their project's `agents/` directory
7. User can immediately start using the agent

**Contributing:**
1. User creates and tests an agent in their project
2. User clicks "Share Agent" button
3. Form opens to add metadata (title, description, category, tags)
4. User submits agent to community repository
5. Agent goes through review process (automated + manual)
6. Once approved, agent appears in marketplace for all users

### Community Repository Structure

Agents stored in Git repository (e.g., `agentforge/community-agents`):

```
community-agents/
  README.md
  code-quality/
    code-reviewer.md
    linter.md
    refactorer.md
  testing/
    test-generator.md
    test-reviewer.md
    e2e-tester.md
  documentation/
    readme-writer.md
    api-doc-generator.md
    comment-writer.md
  devops/
    dockerfile-writer.md
    ci-cd-helper.md
  design/
    ui-reviewer.md
    accessibility-checker.md
  metadata.json  # Index of all agents with metadata
```

Each agent is a markdown file with frontmatter:

```markdown
---
title: Code Reviewer
description: Reviews code for quality, best practices, and potential bugs
category: code-quality
tags: [review, quality, best-practices]
author: username
version: 1.0.0
created: 2026-02-11
updated: 2026-02-11
downloads: 1523
rating: 4.8
---

# Code Reviewer

## Role
You are an experienced code reviewer specializing in...

[rest of agent prompt]
```

## Capabilities

### New Capabilities
- `agent-marketplace-ui`: Browse and search agent marketplace
- `agent-install`: Install marketplace agents to project
- `agent-contribute`: Submit agents to community repository
- `agent-preview`: View agent details before installing
- `agent-metadata`: Manage agent metadata (category, tags, ratings)

### Modified Capabilities
- `project-viewer`: Add "Agent Marketplace" button to agents sidebar
- `agent-list`: Show indicator for marketplace agents vs local agents

## Impact

**UI Changes:**
- "Agent Marketplace" button in agents sidebar
- New `AgentMarketplaceModal` or dedicated `/marketplace` page
- Agent catalog view with categories and search
- Agent detail view with preview and install button
- Agent contribution form

**API Changes:**
- `GET /api/marketplace/agents` - List all marketplace agents
- `GET /api/marketplace/agents/:id` - Get agent details
- `POST /api/projects/:projectId/agents/install` - Install marketplace agent
  - Accepts: `{ marketplaceAgentId, customName? }`
  - Returns: `{ agent, commitSha }`
- `POST /api/marketplace/agents/contribute` - Submit agent for review
  - Accepts: `{ name, prompt, metadata }`
  - Returns: `{ submissionId, status }`

**Backend Changes:**
- Marketplace agent repository integration (fetch from Git)
- Agent installation logic (download + install to project)
- Agent metadata indexing and search
- Contribution submission system
- Agent validation and review workflow

**External Dependencies:**
- Community Git repository (GitHub: `agentforge/community-agents`)
- Optional: Agent rating/review system database

**No Breaking Changes:**
- All changes are additive
- Local agents continue to work exactly as before
- Marketplace is optional feature

## Risks & Mitigations

**[Risk]** Malicious agents could be submitted to marketplace
→ **Mitigation:** 
- Automated scanning for suspicious patterns
- Manual review process before approval
- Community reporting mechanism
- Version control (users can rollback if needed)

**[Risk]** Marketplace agents may not fit user's specific needs
→ **Mitigation:**
- Clear previews before installation
- Agents are editable after installation (becomes local copy)
- Good search/filtering to find relevant agents

**[Risk]** Community repository becomes too large
→ **Mitigation:**
- Lazy loading (fetch on demand, not all upfront)
- Pagination in marketplace UI
- Categorization to reduce cognitive load

**[Risk]** Agents become outdated or incompatible
→ **Mitigation:**
- Versioning system
- Update notifications for installed marketplace agents
- Deprecation process for old agents

**[Risk]** Network dependency (requires internet to browse marketplace)
→ **Mitigation:**
- Cache marketplace index locally
- Graceful degradation if repository unreachable
- Local agents always work (marketplace is enhancement)

## MVP Scope

For initial implementation:
1. **Community Git repository** with 10-20 curated starter agents
2. **Browse marketplace** - View agents by category
3. **Agent preview** - See full prompt before installing
4. **One-click install** - Add agent to project
5. **Basic search** - Filter by name or category

**Defer to future:**
- User contributions (initially curated by AgentForge team)
- Ratings and reviews
- Download statistics
- Agent versioning and updates
- Advanced search (tags, popularity, ratings)
- Agent dependencies (agents that work together)
- Agent bundles (install multiple related agents at once)

## Success Criteria

**A user can:**
1. Discover useful agents in < 1 minute
2. Preview agent prompt to understand what it does
3. Install agent to their project in < 30 seconds
4. Start using the agent immediately
5. Customize installed agent if needed (it's just a local markdown file)

**Metrics to track:**
- Number of marketplace agents browsed
- Installation success rate
- Most popular agent categories
- Time from marketplace open to agent installed
- Retention (do users keep using installed agents?)
- Contribution rate (when enabled)

## Community Repository Management

**Initial Curation:**
- AgentForge team creates 10-20 high-quality starter agents
- Cover common use cases: code review, testing, documentation, refactoring
- Well-documented with clear descriptions and use cases

**Contribution Process (Future):**
1. User submits agent via UI or PR to GitHub repo
2. Automated checks: valid markdown, has required frontmatter, no malicious patterns
3. Manual review by AgentForge maintainers
4. Approval or feedback/rejection
5. Merged to community repository
6. Appears in marketplace for all users

**Quality Standards:**
- Clear, descriptive titles
- Comprehensive descriptions
- Well-structured prompts
- Use cases documented
- Tested and validated
- Safe and ethical

## Future Enhancements

**Agent Ratings:**
- Users can rate installed agents (1-5 stars)
- Aggregate ratings displayed in marketplace
- Helps surface high-quality agents

**Agent Reviews:**
- Text reviews with pros/cons
- Filter agents by rating
- Sort by popularity

**Agent Versioning:**
- Track agent versions
- Notify users of updates
- One-click update for installed agents

**Agent Collections:**
- Curated bundles (e.g., "Full Stack Development" = code reviewer + test generator + API doc writer)
- Install multiple agents at once

**Agent Dependencies:**
- Agents can reference other agents
- Install dependencies automatically

**Private Marketplaces:**
- Organizations can host their own agent repositories
- Configure marketplace source (public + private)

**Agent Analytics:**
- Track which agents are most effective
- Success metrics for agent performance
- Feedback loop to improve community agents
