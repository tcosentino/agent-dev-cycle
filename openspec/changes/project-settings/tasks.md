# Project Settings - Implementation Tasks

## 1. Backend API - Project Metadata

- [ ] 1.1 Create PATCH `/api/projects/:projectId` endpoint
- [ ] 1.2 Add request validation (name, description)
- [ ] 1.3 Check for duplicate project names
- [ ] 1.4 Update project in database
- [ ] 1.5 Return updated project metadata
- [ ] 1.6 Add TypeScript types for update request/response
- [ ] 1.7 Add error handling (duplicate name, validation errors)

## 2. Backend API - Project Deletion

- [ ] 2.1 Create DELETE `/api/projects/:projectId` endpoint
- [ ] 2.2 Validate confirmation (typed project name matches)
- [ ] 2.3 Check user has permission to delete
- [ ] 2.4 Remove project from database
- [ ] 2.5 Preserve Git repository on disk
- [ ] 2.6 Return deletion confirmation
- [ ] 2.7 Add audit log entry for deletion (future)
- [ ] 2.8 Handle errors (project not found, permission denied)

## 3. UI - Settings Page Route

- [ ] 3.1 Create `/project/:projectId/settings` route
- [ ] 3.2 Create `SettingsPage` component
- [ ] 3.3 Add route protection (authentication required)
- [ ] 3.4 Add route parameter validation (valid projectId)
- [ ] 3.5 Handle navigation from ProjectViewer

## 4. UI - Settings Layout

- [ ] 4.1 Create settings page layout (sidebar + content)
- [ ] 4.2 Add settings header (project name, breadcrumbs)
- [ ] 4.3 Create responsive layout (sidebar → tabs → dropdown)
- [ ] 4.4 Style with CSS modules
- [ ] 4.5 Add loading state skeleton

## 5. UI - Settings Sidebar/Tabs

- [ ] 5.1 Create `SettingsSidebar` component
- [ ] 5.2 Display tabs: General, Runtime, Auth, Collaboration, Advanced, Danger Zone
- [ ] 5.3 Highlight active tab
- [ ] 5.4 Handle tab click (change active content)
- [ ] 5.5 Persist active tab in URL query parameter
- [ ] 5.6 Default to General tab if no query param
- [ ] 5.7 Make responsive (sidebar → horizontal tabs → dropdown)

## 6. UI - General Settings Tab

- [ ] 6.1 Create `GeneralSettings` component
- [ ] 6.2 Fetch current project metadata on mount
- [ ] 6.3 Create form with fields: name, description
- [ ] 6.4 Display read-only fields: key, repository, created, owner
- [ ] 6.5 Add "Save Changes" button (disabled when pristine)
- [ ] 6.6 Add "Cancel" button
- [ ] 6.7 Style form fields and layout

## 7. Form State Management

- [ ] 7.1 Track form dirty state (has unsaved changes)
- [ ] 7.2 Enable "Save Changes" button when form is dirty
- [ ] 7.3 Disable "Save Changes" button when pristine
- [ ] 7.4 Reset form to pristine on successful save
- [ ] 7.5 Show unsaved changes indicator
- [ ] 7.6 Handle cancel (revert to original values)

## 8. Form Validation - Client Side

- [ ] 8.1 Validate project name required
- [ ] 8.2 Validate project name length (1-100 chars)
- [ ] 8.3 Validate description length (max 500 chars)
- [ ] 8.4 Show inline error messages
- [ ] 8.5 Disable submit if validation fails
- [ ] 8.6 Show character count for description field

## 9. Form Submission

- [ ] 9.1 Handle "Save Changes" button click
- [ ] 9.2 Show loading state on button and form
- [ ] 9.3 Call PATCH `/api/projects/:projectId` endpoint
- [ ] 9.4 Handle success response
- [ ] 9.5 Show success notification "Settings saved"
- [ ] 9.6 Update UI with new values (sidebar, header, etc.)
- [ ] 9.7 Reset form to pristine state
- [ ] 9.8 Handle errors (show inline errors)

## 10. Duplicate Name Handling

