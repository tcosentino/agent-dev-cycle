## Why

The first-time project creation experience is **the most critical moment** in AgentForge. It's where users either:
- ✅ See the magic happen and become believers
- ❌ Get confused, give up, and never come back

Currently, AgentForge has no guided project creation flow. Users must:
- Manually create projects via database
- Set up GitHub repos separately
- Configure `.agentforge/` structure themselves
- Understand agent roles and task structure upfront
- Have no clear starting point or success criteria

This creates a massive barrier to entry. **New users need a smooth, guided experience** that:
1. Gets them from zero to working agent in < 5 minutes
2. Shows tangible value immediately (agent actually doing something)
3. Teaches AgentForge concepts through action, not documentation
4. Builds confidence and excitement

## What Changes

Create a comprehensive **Project Creation Wizard** that guides users through the complete setup and first agent run.

### 1. Project Wizard (Multi-Step Form)
- **Step 1: Project Basics**
  - Project name (e.g., "Todo App")
  - Project key (auto-generated from name, e.g., "TODO")
  - Short description
  
- **Step 2: GitHub Repository**
  - Connect existing repo OR create new repo
  - AgentForge creates repo via GitHub API (if new)
  - Auto-clones and initializes `.agentforge/` structure
  
- **Step 3: Initial Setup**
  - What do you want to build? (free-form description)
  - OR: Choose from templates (Todo App, API Server, Dashboard, etc.)
  - System generates initial PROJECT.md and first tasks
  
- **Step 4: Kick Off First Run**
  - Preview generated tasks
  - Click "Start Building" to launch first agent session
  - Immediately navigate to session view (watch it happen)

### 2. GitHub Integration
- OAuth authentication with GitHub
- List user's repos for connection
- Create new repo via GitHub API
- Initialize with README, .gitignore, .agentforge/ structure
- Set up branch protection (optional)
- Add AgentForge as collaborator (if needed)

### 3. Automatic Initial Setup
- Create `.agentforge/` directory structure:
  - `PROJECT.md` (generated from user description)
  - `ARCHITECTURE.md` (template)
  - `agents/` (standard agent configs)
- Generate first 3-5 tasks based on project description
- Set up initial deployment config (if applicable)

### 4. Guided Onboarding
- Interactive tutorial overlays
- "Watch Your First Agent" experience
- Tips and explanations as agent works
- Success celebration when first task completes
- Next steps guide (add more tasks, customize agents, etc.)

## Capabilities

### New Capabilities
- `project-wizard`: Multi-step guided project creation
- `github-integration`: Connect/create repos, OAuth, API integration
- `initial-setup`: Auto-generate PROJECT.md, tasks, agent configs
- `onboarding-tutorial`: Interactive guide for first-time users

### Modified Capabilities
- `project-dataobject`: May need fields for setup state (incomplete, ready, active)
- `create-project-modal`: Replace simple form with wizard
- `project-viewer`: Add onboarding overlays for new projects

## Impact

**UI Changes:**
- New `ProjectWizard` component (multi-step form)
- New `GitHubRepoSelector` component (list repos, create new)
- New `OnboardingOverlay` component (tutorial tips)
- Update `ProjectViewer` to detect new projects and trigger onboarding
- Add celebration/success screens

**API Changes:**
- New endpoints for GitHub integration:
  - `GET /api/github/repos` - List user's repos
  - `POST /api/github/repos` - Create new repo
  - `POST /api/github/repos/:owner/:repo/init` - Initialize .agentforge/ structure
- New endpoint for project initialization:
  - `POST /api/projects/:id/initialize` - Generate PROJECT.md, tasks, configs
  
**Backend Changes:**
- GitHub API integration (via existing `github-integration`)
- AI generation of PROJECT.md from user description (Claude API)
- Template system for common project types
- Git operations (clone, commit initial structure, push)

**No Breaking Changes:**
- Existing projects continue to work
- Manual project creation still possible (for advanced users)
- Wizard is optional path, not forced

## Risks & Mitigations

**[Risk]** GitHub OAuth adds authentication complexity
→ **Mitigation:** Use existing `github-integration`, fallback to manual repo URL entry if OAuth fails

**[Risk]** AI-generated PROJECT.md might be low quality
→ **Mitigation:** Use proven prompts, allow editing before finalizing, provide templates as fallback

**[Risk]** First agent run could fail and ruin onboarding
→ **Mitigation:** Use simple, high-success-rate first task (e.g., "Create README.md with project description")

**[Risk]** Wizard could feel slow or tedious
→ **Mitigation:** Keep to 3-4 steps max, show progress bar, allow skipping optional steps

**[Trade-off]** More complex initial setup vs simpler manual entry
→ **Acceptable:** Wizard is default path but manual creation still available for power users

## Success Criteria

**User can:**
1. Create a project from scratch in < 3 minutes
2. See first agent session start within 5 minutes
3. Understand what's happening without reading docs
4. Feel confident adding more tasks after onboarding

**Metrics to track:**
- Time from "New Project" click to first agent session started
- Completion rate (how many finish wizard vs abandon)
- First agent session success rate
- User activation (return after first session)

## Design Principles

1. **Progressive Disclosure** - Don't overwhelm with all options upfront
2. **Show, Don't Tell** - Demonstrate with real agent work, not just instructions
3. **Quick Wins** - Get to working agent ASAP (defer advanced config)
4. **Reversible Actions** - Allow going back, editing, re-running setup
5. **Clear Next Steps** - Always show what to do next after each step
