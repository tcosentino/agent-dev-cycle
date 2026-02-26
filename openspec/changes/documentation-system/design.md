# Documentation System - Design

## Context

AgentForge needs comprehensive documentation for multiple audiences (users, developers, agents, integrators, operators). Documentation should be discoverable, searchable, versioned, and easy to maintain.

## Goals / Non-Goals

**Goals:**
- Comprehensive docs for all audiences
- Easy to navigate and search
- Version-aware (maintain docs for v1, v2, etc.)
- Auto-generated where possible (API reference)
- Deploy as static site to AWS

**Non-Goals (MVP):**
- Interactive code examples (defer to v2)
- Video tutorials (defer to v2)
- Internationalization (defer to v2)
- In-app documentation viewer (separate static site)

## Decisions

### Decision 1: Documentation framework
**Choice:** Docusaurus

**Rationale:**
- Mature, battle-tested (Meta, Supabase, Jest, React Native)
- Excellent versioning support (critical for v1 → v2 transitions)
- Built-in search (Algolia DocSearch)
- Plugin ecosystem (OpenAPI, changelogs, etc.)
- React-based (familiar for team)
- Great DX (fast refresh, MDX support)

**Alternative considered:** Nextra
- Simpler, faster
- Less mature versioning
- Smaller ecosystem
- Good for simple docs, less good for complex multi-version scenarios

### Decision 2: Deployment
**Choice:** Static site deployed to AWS (S3 + CloudFront)

**Rationale:**
- Full control over infrastructure
- Fast global CDN (CloudFront)
- Low cost (~$1-5/month)
- HTTPS with custom domain
- Familiar stack (already using AWS for troycosentino.com)

**Build process:**
- Docusaurus builds to static HTML/CSS/JS
- Deploy to S3 bucket
- Serve via CloudFront
- CI/CD via GitHub Actions

**Alternative considered:** Vercel/Netlify
- Easier setup
- Less control
- Vendor lock-in
- Fine for MVP, but AWS scales better long-term

### Decision 3: Repository structure
**Choice:** Monorepo (`/website` folder in agent-dev-cycle)

**Rationale:**
- Docs live next to code (easier to keep in sync)
- Single PR can update code + docs
- Shared tooling and CI/CD
- Easier to auto-generate API docs from code
- Docusaurus default pattern

**Structure:**
```
agent-dev-cycle/
  website/               # Docusaurus site
    docs/                # Documentation markdown
    blog/                # Optional release blog
    src/                 # Custom pages
    static/              # Images, assets
    docusaurus.config.js
    sidebars.js
  packages/              # AgentForge code
  ...
```

**Alternative considered:** Separate repo
- Cleaner separation
- Harder to keep code and docs in sync
- More complex CI/CD
- Discourages doc updates with code changes

### Decision 4: Auto-generated API docs
**Choice:** Auto-generate from OpenAPI spec

**Rationale:**
- Single source of truth (code → spec → docs)
- Never out of sync
- Less manual maintenance
- Standard format (OpenAPI/Swagger)

**Implementation:**
- Use `docusaurus-plugin-openapi-docs`
- Generate OpenAPI spec from backend (or write manually)
- Plugin converts to markdown
- Renders as interactive API explorer

**Alternative considered:** Manual API docs
- More control over formatting
- Gets out of sync quickly
- High maintenance burden

### Decision 5: Documentation versioning
**Choice:** Version docs with major releases (v1, v2, etc.)

**Rationale:**
- Users on old versions need accurate docs
- Breaking changes require migration guides
- Docusaurus has first-class versioning support

**Strategy:**
- `docs/` = current (main branch, unreleased)
- `versioned_docs/version-1.0/` = v1.0 release
- Version dropdown in header
- Versioned search results

### Decision 6: Agent documentation structure
**Choice:** Standardized templates in each project repo

**Rationale:**
- Agents read project-specific context, not global docs
- Each project has unique structure/conventions
- Templates ensure consistency
- Easy to customize per project

**Templates provided:**
- `PROJECT.md` - Project overview, architecture, goals
- `AGENTS.md` - Agent guidelines, boundaries, conventions
- `TOOLS.md` - Available tools and usage
- `MEMORY.md` - Project history and decisions

**Global agent guide:**
- Best practices (how to write effective prompts)
- Tool catalog (all available tools)
- Common patterns (file structures, Git workflows)

## Architecture

### Documentation Site Structure

