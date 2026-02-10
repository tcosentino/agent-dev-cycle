## Context

AgentForge currently has no guided project creation experience. Users must:
- Manually create projects (or use simple modal form)
- Set up GitHub repos separately
- Understand `.agentforge/` structure before starting
- Know what to build before seeing agents in action

This creates a massive barrier to entry and prevents the "aha moment" where users see agents actually working.

**Goal:** Create a seamless, delightful first-time experience that gets users from zero to working agent in < 5 minutes.

## Goals / Non-Goals

**Goals:**
- Guided wizard with 3-4 clear steps
- GitHub OAuth integration for easy repo connection
- AI-generated PROJECT.md and initial tasks
- Interactive onboarding that teaches through action
- First agent session starts automatically
- Celebration on first success, helpful guidance on failure

**Non-Goals:**
- Advanced project templates (defer to future)
- Multi-agent orchestration in wizard (too complex for first run)
- Full project customization upfront (progressive disclosure)
- Integration with external services (Jira, Linear, etc.) in initial setup

## Decisions

### Decision 1: Multi-step wizard vs single-page form
**Choice:** Multi-step wizard (3-4 steps) with progress indicator

**Rationale:**
- Breaks complex setup into digestible chunks
- Reduces cognitive overload (one decision at a time)
- Allows back/forward navigation
- Matches user expectations from modern onboarding flows

**Alternative considered:** Single long form
- Faster for experienced users
- Overwhelming for first-timers
- No clear sense of progress

### Decision 2: AI generation vs templates
**Choice:** Both - AI generation with template fallback

**Rationale:**
- AI generation provides personalized PROJECT.md and tasks
- Templates ensure reliability if AI fails
- Templates work as examples for AI generation
- Users can choose template for speed or AI for customization

**Alternative considered:** Templates only
- More reliable but less personalized
- Less "wow factor"
- Doesn't showcase AI capabilities

**Alternative considered:** AI only
- Risky if AI service is down
- No fallback for simple/common use cases

### Decision 3: Automatic first agent run vs manual start
**Choice:** Automatic - first agent session starts immediately after project creation

**Rationale:**
- Creates immediate engagement and excitement
- Shows value before user has time to question
- Reduces steps to "aha moment"
- User can still cancel/pause if needed

**Alternative considered:** Manual start
- Gives user more control
- Delays gratification
- More likely to abandon before seeing value

### Decision 4: Onboarding approach
**Choice:** Interactive overlay tutorial with contextual tips