- [ ] 10.1 Handle 409 Conflict error from API
- [ ] 10.2 Show error "Project with name 'X' already exists"
- [ ] 10.3 Suggest alternative name (e.g., "ProjectName-2")
- [ ] 10.4 Keep form in edit mode with error displayed
- [ ] 10.5 Allow user to change name and retry

## 11. Unsaved Changes Warning

- [ ] 11.1 Detect when user tries to navigate away
- [ ] 11.2 Show confirmation dialog "You have unsaved changes. Discard?"
- [ ] 11.3 Handle "Discard" (navigate away, lose changes)
- [ ] 11.4 Handle "Stay" (remain on page with edits intact)
- [ ] 11.5 Skip warning if form is pristine

## 12. Danger Zone Section

- [ ] 12.1 Create `DangerZone` component
- [ ] 12.2 Add to bottom of settings page (all tabs or separate tab)
- [ ] 12.3 Style with red/warning colors
- [ ] 12.4 Add "Delete Project" button
- [ ] 12.5 Add warning text explaining consequences
- [ ] 12.6 Add icon (warning triangle)

## 13. Delete Confirmation Modal

- [ ] 13.1 Create `DeleteProjectModal` component
- [ ] 13.2 Open modal when user clicks "Delete Project"
- [ ] 13.3 Show warning message with project name
- [ ] 13.4 Explain Git repository will be preserved
- [ ] 13.5 Add text input "Type 'ProjectName' to confirm"
- [ ] 13.6 Add "Delete Project" button (red, disabled until confirmation valid)
- [ ] 13.7 Add "Cancel" button
- [ ] 13.8 Validate typed name matches project name exactly
- [ ] 13.9 Show error if confirmation doesn't match

## 14. Delete Execution

- [ ] 14.1 Handle "Delete Project" button click in modal
- [ ] 14.2 Show loading state on modal and button
- [ ] 14.3 Call DELETE `/api/projects/:projectId` endpoint
- [ ] 14.4 Handle success response
- [ ] 14.5 Close modal
- [ ] 14.6 Redirect to projects list
- [ ] 14.7 Show success notification "Project deleted"
- [ ] 14.8 Remove project from projects list in UI
- [ ] 14.9 Handle errors (show error in modal, allow retry)

## 15. Settings Button in ProjectViewer

- [ ] 15.1 Add "Settings" button/menu item to ProjectViewer
- [ ] 15.2 Position in toolbar or dropdown menu
- [ ] 15.3 Style consistently with existing UI
- [ ] 15.4 Wire up click to navigate to settings page
- [ ] 15.5 Show only when project is selected
- [ ] 15.6 Add icon (gear/cog)

## 16. Read-Only Fields Display

- [ ] 16.1 Display project key (read-only, non-editable)
- [ ] 16.2 Display repository URL as clickable link
- [ ] 16.3 Display created date (formatted nicely)
- [ ] 16.4 Display last updated date (relative or absolute)
- [ ] 16.5 Display owner (username/email)
- [ ] 16.6 Add help text explaining each field
- [ ] 16.7 Style read-only fields differently from editable

## 17. Error Handling

- [ ] 17.1 Handle network errors (show error + retry button)
- [ ] 17.2 Handle server errors (500, etc.)
- [ ] 17.3 Handle validation errors (display inline)
- [ ] 17.4 Handle authorization errors (redirect to login)
- [ ] 17.5 Handle project not found (redirect to projects list)
- [ ] 17.6 Log errors for debugging

## 18. Tab State in URL

- [ ] 18.1 Add `?tab={tabName}` query parameter to URL
- [ ] 18.2 Update URL when tab changes (no page reload)
- [ ] 18.3 Read tab from URL on page load
- [ ] 18.4 Default to General if no tab parameter or invalid
- [ ] 18.5 Support browser back/forward with tab state

## 19. Responsive Design

- [ ] 19.1 Test settings page on desktop (> 1024px)
- [ ] 19.2 Test settings page on tablet (768-1024px)
- [ ] 19.3 Test settings page on mobile (< 768px)
- [ ] 19.4 Sidebar → horizontal tabs → dropdown on smaller screens
- [ ] 19.5 Form fields full-width on mobile
- [ ] 19.6 Buttons full-width on mobile
- [ ] 19.7 Modal full-screen on mobile

