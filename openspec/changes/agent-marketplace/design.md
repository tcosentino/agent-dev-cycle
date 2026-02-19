# Agent Marketplace - Design

## Context

AgentForge users need access to pre-built, community-tested agents to accelerate project setup and learn prompt engineering best practices. A marketplace provides discoverability, sharing, and quality curation.

## Goals / Non-Goals

**Goals:**
- Browse and search community agents
- Preview agent prompts before installing
- One-click installation to project
- Safe, curated agent repository
- Easy contribution workflow (future)

**Non-Goals (MVP):**
- User ratings/reviews (defer to v2)
- Agent versioning and updates (defer to v2)
- Private/organization marketplaces (defer to v2)
- Agent dependencies or bundles (defer to v2)

## Decisions

### Decision 1: Community repo vs centralized database
**Choice:** Git repository (`agentforge/community-agents`)

**Rationale:**
- Version control for agents (track history)
- Easy contributions via PR workflow (familiar to developers)
- Transparent review process (public PRs)
- No database infrastructure needed
- Can mirror/cache locally for performance
- Open source and auditable

**Alternative considered:** Centralized database with API
- More control over structure
- Better search/filtering performance
- Requires backend infrastructure and maintenance
- Less transparent process

### Decision 2: Modal vs dedicated page for marketplace
**Choice:** Dedicated page (`/marketplace`)

**Rationale:**
- More space for browsing and filtering
- Better UX for exploring large catalog
- Can bookmark/share marketplace URL
- Feels more like a "destination" (increases discoverability)

**Alternative considered:** Modal popup
- Faster access (no navigation)
- Less context switching
- Limited space for large catalog
- Can add "quick browse" modal later

### Decision 3: Install behavior
**Choice:** Copy agent file to project, commit automatically

**Rationale:**
- User gets local, editable copy (can customize)
- No dependency on marketplace staying online
- Consistent with "New Agent" workflow
- Simple to understand and implement

**Alternative considered:** Reference marketplace agent (link/import)
- Agents auto-update when marketplace changes
- Users can't easily customize
- Dependency on marketplace availability
- More complex implementation

### Decision 4: Agent metadata format
**Choice:** Markdown frontmatter (YAML)

**Rationale:**
- Keeps metadata with content (single file)
- Human-readable and editable
- Standard format (Jekyll, Hugo, Obsidian)
- Easy to parse in backend

**Alternative considered:** Separate metadata.json
- Easier to query without parsing markdown
- More complex file management
- Separates content from metadata

### Decision 5: Contribution workflow (future)
**Choice:** GitHub PR-based with automated + manual review

**Rationale:**
- Transparent process (anyone can see review)
- Familiar to developers
- Built-in discussion/feedback mechanism
- Version control for contributions
- No custom review UI needed

**Alternative considered:** In-app submission with custom review queue
- Easier for non-technical users
- Requires custom review UI and workflow
- Less transparent
- More maintenance burden

## Architecture

### Components

**UI Layer:**
```
ProjectViewer (agents sidebar)
  └─ "Agent Marketplace" button
       └─ Navigate to /marketplace

MarketplacePage
  ├─ MarketplaceHeader (search + filters)
  ├─ CategoryNav (sidebar or tabs)
  └─ AgentGrid
       └─ AgentCard (title, description, category, tags)
            └─ Click → AgentDetailView
                 ├─ Agent metadata
                 ├─ Prompt preview
                 ├─ Use cases
                 └─ "Add to Project" button
```

**API Layer:**
```
GET /api/marketplace/agents
  └─ MarketplaceService.listAgents()
       ├─ Fetch from community repo (cached)
       ├─ Parse metadata from markdown frontmatter
       └─ Return agent list with metadata

GET /api/marketplace/agents/:id
  └─ MarketplaceService.getAgent(id)
       ├─ Fetch agent markdown file
       ├─ Parse frontmatter + content
       └─ Return full agent data

POST /api/projects/:projectId/agents/install
  └─ AgentInstallationService
       ├─ Fetch marketplace agent
       ├─ Copy to project repo (agents/{name}.md)
       ├─ Commit with message "Install {name} from marketplace"
       └─ Return installed agent metadata
```