```
website/
  docs/
    user-guide/
      getting-started/
        installation.md
        first-project.md
        core-concepts.md
      tutorials/
        build-todo-app.md
        multi-agent-workflow.md
      how-to/
        create-agent.md
        use-marketplace.md
        configure-runtime.md
      concepts/
        agents.md
        projects.md
        openspec.md
        test-spec-linkage.md
      reference/
        cli-commands.md
        config-options.md
        agent-template-syntax.md
      troubleshooting/
        common-errors.md
        debugging.md
        faq.md
    
    developer-guide/
      CONTRIBUTING.md
      development-setup.md
      architecture/
        overview.md
        monorepo-structure.md
        data-flow.md
        design-decisions.md
      testing/
        testing-guide.md
        test-spec-linkage.md
        e2e-tests.md
      api-internals.md
      release-process.md
    
    agent-guide/
      agent-best-practices.md
      prompt-engineering.md
      tool-usage-patterns.md
      file-conventions.md
      git-workflow.md
      reference/
        tool-catalog.md
        project-structure.md
        common-patterns.md
    
    api-reference/
      # Auto-generated from OpenAPI spec
      rest-api/
        projects.md
        agents.md
        tasks.md
        deployments.md
      webhooks.md
      extension-api.md
    
    community/
      code-of-conduct.md
      contributing-agents.md
      plugin-development.md
      showcase.md
    
    operations/
      deployment/
        aws.md
        docker.md
        kubernetes.md
      configuration.md
      security.md
      scaling.md
      monitoring.md
  
  blog/                  # Release announcements, updates
    2026-02-01-v1-release.md
    2026-03-15-marketplace-launch.md
  
  src/
    pages/
      index.js           # Homepage
      community.js       # Community page
    components/
      HomepageFeatures/  # Feature cards
  
  static/
    img/                 # Screenshots, diagrams
    video/               # Demo videos (future)
  
  docusaurus.config.js   # Site configuration
  sidebars.js            # Navigation structure
```

### Navigation Structure

**Homepage:**
- Hero section: "Build software with autonomous AI agents"
- Quick start (3 steps)
- Feature highlights
- Navbar: Docs | API | Community | Blog

**Docs Navbar:**
```
👤 User Guide
├─ Getting Started
├─ Tutorials
├─ How-To Guides
├─ Concepts
├─ Reference
└─ Troubleshooting

🔧 Developer Guide
├─ Contributing
├─ Development Setup
├─ Architecture
├─ Testing
└─ Release Process

🤖 Agent Guide
├─ Best Practices
├─ Prompt Engineering
├─ Tool Catalog
└─ File Conventions

📡 API Reference
├─ REST API
├─ Webhooks
└─ Extension API

🌍 Community
├─ Code of Conduct
├─ Contributing Agents
└─ Showcase

🚀 Operations
├─ Deployment
├─ Configuration
└─ Monitoring
```

### Search Strategy

**Algolia DocSearch:**
- Free for open source projects
- Indexes entire site automatically
- Keyboard shortcut (Cmd+K / Ctrl+K)
- Instant results
- Contextual (shows section hierarchy)

**Configuration:**
```json
{
  "index_name": "agentforge",
  "start_urls": ["https://docs.agentforge.dev/"],
  "selectors": {
    "lvl0": "h1",
    "lvl1": "h2",
    "lvl2": "h3",
    "text": "p, li"
  }
}
```

### Deployment Pipeline

**GitHub Actions Workflow:**
```yaml
name: Deploy Docs

on:
  push:
    branches: [main]
    paths:
      - 'website/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - name: Install dependencies
        run: cd website && yarn install
      
      - name: Build docs
        run: cd website && yarn build
      
      - name: Deploy to S3
        run: aws s3 sync website/build/ s3://agentforge-docs
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
      
      - name: Invalidate CloudFront
        run: aws cloudfront create-invalidation --distribution-id ${{ secrets.CF_DISTRIBUTION_ID }} --paths "/*"
```

**AWS Infrastructure:**
- S3 bucket: `agentforge-docs`
- CloudFront distribution
- Custom domain: `docs.agentforge.dev` (CNAME)
- SSL certificate via ACM
- Cost: ~$1-3/month

### API Documentation Auto-Generation

**Using `docusaurus-plugin-openapi-docs`:**

1. **Generate OpenAPI Spec:**
   - Option A: Write spec manually (YAML)
   - Option B: Generate from code comments (tsoa, swagger-jsdoc)
   - Option C: Export from API at runtime

2. **Plugin Configuration:**
```js
// docusaurus.config.js
{
  plugins: [
    [
      'docusaurus-plugin-openapi-docs',
      {
        id: 'agentforge-api',
        docsPluginId: 'classic',
        config: {
          agentforge: {
            specPath: '../openapi/agentforge-api.yaml',
            outputDir: 'docs/api-reference/rest-api',
            sidebarOptions: {
              groupPathsBy: 'tag',
            },
          },
        },
      },
    ],
  ],
}
```

3. **Generate Markdown:**
```bash
yarn docusaurus gen-api-docs agentforge
```

4. **Result:**
   - Auto-generated markdown for each endpoint
   - Interactive API explorer (try requests)
   - Request/response examples
   - Parameter documentation

### Content Templates

**Tutorial Template:**
```markdown
---
sidebar_position: 1
---

# [Tutorial Title]

**Time:** X minutes  
**Level:** Beginner/Intermediate/Advanced  
**Prerequisites:** List

## What You'll Build
Brief description

## Step 1: [First Step]
Instructions...

\```javascript
// Code example
\```

## Step 2: [Second Step]
...

## Next Steps
- Related tutorial
- Advanced topic
```

