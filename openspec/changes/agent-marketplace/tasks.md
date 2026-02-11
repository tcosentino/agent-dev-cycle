# Agent Marketplace - Implementation Tasks

## 1. Community Repository Setup

- [ ] 1.1 Create `agentforge/community-agents` GitHub repository
- [ ] 1.2 Create initial directory structure (code-quality/, testing/, documentation/, devops/, design/)
- [ ] 1.3 Write README.md with repository overview
- [ ] 1.4 Write CONTRIBUTING.md with contribution guidelines
- [ ] 1.5 Create 10-20 starter agents (curated by team)
- [ ] 1.6 Create metadata.json index file
- [ ] 1.7 Set up GitHub Actions for validation (future)
- [ ] 1.8 Configure repository permissions (public read, team write)

## 2. Backend API - List Agents

- [ ] 2.1 Create GET `/api/marketplace/agents` endpoint
- [ ] 2.2 Implement GitHub API integration to fetch metadata.json
- [ ] 2.3 Add caching layer (Redis or file system, 1 hour TTL)
- [ ] 2.4 Parse metadata.json and return agent list
- [ ] 2.5 Add query parameter support (category, search, tags, limit, offset)
- [ ] 2.6 Implement search filtering (title + description)
- [ ] 2.7 Implement category filtering
- [ ] 2.8 Add pagination logic
- [ ] 2.9 Handle repository fetch errors gracefully
- [ ] 2.10 Add TypeScript types for marketplace agent responses

## 3. Backend API - Agent Details

- [ ] 3.1 Create GET `/api/marketplace/agents/:id` endpoint
- [ ] 3.2 Fetch agent markdown file from repository
- [ ] 3.3 Parse markdown frontmatter (YAML)
- [ ] 3.4 Parse markdown content (agent prompt)
- [ ] 3.5 Combine metadata + content in response
- [ ] 3.6 Add caching for agent details (24 hour TTL)
- [ ] 3.7 Handle missing agent errors (404)
- [ ] 3.8 Add markdown sanitization (prevent XSS)

## 4. Backend API - Install Agent

- [ ] 4.1 Create POST `/api/projects/:projectId/agents/install` endpoint
- [ ] 4.2 Accept marketplaceAgentId and optional customName
- [ ] 4.3 Fetch agent content from marketplace
- [ ] 4.4 Validate agent name (check for duplicates)
- [ ] 4.5 Create agent file in project repo (agents/{name}.md)
- [ ] 4.6 Commit file with message "Install {name} from marketplace"
- [ ] 4.7 Track installation metadata (source, marketplaceId, installedAt)
- [ ] 4.8 Return installed agent metadata
- [ ] 4.9 Handle errors (duplicate name, Git errors, fetch errors)

## 5. UI - Marketplace Page

- [ ] 5.1 Create `MarketplacePage` component
- [ ] 5.2 Add route `/marketplace` in router
- [ ] 5.3 Create page layout (header, sidebar, content)
- [ ] 5.4 Add breadcrumb navigation (Home → Marketplace)
- [ ] 5.5 Add loading state (skeleton loaders)
- [ ] 5.6 Add error state with retry button
- [ ] 5.7 Style page with CSS modules

## 6. UI - Marketplace Header

- [ ] 6.1 Create `MarketplaceHeader` component
- [ ] 6.2 Add search bar with icon
- [ ] 6.3 Implement search debouncing (300ms)
- [ ] 6.4 Add "Refresh" button to fetch latest agents
- [ ] 6.5 Display results count (e.g., "42 agents")
- [ ] 6.6 Add cache indicator ("cached" badge)

## 7. UI - Category Navigation

- [ ] 7.1 Create `CategoryNav` component
- [ ] 7.2 Fetch categories from API response
- [ ] 7.3 Display "All Categories" option (default selected)
- [ ] 7.4 Display category list with agent counts
- [ ] 7.5 Highlight active category
- [ ] 7.6 Handle category click (filter agents)
- [ ] 7.7 Make responsive (sidebar on desktop, tabs/dropdown on mobile)

## 8. UI - Agent Grid

- [ ] 8.1 Create `AgentGrid` component
- [ ] 8.2 Display agents in responsive grid (3-4 columns on desktop, 1 on mobile)
- [ ] 8.3 Add CSS Grid layout
- [ ] 8.4 Handle empty state (no agents)
- [ ] 8.5 Add pagination controls (future)

