## 1. Backend: AI Generation API Endpoints

- [ ] 1.1 Create POST /api/projects/:id/generate-project-md endpoint
- [ ] 1.2 Build prompt template for PROJECT.md generation
- [ ] 1.3 Add few-shot examples to prompt for consistent formatting
- [ ] 1.4 Integrate with Claude API (use Sonnet for speed/cost balance)
- [ ] 1.5 Parse and validate PROJECT.md structure (required sections present)
- [ ] 1.6 Create POST /api/projects/:id/generate-tasks endpoint
- [ ] 1.7 Build prompt for task generation from PROJECT.md
- [ ] 1.8 Parse AI response into task objects
- [ ] 1.9 Create tasks via task dataobject API with auto-generated keys
- [ ] 1.10 Add error handling and fallback to templates
- [ ] 1.11 Add rate limiting to prevent API abuse

## 2. Backend: GitHub Integration API Endpoints

- [ ] 2.1 Add GET /api/github/repos endpoint (list user's repos)
- [ ] 2.2 Implement pagination for repo list (20 per page)
- [ ] 2.3 Add search/filter query params (name, updated date)
- [ ] 2.4 Add POST /api/github/repos endpoint (create new repo)
- [ ] 2.5 Validate repo name, handle name conflicts
- [ ] 2.6 Add POST /api/github/repos/:owner/:repo/init endpoint
- [ ] 2.7 Implement .agentforge/ structure initialization logic
- [ ] 2.8 Create initial commit with generated files
- [ ] 2.9 Add permission validation (check user has write access)
- [ ] 2.10 Handle GitHub API errors gracefully (rate limits, auth failures)

## 3. Backend: Project Initialization Endpoint

- [ ] 3.1 Create POST /api/projects/:id/initialize endpoint
- [ ] 3.2 Coordinate AI generation (PROJECT.md, tasks)
- [ ] 3.3 Initialize GitHub repo (if selected)
- [ ] 3.4 Commit .agentforge/ structure
- [ ] 3.5 Return initialization status and created resources
- [ ] 3.6 Add rollback logic if any step fails

## 4. Frontend: Wizard Core Components

- [ ] 4.1 Create ProjectWizard component in packages/ui-components/
- [ ] 4.2 Implement WizardStep container (reusable)
- [ ] 4.3 Add progress indicator (1/4, 2/4, etc.)
- [ ] 4.4 Add Next/Back/Cancel navigation buttons
- [ ] 4.5 Implement step validation (can't proceed if invalid)
- [ ] 4.6 Add wizard state management (React state or Context)
- [ ] 4.7 Add CSS module for wizard layout and animations
- [ ] 4.8 Implement localStorage persistence for draft state
- [ ] 4.9 Add 24-hour expiry logic for drafts
- [ ] 4.10 Implement cancel confirmation dialog

## 5. Frontend: Step 1 - Project Basics

- [ ] 5.1 Create Step1ProjectBasics component
- [ ] 5.2 Add project name input field
- [ ] 5.3 Add project key input (auto-generated from name)
- [ ] 5.4 Implement auto-generation logic (slugify, uppercase, dedupe)
- [ ] 5.5 Allow manual override of auto-generated key
- [ ] 5.6 Add project description textarea (optional)
- [ ] 5.7 Add character counters for inputs
- [ ] 5.8 Validate project name (required, max 100 chars)
- [ ] 5.9 Validate project key (required, alphanumeric+hyphens, unique)
- [ ] 5.10 Call API to check key uniqueness on blur

## 6. Frontend: Step 2 - GitHub Repository

- [ ] 6.1 Create Step2GitHubRepo component
- [ ] 6.2 Add GitHubAuthButton (trigger OAuth flow)
- [ ] 6.3 Implement OAuth callback handling
- [ ] 6.4 Create RepoSelector component (list existing repos)
- [ ] 6.5 Fetch repos from GET /api/github/repos
- [ ] 6.6 Implement search box for repo filtering
- [ ] 6.7 Add sort options (recent, stars, name)
- [ ] 6.8 Implement pagination (load more)
- [ ] 6.9 Create NewRepoForm component (create new repo)
- [ ] 6.10 Add repo name input (pre-filled from project name)
- [ ] 6.11 Add visibility toggle (public/private)
- [ ] 6.12 Add "Initialize with README" checkbox
- [ ] 6.13 Validate repo name format
- [ ] 6.14 Create ManualURLInput component (fallback)
- [ ] 6.15 Validate Git URL format
- [ ] 6.16 Handle GitHub OAuth errors gracefully

## 7. Frontend: Step 3 - Initial Setup

- [ ] 7.1 Create Step3InitialSetup component
- [ ] 7.2 Add tab switcher (Free-form vs Templates)
- [ ] 7.3 Implement free-form description input
- [ ] 7.4 Add "Generate" button to trigger AI generation
- [ ] 7.5 Create TemplateSelector component (grid of template cards)
- [ ] 7.6 Design template cards (Todo App, API Server, Dashboard, etc.)
- [ ] 7.7 Create PreviewPanel component (show generated PROJECT.md)
- [ ] 7.8 Add syntax highlighting for markdown preview
- [ ] 7.9 Add "Regenerate" button in preview
- [ ] 7.10 Add "Edit" button to open markdown editor
- [ ] 7.11 Implement inline markdown editor (simple textarea or CodeMirror)
- [ ] 7.12 Show generated task previews
- [ ] 7.13 Add loading states during AI generation

## 8. Frontend: Step 4 - Review and Launch

- [ ] 8.1 Create Step4Review component
- [ ] 8.2 Display summary card with all wizard data
- [ ] 8.3 Add "Edit" links to return to previous steps
- [ ] 8.4 Show preview of files to be created
- [ ] 8.5 Add expandable sections for PROJECT.md and task details
- [ ] 8.6 Create "Create Project & Start Building" button
- [ ] 8.7 Implement loading sequence with status messages
- [ ] 8.8 Call POST /api/projects (create project)
- [ ] 8.9 Call POST /api/projects/:id/initialize (run setup)
- [ ] 8.10 Call POST /api/agentSessions (start first agent)
- [ ] 8.11 Navigate to project view on success
- [ ] 8.12 Handle errors at any step (show specific error, allow retry)

## 9. Frontend: GitHub Integration UI

- [ ] 9.1 Create GitHubConnectButton component
- [ ] 9.2 Implement OAuth flow (open popup, handle callback)
- [ ] 9.3 Store GitHub token securely (httpOnly cookie)
- [ ] 9.4 Create RepoCard component (display repo metadata)
- [ ] 9.5 Add repo visibility badge (public/private)
- [ ] 9.6 Add last updated timestamp
- [ ] 9.7 Create empty state for no repos
- [ ] 9.8 Add disconnect/logout GitHub option

## 10. Frontend: Onboarding System

- [ ] 10.1 Create OnboardingOverlay component
- [ ] 10.2 Implement spotlight effect (darken page, highlight element)
- [ ] 10.3 Create TutorialStep component (tooltip + controls)
- [ ] 10.4 Define tutorial step sequence (5-6 steps)
- [ ] 10.5 Implement step navigation (Next, Back, Skip)
- [ ] 10.6 Add progress indicator for tutorial
- [ ] 10.7 Detect first-time project (check project.isNew flag)
- [ ] 10.8 Trigger onboarding after project creation
- [ ] 10.9 Add Skip tutorial confirmation dialog
- [ ] 10.10 Store onboarding state in localStorage
- [ ] 10.11 Add "Restart Tutorial" option in settings

## 11. Frontend: Real-time Tutorial Narration

- [ ] 11.1 Listen for agent session events (start, step complete, file created)
- [ ] 11.2 Show toast notifications for key events
- [ ] 11.3 Add animated indicators on file tree (new file created)
- [ ] 11.4 Highlight progress bar steps as they complete
- [ ] 11.5 Add subtle sound effects (optional, toggle in settings)

## 12. Frontend: Success Celebration

- [ ] 12.1 Create CelebrationModal component
- [ ] 12.2 Add confetti animation library (e.g., canvas-confetti)
- [ ] 12.3 Trigger modal when first agent session completes
- [ ] 12.4 Display session summary (files created, commits, time)
- [ ] 12.5 Add "View Results" button (navigate to session detail)
- [ ] 12.6 Add "Create Next Task" button (open task form)
- [ ] 12.7 Add CSS animations for modal entrance

## 13. Frontend: Failure Handling

- [ ] 13.1 Create HelpfulErrorModal component
- [ ] 13.2 Detect first agent session failure
- [ ] 13.3 Display simplified error message (not raw stack)
- [ ] 13.4 Add "Retry Task" button
- [ ] 13.5 Add "Modify Task" button (edit task description)
- [ ] 13.6 Add "View Logs" button (show full error)
- [ ] 13.7 Add "Get Help" button (link to docs/Discord)
- [ ] 13.8 Implement retry logic (create new session, same config)

## 14. Templates

- [ ] 14.1 Create Todo App template (PROJECT.md + tasks)
- [ ] 14.2 Create REST API Server template
- [ ] 14.3 Create Dashboard/Admin Panel template
- [ ] 14.4 Create React Component Library template
- [ ] 14.5 Store templates in /templates directory (YAML or JSON)
- [ ] 14.6 Add template metadata (name, description, icon, difficulty)
- [ ] 14.7 Implement template rendering engine (replace placeholders)

## 15. Agent Configurations

- [ ] 15.1 Create default agent configs (pm, engineer, qa, lead)
- [ ] 15.2 Write tailored prompts for each agent role
- [ ] 15.3 Add config.json with default model settings
- [ ] 15.4 Create project-type-specific agent prompts (frontend, backend, fullstack)
- [ ] 15.5 Implement agent config templating system

## 16. Project Initialization Logic

- [ ] 16.1 Implement .gitignore generation logic
- [ ] 16.2 Detect project type from description (Node.js, Python, React, etc.)
- [ ] 16.3 Add appropriate .gitignore entries based on type
- [ ] 16.4 Create ARCHITECTURE.md template
- [ ] 16.5 Create TESTING.md template
- [ ] 16.6 Implement template variable replacement ({PROJECT_NAME}, {PROJECT_KEY})

## 17. Integration with Existing UI

- [ ] 17.1 Replace simple "Create Project" modal with wizard trigger
- [ ] 17.2 Add "New Project" button to projects list (if empty)
- [ ] 17.3 Update ProjectViewer to detect new projects (isNew flag)
- [ ] 17.4 Trigger onboarding overlay for new projects
- [ ] 17.5 Add project setup state tracking (incomplete, initializing, ready)

## 18. Accessibility

- [ ] 18.1 Add ARIA labels to all wizard steps
- [ ] 18.2 Ensure keyboard navigation works (Tab, Enter, Escape)
- [ ] 18.3 Add focus management (step transitions, modal open/close)
- [ ] 18.4 Add screen reader announcements for step changes
- [ ] 18.5 Ensure color contrast meets WCAG AA
- [ ] 18.6 Add skip links in onboarding
- [ ] 18.7 Test with screen reader (VoiceOver, NVDA)

## 19. Testing: Unit Tests

- [ ] 19.1 Test project key auto-generation logic
- [ ] 19.2 Test wizard step navigation
- [ ] 19.3 Test localStorage persistence
- [ ] 19.4 Test PROJECT.md parsing and validation
- [ ] 19.5 Test task generation parsing
- [ ] 19.6 Test template rendering
- [ ] 19.7 Test GitHub repo validation

## 20. Testing: Integration Tests (Playwright)

- [ ] 20.1 Test complete wizard flow (4 steps, all paths)
- [ ] 20.2 Test GitHub OAuth flow (mock GitHub API)
- [ ] 20.3 Test AI generation (mock Claude API)
- [ ] 20.4 Test project creation and initialization
- [ ] 20.5 Test first agent session start
- [ ] 20.6 Test onboarding overlay progression
- [ ] 20.7 Test celebration modal on success
- [ ] 20.8 Test error modal on failure
- [ ] 20.9 Test wizard cancel and resume
- [ ] 20.10 Test template selection and preview

## 21. Error Handling

- [ ] 21.1 Handle GitHub OAuth failures gracefully
- [ ] 21.2 Handle AI API failures (timeout, rate limit, error)
- [ ] 21.3 Handle project creation failures (unique constraint, validation)
- [ ] 21.4 Handle Git operations failures (clone, commit, push)
- [ ] 21.5 Add user-friendly error messages for all error types
- [ ] 21.6 Implement retry logic where appropriate
- [ ] 21.7 Add error reporting (log to console, optional error tracking service)

## 22. Performance Optimization

- [ ] 22.1 Lazy load wizard steps (code-split by step)
- [ ] 22.2 Debounce API calls (key uniqueness check, repo search)
- [ ] 22.3 Cache GitHub repo list (15 minutes)
- [ ] 22.4 Optimize AI generation prompts (reduce token usage)
- [ ] 22.5 Add loading skeletons for better perceived performance

## 23. Documentation

- [ ] 23.1 Write wizard flow documentation (user guide)
- [ ] 23.2 Document GitHub integration setup
- [ ] 23.3 Document template creation guide
- [ ] 23.4 Add screenshots/GIFs to docs
- [ ] 23.5 Update ARCHITECTURE.md with wizard components
- [ ] 23.6 Create troubleshooting guide (common errors)
- [ ] 23.7 Document AI generation prompts for iteration

## 24. Polish

- [ ] 24.1 Add smooth transitions between wizard steps
- [ ] 24.2 Add loading animations (spinners, skeletons)
- [ ] 24.3 Add success animations (check marks, confetti)
- [ ] 24.4 Ensure consistent button styling across wizard
- [ ] 24.5 Add helpful placeholder text in inputs
- [ ] 24.6 Add character counters and validation hints
- [ ] 24.7 Test on multiple screen sizes (desktop, tablet, mobile)
- [ ] 24.8 Test cross-browser (Chrome, Firefox, Safari)