**External:**
```
GitHub: agentforge/community-agents
  code-quality/
    code-reviewer.md
    linter.md
  testing/
    test-generator.md
  documentation/
    readme-writer.md
  metadata.json  # Index for fast queries
```

### Data Flow

**Browsing Marketplace:**
1. User clicks "Agent Marketplace" in agents sidebar
2. Navigate to `/marketplace` page
3. Frontend fetches `GET /api/marketplace/agents`
4. Backend fetches agent index from community repo (cached)
5. Backend parses metadata and returns agent list
6. Frontend renders agent cards grouped by category

**Installing Agent:**
1. User clicks on agent card → detail view loads
2. User clicks "Add to Project"
3. Frontend shows modal: "Install to which project?" (if multiple projects)
4. Frontend calls `POST /api/projects/:projectId/agents/install`
5. Backend fetches agent markdown from community repo
6. Backend writes file to project repo at `agents/{name}.md`
7. Backend commits file with Git
8. Backend returns success + agent metadata
9. Frontend shows success notification
10. Frontend reloads project agents list
11. User sees new agent in their agents sidebar

### Caching Strategy

**Marketplace Index:**
- Cache `metadata.json` for 1 hour
- Fetch fresh on user request (manual refresh button)
- Cache invalidation on new agent submission (future)

**Individual Agents:**
- Cache agent content for 24 hours
- Fresh fetch on install (ensure latest version)
- Cache preview content (faster detail view)

## API Design

### List Marketplace Agents

**Request:**
```http
GET /api/marketplace/agents?category=code-quality&search=reviewer
```

**Query Parameters:**
- `category` (optional): Filter by category
- `search` (optional): Search by name or description
- `tags` (optional): Filter by tags (comma-separated)
- `limit` (optional): Pagination limit (default 50)
- `offset` (optional): Pagination offset

**Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "agents": [
    {
      "id": "code-reviewer",
      "title": "Code Reviewer",
      "description": "Reviews code for quality, best practices, and bugs",
      "category": "code-quality",
      "tags": ["review", "quality", "best-practices"],
      "author": "agentforge-team",
      "version": "1.0.0",
      "created": "2026-02-11T12:00:00Z",
      "updated": "2026-02-11T12:00:00Z",
      "downloads": 1523,
      "path": "code-quality/code-reviewer.md"
    },
    ...
  ],
  "total": 42,
  "categories": ["code-quality", "testing", "documentation", "devops", "design"]
}
```

### Get Agent Details

**Request:**
```http
GET /api/marketplace/agents/code-reviewer
```

**Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "id": "code-reviewer",
  "title": "Code Reviewer",
  "description": "Reviews code for quality, best practices, and bugs",
  "category": "code-quality",
  "tags": ["review", "quality", "best-practices"],
  "author": "agentforge-team",
  "version": "1.0.0",
  "created": "2026-02-11T12:00:00Z",
  "updated": "2026-02-11T12:00:00Z",
  "downloads": 1523,
  "path": "code-quality/code-reviewer.md",
  "prompt": "# Code Reviewer\n\n## Role\nYou are an experienced code reviewer...",
  "useCases": [
    "Review pull requests for quality issues",
    "Check code against best practices",
    "Identify potential bugs and security issues"
  ]
}
```

### Install Agent to Project

**Request:**
```http
POST /api/projects/:projectId/agents/install
Content-Type: application/json

{
  "marketplaceAgentId": "code-reviewer",
  "customName": "my-code-reviewer"  // optional, defaults to marketplace name
}
```

**Response:**
```http
HTTP/1.1 201 Created
Content-Type: application/json

{
  "agent": {
    "name": "my-code-reviewer",
    "path": "agents/my-code-reviewer.md",
    "source": "marketplace",
    "marketplaceId": "code-reviewer",
    "installedAt": "2026-02-11T12:30:00Z"
  },
  "commitSha": "abc123def456"
}
```

## Community Repository Structure

