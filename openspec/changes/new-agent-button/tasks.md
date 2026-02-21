# New Agent Button - Implementation Tasks

## 1. Backend API

- [ ] 1.1 Create POST `/api/projects/:projectId/agents` endpoint
- [ ] 1.2 Add agent name validation logic (alphanumeric + hyphens/underscores)
- [ ] 1.3 Add duplicate name checking
- [ ] 1.4 Implement agent file creation (`agents/{name}.md`)
- [ ] 1.5 Implement Git commit logic (create file + commit)
- [ ] 1.6 Add error handling for file system operations
- [ ] 1.7 Add error handling for Git operations
- [ ] 1.8 Create POST `/api/projects/:projectId/agents/reload` endpoint
- [ ] 1.9 Add agent discovery/refresh logic
- [ ] 1.10 Add TypeScript types for agent creation request/response

## 2. Template Generation

- [ ] 2.1 Create agent template utility function
- [ ] 2.2 Define starter template with sections (Role, Responsibilities, Guidelines, Context, Tools, Communication Style)
- [ ] 2.3 Add template placeholder substitution (agent name)
- [ ] 2.4 Support optional sections (all sections can be removed)
- [ ] 2.5 Add template to API response as default prompt value

## 3. UI Components - Modal

- [ ] 3.1 Create `CreateAgentModal` component
- [ ] 3.2 Add modal open/close state management
- [ ] 3.3 Add modal backdrop and styling
- [ ] 3.4 Add modal header with title "Create New Agent"
- [ ] 3.5 Add close button (X icon)
- [ ] 3.6 Handle ESC key to close modal
- [ ] 3.7 Add unsaved changes warning on close

## 4. UI Components - Form

- [ ] 4.1 Create agent name field (text input)
- [ ] 4.2 Add auto-focus to name field on modal open
- [ ] 4.3 Create agent type dropdown (optional field)
- [ ] 4.4 Add type options: Architect, Engineer, QA, Lead, PM, Designer, DevOps
- [ ] 4.5 Create prompt editor (textarea or CodeMirror)
- [ ] 4.6 Pre-fill prompt editor with starter template
- [ ] 4.7 Add character count indicator for prompt
- [ ] 4.8 Style form fields with CSS modules

## 5. Form Validation

- [ ] 5.1 Validate name field is required
- [ ] 5.2 Validate name format (alphanumeric + hyphens/underscores only)
- [ ] 5.3 Convert uppercase to lowercase in name field
- [ ] 5.4 Check for duplicate names on blur (API call)
- [ ] 5.5 Validate prompt field is required
- [ ] 5.6 Validate prompt length (min 10 chars, max 50,000 chars)
- [ ] 5.7 Display inline error messages for validation failures
- [ ] 5.8 Disable "Create Agent" button if form is invalid

## 6. Form Submission

- [ ] 6.1 Handle "Create Agent" button click
- [ ] 6.2 Show loading state on button and modal during submission
- [ ] 6.3 Call POST `/api/projects/:projectId/agents` endpoint
- [ ] 6.4 Handle successful response
- [ ] 6.5 Handle error responses (display error in modal)
- [ ] 6.6 Close modal on success
- [ ] 6.7 Show success toast notification
- [ ] 6.8 Reload agents list after success

## 7. Agents Sidebar Integration

- [ ] 7.1 Add "New Agent" button to agents sidebar header
- [ ] 7.2 Style button consistently with existing UI
- [ ] 7.3 Position button next to existing + icons
- [ ] 7.4 Wire up button click to open CreateAgentModal
- [ ] 7.5 Ensure button is only visible when project is selected

## 8. Agent List Reload

- [ ] 8.1 Create reload function in ProjectViewer
- [ ] 8.2 Call reload after successful agent creation
- [ ] 8.3 Update agents list state with new agent
- [ ] 8.4 Optionally auto-select newly created agent
- [ ] 8.5 Show loading indicator during reload

## 9. Error Handling

- [ ] 9.1 Handle "duplicate name" error (show inline error + suggestion)
- [ ] 9.2 Handle "invalid name" error (show format requirements)
- [ ] 9.3 Handle Git commit errors (show error + retry option)
- [ ] 9.4 Handle file system errors (show error + manual save option)
- [ ] 9.5 Handle network errors (show error + retry)
- [ ] 9.6 Add retry button for failed operations
- [ ] 9.7 Add "Save Manually" fallback with file content

## 10. Template Features

- [ ] 10.1 Update template header with agent name as user types
- [ ] 10.2 Support template editing (all sections editable)
- [ ] 10.3 Support section deletion (users can remove sections)
- [ ] 10.4 Add example content/placeholders in sections
- [ ] 10.5 Preserve template structure while allowing customization

## 11. Accessibility

- [ ] 11.1 Add proper ARIA labels to all form fields
- [ ] 11.2 Add ARIA role to modal
- [ ] 11.3 Trap focus within modal when open
- [ ] 11.4 Support keyboard navigation (Tab, Enter, ESC)
- [ ] 11.5 Announce form validation errors to screen readers
- [ ] 11.6 Announce loading states to screen readers
- [ ] 11.7 Announce success/error notifications to screen readers

## 12. Edge Cases

- [ ] 12.1 Handle missing `agents/` directory (create if needed)
- [ ] 12.2 Handle very long prompts (40,000+ characters)
- [ ] 12.3 Handle special characters in prompt (UTF-8 encoding)
- [ ] 12.4 Handle emoji and Unicode in prompt
- [ ] 12.5 Handle markdown code blocks in prompt
- [ ] 12.6 Handle rapid button clicks (prevent duplicate submissions)

## 13. Git Operations

- [ ] 13.1 Integrate with existing Git service
- [ ] 13.2 Format commit message: "Add {name} agent"
- [ ] 13.3 Commit to main branch (MVP scope)
- [ ] 13.4 Ensure proper file permissions (644)
- [ ] 13.5 Handle Git authentication if needed

## 14. Testing

- [ ] 14.1 Unit tests for agent name validation
- [ ] 14.2 Unit tests for template generation
- [ ] 14.3 Unit tests for CreateAgentModal component
- [ ] 14.4 Integration tests for agent creation flow
- [ ] 14.5 Integration tests for error handling
- [ ] 14.6 Test duplicate name detection
- [ ] 14.7 Test Git commit success/failure
- [ ] 14.8 Test agents list reload
- [ ] 14.9 Manual testing across browsers
- [ ] 14.10 Accessibility testing with screen reader

## 15. Documentation

- [ ] 15.1 Update user docs with "Creating Agents" section
- [ ] 15.2 Document agent template structure
- [ ] 15.3 Document agent naming conventions
- [ ] 15.4 Add screenshots to docs
- [ ] 15.5 Document error messages and resolutions
- [ ] 15.6 Update API documentation with new endpoints

## 16. Polish

- [ ] 16.1 Add smooth modal open/close animations
- [ ] 16.2 Add loading spinner during agent creation
- [ ] 16.3 Add success checkmark animation
- [ ] 16.4 Polish toast notification styling
- [ ] 16.5 Ensure responsive design on mobile
- [ ] 16.6 Add tooltips for form fields
- [ ] 16.7 Polish error message styling