**Rationale:**
- Teaches through action (show, don't tell)
- Non-intrusive (can skip or dismiss)
- Contextual tips as features are discovered
- Adapts to user's pace

**Alternative considered:** Separate tutorial tour before first use
- Delays hands-on experience
- Boring without real work happening
- Users skip and then get confused

**Alternative considered:** Documentation only
- Zero friction but zero guidance
- High abandonment rate
- Doesn't leverage AgentForge's UI

### Decision 5: GitHub integration approach
**Choice:** OAuth for repo list/creation, fallback to manual URL

**Rationale:**
- OAuth provides best UX (one-click repo selection)
- Manual URL supports users who can't/won't OAuth
- Graceful degradation if GitHub API is unavailable

**Alternative considered:** Manual URL only
- Simpler implementation
- Poor UX for majority of users
- Misses opportunity to showcase integration

**Alternative considered:** GitHub OAuth required
- Best UX when it works
- Excludes users with private/air-gapped repos
- No fallback for API failures

### Decision 6: Local storage vs API for wizard state
**Choice:** Hybrid - localStorage for draft, API for final creation

**Rationale:**
- localStorage persists across refreshes (better UX)
- API creates project only when complete (no orphans)
- 24-hour expiry prevents stale drafts
- No server state for incomplete wizards

**Alternative considered:** API state from step 1
- More robust
- Creates database clutter with abandoned wizards
- Requires cleanup jobs

### Decision 7: PROJECT.md generation prompt strategy
**Choice:** Structured prompt with examples, few-shot learning

**Rationale:**
- Consistent output format
- Higher quality results
- Easier to validate and parse
- Can iterate on prompt without code changes

**Implementation:**
```
Generate a PROJECT.md for: {user_description}

Format (markdown):
## Project Overview
[1-2 sentence summary]

## Problem
[What problem does this solve?]

## Solution
[How does this project solve it?]

## Key Features
- [Feature 1]
- [Feature 2]
...

## Success Metrics
[How to measure success]
```

## Architecture

### Component Hierarchy

```
ProjectWizard
├── WizardStep (reusable step container)
├── Step1ProjectBasics
│   ├── ProjectNameInput
│   ├── ProjectKeyInput (auto-generated)
│   └── DescriptionTextarea
├── Step2GitHubRepo
│   ├── GitHubAuthButton (if not connected)
│   ├── RepoSelector (list existing)
│   │   ├── RepoCard
│   │   └── SearchBox
│   ├── NewRepoForm (create new)
│   └── ManualURLInput (fallback)
├── Step3InitialSetup
│   ├── FreeFormInput (AI generation)
│   ├── TemplateSelector (template cards)
│   └── PreviewPanel (show generated PROJECT.md)
└── Step4Review
    ├── SummaryCard
    ├── EditLinks (return to previous steps)
    └── CreateButton

OnboardingOverlay
├── TutorialStep (spotlight + tooltip)
├── ProgressIndicator
└── NavigationButtons (Next, Back, Skip)

CelebrationModal
├── ConfettiAnimation
├── SuccessMessage
├── SessionSummary
└── NextStepsButtons
```

### Data Flow

**Wizard Flow:**
```
User clicks "New Project"
  ↓
ProjectWizard opens (step 1)
  ↓
User enters project name "Todo App"
  ↓
Key auto-generates: "TODO"
  ↓
User clicks Next → Step 2
  ↓
GitHub OAuth → fetch repos
  ↓
User selects existing repo OR creates new
  ↓
User clicks Next → Step 3
  ↓
User enters description: "Task manager with priorities"
  ↓
AI generates PROJECT.md + tasks (preview shown)
  ↓
User clicks Next → Step 4 (Review)
  ↓
User clicks "Create Project & Start Building"
  ↓
API sequence:
  1. POST /api/projects (create project)
  2. POST /api/github/repos (if new repo)
  3. POST /api/github/repos/:owner/:repo/init (init .agentforge/)
  4. POST /api/projects/:id/initialize (AI generation)
  5. POST /api/agentSessions (start first agent)
  ↓
Wizard closes
  ↓
Navigate to project → agent session view
  ↓
Onboarding overlay appears
```

**AI Generation Flow:**
```
User description: "A todo app with priorities"
  ↓
POST /api/projects/:id/generate-project-md
  ↓ (server)
Build prompt with user description + templates
  ↓
Call Claude API (Sonnet)
  ↓
Parse markdown response
  ↓
Validate structure (has required sections)
  ↓ (if valid)
Return PROJECT.md content
  ↓ (client)
Preview shown to user
  ↓ (user approves)
Commit to .agentforge/PROJECT.md
```

**Task Generation Flow:**
```
PROJECT.md content + user description
  ↓
POST /api/projects/:id/generate-tasks
  ↓ (server)
Build prompt: "Generate 3-5 initial tasks for: {PROJECT.md summary}"
  ↓
Call Claude API
  ↓
Parse task list (JSON or structured markdown)
  ↓
Validate each task (has title, description)
  ↓ (if valid)
Create tasks via task dataobject API
  ↓
Return created tasks with auto-generated keys
```

## Risks / Trade-offs

**[Risk]** AI generation could produce low-quality PROJECT.md
→ **Mitigation:** Use few-shot prompting with good examples, allow regeneration, provide templates as fallback

**[Risk]** GitHub OAuth could fail (API down, rate limits)
→ **Mitigation:** Fallback to manual URL entry, cache repo list, handle errors gracefully

**[Risk]** First agent run could fail and discourage users
→ **Mitigation:** Use simple, high-success first task (e.g., "Create README"), helpful error messages, easy retry

**[Risk]** Wizard could feel slow/tedious
→ **Mitigation:** Keep to 3-4 steps, allow skipping optional steps, persist draft state

**[Risk]** Onboarding could be annoying
→ **Mitigation:** Easy skip button, auto-dismiss after completion, contextual (not modal-blocking)

**[Trade-off]** Automatic agent start vs user control
→ **Acceptable:** Excitement > control for first run, users can still cancel

**[Trade-off]** AI generation cost
→ **Acceptable:** One-time cost per project, provides significant UX value

**[Trade-off]** Wizard state in localStorage vs server
→ **Acceptable:** Better UX with localStorage, manageable risk of data loss

## Testing Strategy

**Unit Tests:**
- WizardStep navigation logic
- Project key auto-generation from name
- PROJECT.md parsing and validation
- Task generation parsing

**Integration Tests (Playwright):**
- Complete wizard flow (all 4 steps)
- GitHub OAuth flow (mock GitHub API)
- AI generation (mock Claude API)
- First agent session start
- Onboarding overlay progression
- Error handling (API failures, validation errors)

**User Acceptance Testing:**
- First-time user completes wizard in < 5 minutes
- First agent session succeeds with default task
- User understands what happened (post-onboarding survey)
- Celebration modal creates excitement

## Future Enhancements

1. **Advanced templates** - Industry-specific (SaaS, E-commerce, etc.)
2. **Import from existing project** - Analyze codebase, generate PROJECT.md
3. **Multi-agent setup wizard** - Configure custom agent roles
4. **Integration marketplace** - Connect to Jira, Linear, GitHub Issues
5. **Team invitations** - Invite collaborators during project creation
6. **Project goals tracking** - Set OKRs, track progress against goals
7. **Video tutorial** - Embedded video walkthrough as alternative to overlay
8. **Project templates marketplace** - Community-contributed templates
