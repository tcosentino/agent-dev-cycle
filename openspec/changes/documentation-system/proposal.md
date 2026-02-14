# Documentation System - Proposal

## Why

AgentForge currently has minimal documentation scattered across:
- README files
- Code comments
- GitHub wiki (if any)
- Discord conversations
- Individual knowledge

This creates major problems:
- **New users can't get started** - No clear onboarding path
- **Contributors can't contribute** - No dev setup guide or architecture docs
- **Agents can't work effectively** - No standardized context files
- **Integrators can't build** - No API reference
- **Self-hosters can't deploy** - No operations guides

**We need a comprehensive, well-organized documentation system** that serves all audiences: end users, contributors, AI agents, integrators, community members, and operators.

## What Changes

Build a **multi-audience documentation system** with clear structure, searchability, and maintained content.

### Documentation Audiences

**1. User Documentation** (End Users)
- People using AgentForge to build software with agents
- Getting started, tutorials, how-to guides, concepts, reference

**2. Developer Documentation** (Contributors)
- People contributing to AgentForge codebase
- Setup, architecture, testing, API internals, release process

**3. Agent Documentation** (AI Agents)
- AI agents working within AgentForge projects
- PROJECT.md, AGENTS.md, TOOLS.md, best practices, tool catalog

**4. API Documentation** (Integrators)
- Developers building integrations, extensions, plugins
- REST API reference, webhooks, SDK docs, extension API

**5. Community Documentation**
- Contributors, plugin authors, agent creators
- Contribution guides, marketplace, plugin development

**6. Operations Documentation** (Self-Hosters)
- Teams deploying AgentForge in production
- Deployment, configuration, security, scaling, monitoring

### Proposed Structure

```
docs/
├── README.md                           # Docs home, navigation
│
├── user-guide/                         # For end users
│   ├── getting-started/
│   ├── tutorials/
│   ├── how-to/
│   ├── concepts/
│   ├── reference/
│   └── troubleshooting/
│
├── developer-guide/                    # For contributors
│   ├── CONTRIBUTING.md
│   ├── development-setup.md
│   ├── architecture/
│   ├── testing/
│   └── release-process.md
│
├── agent-guide/                        # For AI agents
│   ├── agent-best-practices.md
│   ├── tool-usage-patterns.md
│   ├── file-conventions.md
│   └── reference/
│
├── api-reference/                      # For integrators
│   ├── rest-api/
│   ├── webhooks.md
│   └── sdk/
│
├── community/                          # For contributors
│   ├── code-of-conduct.md
│   ├── contributing-agents.md
│   └── showcase.md
│
└── operations/                         # For self-hosters
    ├── deployment/
    ├── configuration.md
    ├── security.md
    └── monitoring.md
```

### Documentation Site

**Technology:** Docusaurus or Nextra
- Static site generator optimized for docs
- Built-in search (Algolia)
- Versioning support
- React-based (Docusaurus) or Next.js-based (Nextra)
- Mobile responsive
- Dark mode
- "Edit this page" links to GitHub

**Features:**
- Homepage with quick start
- Multi-level navigation
- Search across all docs
- Code syntax highlighting
- Interactive examples (future)
- Version selector (v1, v2, etc.)
- Feedback buttons ("Was this helpful?")

## Capabilities

### New Capabilities
- `documentation-site`: Searchable, versioned docs site
- `doc-generation`: Auto-generate API docs from code
- `agent-context-templates`: Standard PROJECT.md, AGENTS.md templates
- `doc-versioning`: Maintain docs for multiple versions

### Modified Capabilities
- `project-creation`: Include documentation templates in new projects
- `agent-execution`: Agents reference agent-guide documentation

## Impact

**New Files/Directories:**
- `docs/` directory with full structure
- Documentation site (separate repo or `/website`)
- CI/CD for docs deployment
- `PROJECT.md`, `AGENTS.md`, `TOOLS.md` templates

**Documentation Content:**
- 50-100+ documentation pages across all audiences
- API reference (auto-generated)
- Code examples and tutorials
- Screenshots and diagrams

**Tooling:**
- Docusaurus or Nextra setup
- Algolia search integration
- Auto-deploy docs on push to main
- Link checking and validation

**No Breaking Changes:**
- All additive (no existing docs removed)
- Existing README.md can redirect to docs site
- GitHub wiki can be migrated

## Risks & Mitigations

**[Risk]** Documentation becomes outdated quickly
→ **Mitigation:**
- Auto-generate API docs from code
- CI checks for broken links
- Regular review schedule
- Community contributions encouraged
- Versioned docs (old versions stay accurate)

**[Risk]** Too much overhead to maintain
→ **Mitigation:**
- Start with MVP (user guide + developer guide)
- Add sections incrementally
- Use templates and automation
- Accept community PRs for doc updates

**[Risk]** Users can't find what they need
→ **Mitigation:**
- Clear navigation structure
- Search functionality (Algolia)
- Cross-links between related topics
- "What you're looking for" suggestions

**[Risk]** Documentation is out of sync with code
→ **Mitigation:**
- Docs live in same repo as code
- PR reviews include doc updates
- CI fails if API docs out of date
- Regular audits

**[Risk]** Duplicate content across different audiences
→ **Mitigation:**
- Use includes/partials for shared content
- Cross-reference instead of duplicating
- Clear ownership per section