## 20. Accessibility

- [ ] 20.1 Add ARIA labels to all form fields
- [ ] 20.2 Add ARIA role to settings page
- [ ] 20.3 Add ARIA labels to tabs
- [ ] 20.4 Support keyboard navigation (Tab, Enter, Escape)
- [ ] 20.5 Trap focus in delete confirmation modal
- [ ] 20.6 Return focus after modal closes
- [ ] 20.7 Announce form validation errors to screen readers
- [ ] 20.8 Announce save success/failure
- [ ] 20.9 Announce tab changes
- [ ] 20.10 Ensure color contrast meets WCAG AA

## 21. Loading States

- [ ] 21.1 Show skeleton loader while fetching project metadata
- [ ] 21.2 Show loading spinner on "Save Changes" button during save
- [ ] 21.3 Show loading overlay on form during save
- [ ] 21.4 Show loading spinner on delete button during deletion
- [ ] 21.5 Disable form inputs while saving
- [ ] 21.6 Handle race conditions (prevent multiple simultaneous saves)

## 22. Success Notifications

- [ ] 22.1 Show toast notification on successful save
- [ ] 22.2 Show toast notification on successful deletion
- [ ] 22.3 Auto-dismiss notifications after 3-5 seconds
- [ ] 22.4 Allow manual dismissal
- [ ] 22.5 Style notifications consistently

## 23. Future Tabs - Placeholders (MVP)

- [ ] 23.1 Create placeholder `RuntimeSettings` component
- [ ] 23.2 Create placeholder `AuthSettings` component
- [ ] 23.3 Create placeholder `CollaborationSettings` component
- [ ] 23.4 Create placeholder `AdvancedSettings` component
- [ ] 23.5 Show "Coming Soon" message in each
- [ ] 23.6 Link to GitHub issues for feature requests

## 24. Testing

- [ ] 24.1 Unit tests for GeneralSettings component
- [ ] 24.2 Unit tests for form validation logic
- [ ] 24.3 Unit tests for SettingsSidebar component
- [ ] 24.4 Unit tests for DeleteProjectModal component
- [ ] 24.5 Integration tests for settings page load
- [ ] 24.6 Integration tests for rename project flow
- [ ] 24.7 Integration tests for delete project flow
- [ ] 24.8 Integration tests for unsaved changes warning
- [ ] 24.9 Test error scenarios (network errors, validation errors)
- [ ] 24.10 Test responsive behavior
- [ ] 24.11 Accessibility testing with screen reader

## 25. Documentation

- [ ] 25.1 Update user docs with "Project Settings" section
- [ ] 25.2 Document how to rename projects
- [ ] 25.3 Document how to delete projects
- [ ] 25.4 Document read-only metadata fields
- [ ] 25.5 Add screenshots to docs
- [ ] 25.6 Update API documentation with settings endpoints
- [ ] 25.7 Document future tabs (Runtime, Auth, Collaboration)

## 26. Edge Cases

- [ ] 26.1 Handle project with very long name
- [ ] 26.2 Handle project with very long description
- [ ] 26.3 Handle project with special characters in name
- [ ] 26.4 Handle rapid save clicks (prevent duplicate requests)
- [ ] 26.5 Handle concurrent edits (future: conflict resolution)
- [ ] 26.6 Handle session expiry during settings edit

## 27. Performance

- [ ] 27.1 Debounce validation (don't validate on every keystroke)
- [ ] 27.2 Optimize form re-renders (use React.memo)
- [ ] 27.3 Cache project metadata (avoid redundant fetches)
- [ ] 27.4 Measure and optimize page load time
- [ ] 27.5 Lazy load tab content (only render active tab)

## 28. Polish

- [ ] 28.1 Add smooth transitions between tabs
- [ ] 28.2 Add focus transitions for better UX
- [ ] 28.3 Polish form field styling
- [ ] 28.4 Polish button hover/active states
- [ ] 28.5 Polish modal animations (slide in/out)
- [ ] 28.6 Add tooltips where helpful
- [ ] 28.7 Ensure consistent spacing and typography
- [ ] 28.8 Add keyboard shortcuts (Ctrl+S to save)