**File Structure:**
```
agentforge/community-agents/
  README.md                    # Repository overview, contribution guide
  CONTRIBUTING.md              # Detailed contribution guidelines
  metadata.json                # Agent index for fast queries
  
  code-quality/
    code-reviewer.md
    linter.md
    refactorer.md
    security-auditor.md
  
  testing/
    test-generator.md
    test-reviewer.md
    e2e-tester.md
    unit-test-writer.md
  
  documentation/
    readme-writer.md
    api-doc-generator.md
    comment-writer.md
    changelog-generator.md
  
  devops/
    dockerfile-writer.md
    ci-cd-helper.md
    deployment-reviewer.md
  
  design/
    ui-reviewer.md
    accessibility-checker.md
    design-system-enforcer.md
```

**Agent File Format:**
```markdown
---
title: Code Reviewer
description: Reviews code for quality, best practices, and potential bugs
category: code-quality
tags:
  - review
  - quality
  - best-practices
  - security
author: agentforge-team
version: 1.0.0
created: 2026-02-11
updated: 2026-02-11
useCases:
  - Review pull requests for quality issues
  - Check code against best practices
  - Identify potential bugs and security vulnerabilities
---

# Code Reviewer

## Role
You are an experienced code reviewer with deep knowledge of software engineering best practices, design patterns, and common pitfalls.

## Responsibilities
- Review code changes for correctness, clarity, and maintainability
- Identify potential bugs, edge cases, and security issues
- Suggest improvements and refactorings
- Ensure code follows project conventions and best practices
- Provide constructive feedback with examples

## Guidelines
- Be thorough but concise in your reviews
- Focus on significant issues over minor style preferences
- Suggest specific improvements rather than just pointing out problems
- Consider performance, security, and maintainability
- Respect the author's approach while providing guidance

## Context
You have access to the codebase and can reference files, functions, and patterns used throughout the project.

## Communication Style
Professional and constructive. Provide clear explanations for your suggestions and praise good patterns when you see them.
```

**metadata.json Structure:**
```json
{
  "version": "1.0.0",
  "updated": "2026-02-11T12:00:00Z",
  "categories": {
    "code-quality": {
      "title": "Code Quality",
      "description": "Agents for reviewing and improving code quality",
      "agents": ["code-reviewer", "linter", "refactorer", "security-auditor"]
    },
    "testing": {
      "title": "Testing",
      "description": "Agents for writing and reviewing tests",
      "agents": ["test-generator", "test-reviewer", "e2e-tester", "unit-test-writer"]
    }
  },
  "agents": {
    "code-reviewer": {
      "title": "Code Reviewer",
      "description": "Reviews code for quality, best practices, and bugs",
      "category": "code-quality",
      "tags": ["review", "quality", "best-practices"],
      "author": "agentforge-team",
      "version": "1.0.0",
      "path": "code-quality/code-reviewer.md"
    }
  }
}
```

## Implementation Notes

**Repository Integration:**
- Use GitHub API to fetch files
- Cache responses locally (Redis or file system)
- Support offline mode (use cached agents)
- Periodic refresh (check for updates)

**Installation Process:**
- Fetch agent from community repo
- Validate markdown format
- Check for name conflicts (suggest alternative if needed)
- Write to project's `agents/` directory
- Commit with descriptive message
- Reload agents list in UI

**Security:**
- Sanitize agent content (prevent XSS)
- Validate markdown structure
- No executable code in agents (plain markdown only)
- Manual review for all community contributions

**Performance:**
- Lazy load agent content (fetch on detail view, not list view)
- Paginate marketplace (50 agents per page)
- Index metadata for fast search
- CDN for community repository (future)

## Future Enhancements

**Contribution UI:**
- "Share Agent" button in agent context menu
- Form to add metadata (title, description, category, tags)
- Preview submission before sending
- Track submission status

**Ratings & Reviews:**
- Star ratings (1-5) for installed agents
- Text reviews with pros/cons
- Aggregate ratings in marketplace
- Sort by rating/popularity

**Agent Updates:**
- Version tracking for installed agents
- Notification when marketplace version is newer
- One-click update with diff preview

**Agent Analytics:**
- Track downloads per agent
- Most popular agents
- Trending agents
- Usage statistics (with user consent)