## MVP Scope

**Phase 1: User Guide + Developer Guide**
- Getting Started (installation, first project)
- Core Concepts (agents, projects, OpenSpec)
- How-To Guides (5-10 common tasks)
- Contributing Guide
- Development Setup
- Architecture Overview

**Phase 2: Agent Guide + API Reference**
- Agent best practices
- Tool catalog
- REST API reference (auto-generated)
- PROJECT.md/AGENTS.md templates

**Phase 3: Community + Operations**
- Community contribution guides
- Deployment guides
- Showcase

**Defer:**
- Interactive examples
- Video tutorials
- Translated docs (i18n)
- Advanced search features

## Success Criteria

**A user can:**
1. Find documentation site in < 1 minute
2. Install AgentForge by following Getting Started
3. Create first project within 10 minutes of reading docs
4. Find answer to common questions without asking in Discord
5. Contribute documentation improvements via PR

**Metrics to track:**
- Doc site visits
- Search queries (what people look for)
- Time spent on docs
- Doc feedback ratings ("Was this helpful?")
- GitHub traffic to docs
- Support questions that should be in docs

## Implementation Approach

### 1. Choose Documentation Framework

**Option A: Docusaurus**
- React-based
- Great for versioning
- Large ecosystem
- Used by Meta, Supabase, Jest

**Option B: Nextra**
- Next.js based
- Simpler, faster
- Great search
- Used by Vercel, SWR, Nextra

**Recommendation:** Start with **Docusaurus** (more mature, better versioning)

### 2. Set Up Documentation Site

```bash
# Create docs site
npx create-docusaurus@latest website classic

# Configure
website/
  docs/            # Documentation markdown files
  blog/            # Optional blog for updates
  src/
    pages/         # Custom pages (homepage)
  docusaurus.config.js
  sidebars.js      # Navigation structure
```

### 3. Migrate Existing Content

- Copy existing README content to Getting Started
- Extract architecture notes to developer-guide/architecture
- Document known patterns and conventions

### 4. Write Core Documentation

**Priority Order:**
1. **Getting Started** - Installation, first project, core concepts
2. **Contributing Guide** - How to contribute, code style, PR process
3. **Architecture Overview** - System design, component relationships
4. **How-To Guides** - 5-10 common tasks
5. **API Reference** - REST endpoints (auto-generated if possible)

### 5. Deploy Documentation

**Options:**
- GitHub Pages (free, easy)
- Vercel (free for open source, fast)
- Netlify (free tier, good DX)

**Recommendation:** **Vercel** (zero-config deployment, fast, free)

### 6. Ongoing Maintenance

- Add to PR template: "Update docs if needed"
- Regular review schedule (monthly)
- Community contributions encouraged
- Track "needs documentation" GitHub issues

## Design Principles

**1. Progressive Disclosure**
- Start simple, add complexity gradually
- Tutorials → How-To → Reference → Advanced

**2. Show, Don't Tell**
- Code examples > long explanations
- Screenshots and diagrams
- Real-world use cases

**3. Consistency**
- Same structure across sections
- Consistent terminology
- Predictable patterns

**4. Discoverability**
- Good navigation
- Search
- Related links
- Breadcrumbs

**5. Maintainability**
- Auto-generate where possible
- Templates for common docs
- Easy to update (markdown)
- Version control (Git)

## Content Templates

### Tutorial Template
```markdown
# [Tutorial Title]

**Time:** X minutes
**Level:** Beginner/Intermediate/Advanced
**Prerequisites:** List

## What You'll Build
Brief description

## Step 1: [First Step]
Instructions...

```code
// Example
```

## Step 2: [Second Step]
...

## Next Steps
Where to go from here
```

### How-To Guide Template
```markdown
# How to [Task]

**When to use:** Brief description

## Prerequisites
- Requirement 1
- Requirement 2

## Steps

### 1. [First Step]
Instructions...

### 2. [Second Step]
...

## Common Issues
- Issue 1 → Solution
- Issue 2 → Solution

## Related
- Link to related docs
```

### API Reference Template
```markdown
# [Endpoint Name]

**Endpoint:** `GET /api/resource`

## Description
What this endpoint does

## Request

### Parameters
- `param1` (type) - Description

### Example
```http
GET /api/resource?param1=value
```

## Response

### Success (200)
```json
{
  "data": "..."
}
```

### Errors
- `400` - Bad Request
- `404` - Not Found
```

## Future Enhancements

**Interactive Examples:**
- Embedded code editor (CodeSandbox, StackBlitz)
- Try API calls directly in docs
- Interactive tutorials

**Video Content:**
- Getting started video
- Architecture walkthroughs
- Feature demos

**Internationalization:**
- Translate docs to multiple languages
- Community-driven translations
- Language selector

**Advanced Search:**
- AI-powered search
- Natural language queries
- Suggested searches

**Doc Analytics:**
- Track which docs are most useful
- Identify gaps (high bounce rate)
- Measure effectiveness

**Community Showcase:**
- Highlight projects built with AgentForge
- Case studies
- Success stories

**Changelog Integration:**
- Auto-generate changelog from Git commits
- Link releases to relevant docs
- Migration guides for breaking changes