**How-To Template:**
```markdown
---
sidebar_position: 2
---

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

## Troubleshooting
- Issue → Solution

## Related
- [Link to related docs]
```

**Concept Template:**
```markdown
---
sidebar_position: 1
---

# [Concept Name]

Brief overview of the concept.

## What is [Concept]?
Detailed explanation

## Why [Concept]?
When and why to use

## How [Concept] Works
Technical details

## Examples
Real-world usage

## Best Practices
Do's and don'ts

## Related
- Other concepts
```

## Implementation Notes

**Docusaurus Setup:**
```bash
# Create docs site
npx create-docusaurus@latest website classic

# Install plugins
cd website
yarn add docusaurus-plugin-openapi-docs
yarn add @docusaurus/plugin-content-blog
yarn add @docusaurus/plugin-sitemap
```

**Configuration (`docusaurus.config.js`):**
```js
module.exports = {
  title: 'AgentForge',
  tagline: 'Build software with autonomous AI agents',
  url: 'https://docs.agentforge.dev',
  baseUrl: '/',
  organizationName: 'agentforge',
  projectName: 'agent-dev-cycle',
  
  themeConfig: {
    navbar: {
      title: 'AgentForge',
      logo: { src: 'img/logo.svg' },
      items: [
        { type: 'doc', docId: 'user-guide/intro', label: 'Docs' },
        { type: 'doc', docId: 'api-reference/intro', label: 'API' },
        { to: '/community', label: 'Community' },
        { to: '/blog', label: 'Blog' },
        { type: 'docsVersionDropdown', position: 'right' },
        { href: 'https://github.com/tcosentino/agent-dev-cycle', label: 'GitHub' },
      ],
    },
    algolia: {
      appId: 'YOUR_APP_ID',
      apiKey: 'YOUR_SEARCH_API_KEY',
      indexName: 'agentforge',
    },
  },
  
  plugins: [
    [
      'docusaurus-plugin-openapi-docs',
      {
        id: 'agentforge-api',
        config: { /* ... */ },
      },
    ],
  ],
};
```

**Sidebar Configuration (`sidebars.js`):**
```js
module.exports = {
  userGuideSidebar: [
    'user-guide/intro',
    {
      type: 'category',
      label: 'Getting Started',
      items: ['user-guide/getting-started/installation', 'user-guide/getting-started/first-project'],
    },
    {
      type: 'category',
      label: 'Tutorials',
      items: ['user-guide/tutorials/todo-app', 'user-guide/tutorials/multi-agent'],
    },
  ],
  
  developerGuideSidebar: [
    'developer-guide/intro',
    'developer-guide/CONTRIBUTING',
    {
      type: 'category',
      label: 'Architecture',
      items: ['developer-guide/architecture/overview', 'developer-guide/architecture/monorepo'],
    },
  ],
};
```

**Versioning:**
```bash
# Cut a version when releasing v1.0
yarn docusaurus docs:version 1.0

# Creates versioned_docs/version-1.0/ with snapshot
# Versions listed in versions.json
```

**Build & Deploy:**
```bash
# Local development
yarn start

# Production build
yarn build

# Deploy to AWS
aws s3 sync build/ s3://agentforge-docs
aws cloudfront create-invalidation --distribution-id XYZ --paths "/*"
```

## Agent Context Templates

**PROJECT.md Template:**
```markdown
# [Project Name]

## Overview
Brief description of what this project does.

## Architecture
High-level architecture diagram or description.

## Key Components
- Component 1: Description
- Component 2: Description

## Tech Stack
- Language: TypeScript
- Framework: React
- Database: PostgreSQL

## Development Workflow
How to work on this project.

## Conventions
- Naming conventions
- File organization
- Code style

## Resources
- Links to external docs
- API documentation
- Design files
```

**AGENTS.md Template:**
```markdown
# Agent Guidelines

## Your Role
You are an AI agent working on the [Project Name] project.

## Capabilities
You have access to:
- File system (read/write)
- Shell commands
- Web search
- [Other tools]

## Boundaries
Do NOT:
- Make destructive changes without asking
- Expose private data
- Run commands that could harm the system

## Conventions
Follow these conventions when working:
- Commit messages: conventional commits
- Branch naming: feature/task-name
- Testing: write tests for new features

## Communication
- Be clear and concise
- Explain your reasoning
- Ask when uncertain
```

## Future Enhancements

**Interactive Examples:**
- Embedded code editor (CodeSandbox)
- Try API calls in-browser
- Interactive tutorials

**Video Content:**
- Getting started video
- Feature walkthroughs
- Architecture deep dives

**Internationalization:**
- Docusaurus i18n support
- Community translations
- Language selector

**Advanced Search:**
- AI-powered search
- Natural language queries
- Suggested docs based on context

**Analytics:**
- Track most-visited pages
- Identify gaps (high bounce rate)
- Measure effectiveness

**In-App Help:**
- Contextual help links from AgentForge UI
- Embedded docs viewer (future)