## 9. UI - Agent Card

- [ ] 9.1 Create `AgentCard` component
- [ ] 9.2 Display agent title
- [ ] 9.3 Display short description (truncated to 2 lines)
- [ ] 9.4 Display category badge
- [ ] 9.5 Display tags (first 3)
- [ ] 9.6 Display author name
- [ ] 9.7 Add hover effects
- [ ] 9.8 Make card clickable (navigate to detail)
- [ ] 9.9 Style with CSS modules

## 10. UI - Agent Detail View

- [ ] 10.1 Create `AgentDetailView` component (modal or full page)
- [ ] 10.2 Fetch agent details on mount
- [ ] 10.3 Display agent title and description
- [ ] 10.4 Display category and all tags
- [ ] 10.5 Display author, version, dates
- [ ] 10.6 Display full agent prompt (markdown rendered)
- [ ] 10.7 Display use cases list
- [ ] 10.8 Add "Add to Project" button
- [ ] 10.9 Add close/back button
- [ ] 10.10 Handle loading and error states
- [ ] 10.11 Style with CSS modules

## 11. UI - Agent Prompt Preview

- [ ] 11.1 Create `PromptPreview` component
- [ ] 11.2 Render markdown with syntax highlighting
- [ ] 11.3 Add scrollable container for long prompts
- [ ] 11.4 Add code block styling
- [ ] 11.5 Add section headers styling (## Role, ## Responsibilities, etc.)
- [ ] 11.6 Add copy button for full prompt (future)

## 12. UI - Install Agent Modal

- [ ] 12.1 Create `InstallAgentModal` component
- [ ] 12.2 Show when user clicks "Add to Project"
- [ ] 12.3 Display project selection dropdown (if multiple projects)
- [ ] 12.4 Add agent name field (pre-filled with marketplace name)
- [ ] 12.5 Validate name (alphanumeric + hyphens/underscores)
- [ ] 12.6 Check for duplicate names (show error)
- [ ] 12.7 Add "Install" and "Cancel" buttons
- [ ] 12.8 Handle installation (call API)
- [ ] 12.9 Show loading state during installation
- [ ] 12.10 Close modal on success
- [ ] 12.11 Show success notification
- [ ] 12.12 Handle errors (display in modal)

## 13. Agents Sidebar Integration

- [ ] 13.1 Add "Agent Marketplace" button to agents sidebar header
- [ ] 13.2 Style button consistently with existing UI
- [ ] 13.3 Position button next to "New Agent" button
- [ ] 13.4 Wire up button click to navigate to `/marketplace`
- [ ] 13.5 Add icon (e.g., shopping bag, store, globe)

## 14. Agent List Integration

- [ ] 14.1 Mark installed marketplace agents with indicator
- [ ] 14.2 Store installation metadata (source: "marketplace", marketplaceId)
- [ ] 14.3 Display "From Marketplace" badge in agent list
- [ ] 14.4 Allow editing installed marketplace agents (they're just local files)

## 15. Caching

- [ ] 15.1 Implement cache key generation
- [ ] 15.2 Cache marketplace agent list (1 hour TTL)
- [ ] 15.3 Cache agent details (24 hour TTL)
- [ ] 15.4 Add cache invalidation logic
- [ ] 15.5 Support manual refresh (clear cache and re-fetch)
- [ ] 15.6 Handle offline mode (use cached data if available)

## 16. Search & Filtering

- [ ] 16.1 Implement client-side search (title + description)
- [ ] 16.2 Debounce search input (300ms)
- [ ] 16.3 Display search results count
- [ ] 16.4 Highlight search matches (future)
- [ ] 16.5 Implement category filtering (client or server-side)
- [ ] 16.6 Combine search + category filters
- [ ] 16.7 Add "Clear Filters" button
- [ ] 16.8 Persist filters in URL query params (future)

## 17. Error Handling

- [ ] 17.1 Handle repository fetch errors (show error + retry)
- [ ] 17.2 Handle agent not found (404)
- [ ] 17.3 Handle installation errors (Git, duplicate name, etc.)
- [ ] 17.4 Handle network errors (offline mode)
- [ ] 17.5 Display error messages with clear actions
- [ ] 17.6 Add retry button for failed operations
- [ ] 17.7 Add fallback to cached data if fetch fails

## 18. Responsive Design

- [ ] 18.1 Test marketplace on desktop (> 1024px)
- [ ] 18.2 Test marketplace on tablet (768-1024px)
- [ ] 18.3 Test marketplace on mobile (< 768px)
- [ ] 18.4 Make category nav responsive (sidebar → tabs/dropdown)
- [ ] 18.5 Make agent grid responsive (3-4 cols → 1 col)
- [ ] 18.6 Ensure search bar is prominent on mobile
- [ ] 18.7 Test agent detail view on mobile

## 19. Empty States

- [ ] 19.1 Design empty state for no agents
- [ ] 19.2 Design empty state for no search results
- [ ] 19.3 Design empty state for empty category
- [ ] 19.4 Add helpful messages and CTAs
- [ ] 19.5 Add illustrations or icons

## 20. Performance

- [ ] 20.1 Lazy load agent details (fetch on demand)
- [ ] 20.2 Paginate marketplace (50 agents per page)
- [ ] 20.3 Debounce search input
- [ ] 20.4 Optimize image loading (if agent icons added)
- [ ] 20.5 Add loading indicators for async operations
- [ ] 20.6 Measure and optimize page load time

## 21. Accessibility

- [ ] 21.1 Add ARIA labels to all interactive elements
- [ ] 21.2 Support keyboard navigation (Tab, Enter, ESC, Arrows)
- [ ] 21.3 Trap focus in modals
- [ ] 21.4 Announce search results count to screen readers
- [ ] 21.5 Announce category changes to screen readers
- [ ] 21.6 Add skip links for keyboard users
- [ ] 21.7 Ensure color contrast meets WCAG AA standards
- [ ] 21.8 Test with screen reader (VoiceOver, NVDA)

## 22. Security

- [ ] 22.1 Sanitize markdown content (prevent XSS)
- [ ] 22.2 Validate agent metadata format
- [ ] 22.3 Use safe markdown renderer
- [ ] 22.4 Validate repository source (official repo only)
- [ ] 22.5 Use HTTPS for all fetches
- [ ] 22.6 Escape HTML in agent content

## 23. Testing

- [ ] 23.1 Unit tests for marketplace API endpoints
- [ ] 23.2 Unit tests for agent installation logic
- [ ] 23.3 Unit tests for search/filtering
- [ ] 23.4 Unit tests for caching logic
- [ ] 23.5 Integration tests for marketplace page
- [ ] 23.6 Integration tests for agent detail view
- [ ] 23.7 Integration tests for agent installation flow
- [ ] 23.8 Test error handling
- [ ] 23.9 Test offline mode
- [ ] 23.10 Manual testing across browsers

## 24. Documentation

- [ ] 24.1 Update user docs with "Agent Marketplace" section
- [ ] 24.2 Document how to browse and install agents
- [ ] 24.3 Document agent categories and tags
- [ ] 24.4 Add screenshots to docs
- [ ] 24.5 Update API documentation with new endpoints
- [ ] 24.6 Write community repository README
- [ ] 24.7 Write CONTRIBUTING.md for agent submissions (future)

## 25. Initial Agent Collection

- [ ] 25.1 Write "Code Reviewer" agent
- [ ] 25.2 Write "Test Generator" agent
- [ ] 25.3 Write "README Writer" agent
- [ ] 25.4 Write "API Doc Generator" agent
- [ ] 25.5 Write "Linter" agent
- [ ] 25.6 Write "Refactorer" agent
- [ ] 25.7 Write "Security Auditor" agent
- [ ] 25.8 Write "E2E Test Writer" agent
- [ ] 25.9 Write "Unit Test Reviewer" agent
- [ ] 25.10 Write "Comment Writer" agent
- [ ] 25.11 Test all agents for quality
- [ ] 25.12 Add metadata to all agents

## 26. Polish

- [ ] 26.1 Add smooth page transitions
- [ ] 26.2 Add loading animations
- [ ] 26.3 Add success animations (checkmark on install)
- [ ] 26.4 Polish marketplace header styling
- [ ] 26.5 Polish agent card hover effects
- [ ] 26.6 Add tooltips where helpful
- [ ] 26.7 Ensure consistent spacing and typography
- [ ] 26.8 Add agent category icons
