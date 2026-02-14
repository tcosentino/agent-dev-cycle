# Project Settings - Proposal

## Why

AgentForge projects currently have no settings interface. Users cannot:
- **Rename projects** (names are fixed after creation)
- **Delete projects** from AgentForge (can only delete entire workspace)
- **Configure runtime adapters** (stuck with defaults)
- **Manage authentication** (Claude API keys)
- **Control collaboration** (future: team access, permissions)
- **View project metadata** (creation date, owner, size)
- **Modify advanced options** (execution limits, resource quotas)

This lack of configurability creates friction and limits AgentForge's usefulness in production environments.

**We need a comprehensive Project Settings page** inspired by GitHub's settings - multiple tabs, clear organization, detailed explanations, and safe destructive actions.

## What Changes

Add a **Project Settings page** accessible from ProjectViewer that provides:

### Multi-Tab Interface (GitHub-style)

**1. General Tab**
- Project name (editable)
- Project description (editable)
- Project key (read-only, auto-generated)
- Created date
- Owner
- Repository URL
- Default branch

**2. Runtime Tab**
- Runtime adapter selection (local, Docker, cloud)
- Execution timeout limits
- Resource quotas (CPU, memory)
- Environment variables
- Custom runtime configuration

**3. Authentication Tab**
- Claude API key management
- GitHub token configuration
- Other service credentials
- Key rotation and expiry

**4. Collaboration Tab** (Future)
- Team members
- Access permissions
- Invite collaborators
- Role management (admin, editor, viewer)

**5. Advanced Tab**
- Debug mode toggle
- Verbose logging
- Experimental features flags
- Performance tuning options

**6. Danger Zone**
- Delete project (from AgentForge only, preserves repo)
- Clear all project data
- Reset to defaults

### User Flow

**Accessing Settings:**
1. User opens project in ProjectViewer
2. User clicks gear icon or "Settings" in project menu
3. Settings page opens with "General" tab selected
4. User navigates between tabs using sidebar or tab bar

**Renaming Project:**
1. User goes to General tab
2. User clicks "Edit" next to project name
3. Name field becomes editable
4. User changes name from "MyApp" to "SuperApp"
5. User clicks "Save Changes"
6. System validates new name (no duplicates)
7. System updates project metadata
8. Success message appears
9. Project name updates throughout UI

**Deleting Project:**
1. User scrolls to Danger Zone at bottom of page
2. User clicks "Delete Project"
3. Warning modal appears: "Are you sure? This will remove the project from AgentForge but preserve the Git repository."
4. User must type project name to confirm
5. User clicks "Delete Project" in modal
6. Project is removed from AgentForge
7. User is redirected to projects list
8. Repository remains intact on disk/GitHub

**Configuring Runtime:**
1. User goes to Runtime tab
2. Sees current adapter: "Docker (default)"
3. User clicks dropdown, selects "Cloud (AWS Lambda)"
4. Form appears with cloud-specific settings
5. User enters AWS credentials, region, function name
6. User clicks "Save Runtime Configuration"
7. System validates credentials
8. Runtime adapter updates
9. All future agent runs use cloud runtime

## Capabilities

### New Capabilities
- `project-settings-ui`: Multi-tab settings page
- `project-rename`: Update project metadata
- `project-delete`: Remove project from AgentForge
- `runtime-configuration`: Configure execution adapters
- `credential-management`: Store and manage API keys

### Modified Capabilities
- `project-viewer`: Add "Settings" button/menu item
- `project-list`: Handle deleted projects (remove from list)
- `agent-execution`: Use configured runtime adapter

## Impact

**UI Changes:**
- New `/project/:projectId/settings` route
- Settings page with multi-tab layout
- Forms for each settings category
- Confirmation modals for destructive actions

**API Changes:**
- `PATCH /api/projects/:projectId` - Update project metadata (name, description)
- `DELETE /api/projects/:projectId` - Delete project from AgentForge
- `PUT /api/projects/:projectId/runtime` - Update runtime configuration
- `POST /api/projects/:projectId/credentials` - Store encrypted credentials
- `GET /api/projects/:projectId/credentials` - List configured credentials (masked)
- `DELETE /api/projects/:projectId/credentials/:key` - Remove credential

**Backend Changes:**
- Project metadata storage (name, description, created, owner)
- Project deletion logic (remove from database, preserve repo)
- Runtime adapter configuration storage
- Credential encryption and secure storage
- Validation for all settings updates

**Security Considerations:**
- Credentials encrypted at rest
- RBAC for settings access (future: only admins can delete)
- Audit log for settings changes
- Confirmation required for destructive actions

**No Breaking Changes:**
- All changes are additive
- Existing projects continue to work with defaults
- Settings are optional enhancements

## Risks & Mitigations

**[Risk]** User accidentally deletes project
→ **Mitigation:**
- Require typing project name to confirm
- Show clear warning about what will be deleted
- Offer "Archive" option instead of delete (future)
- Repository remains intact (can re-import)

**[Risk]** Incorrect runtime configuration breaks agent execution
→ **Mitigation:**
- Validate configuration before saving
- Test connection/credentials on save
- Provide "Test Configuration" button
- Show clear error messages
- Offer "Reset to Defaults" option

**[Risk]** Credentials stored insecurely
→ **Mitigation:**
- Encrypt all credentials at rest
- Use OS keychain/credential manager
- Never log or display full credentials
- Rotate keys regularly
- Support credential expiry

**[Risk]** Settings UI becomes overwhelming with too many options
→ **Mitigation:**
- Organize into logical tabs
- Progressive disclosure (hide advanced options by default)
- Provide detailed explanations for each setting
- Use sane defaults that work for most users
- "Reset to Defaults" for each section

**[Risk]** Renaming project breaks existing references
→ **Mitigation:**
- Project ID remains stable (only display name changes)
- Update all UI references atomically
- Validate uniqueness before saving
- Show warning if project is referenced elsewhere

## MVP Scope

For initial implementation:
1. **General Tab** - Rename project, view metadata, delete project
2. **Danger Zone** - Delete project with confirmation
3. **Settings page route** and navigation
4. **Form validation** and error handling

**Defer to future:**
- Runtime configuration tab (use defaults for now)
- Authentication tab (manual credential management)
- Collaboration tab (single-user for MVP)
- Advanced options tab
- Audit log for settings changes
- Project archiving (soft delete)

## Success Criteria

**A user can:**
1. Access project settings in < 3 clicks
2. Rename a project without errors
3. Delete a project safely (with confirmation)
4. Understand what each setting does (clear explanations)
5. Recover from mistakes (undo, defaults)

**Metrics to track:**
- Settings page access rate
- Most frequently changed settings
- Time to complete settings tasks
- Error rate for settings saves
- Project deletion rate (too high = UX issue)

## Design Principles

**Inspired by GitHub Settings:**
- **Clear organization** - Logical tabs for different concerns
- **Detailed explanations** - Help text for every option
- **Safe destructive actions** - Confirmation modals, type-to-confirm
- **Visual hierarchy** - Important options prominent, advanced options collapsed
- **Consistent patterns** - Edit/Save flow, form validation, error messages
- **Accessibility** - Keyboard navigation, screen reader support

**Form Design:**
- Labels above fields (not beside)
- Help text below fields
- Inline validation (don't wait for submit)
- Clear error messages with recovery steps
- "Save Changes" button only enabled if form is dirty

**Danger Zone:**
- Separate section at bottom of page
- Red styling to signal danger
- Multiple confirmation steps
- Clear consequences explained
- Irreversible actions require typing project name

## Future Enhancements

**Runtime Adapters:**
- Local execution (default)
- Docker container execution
- Cloud execution (AWS Lambda, Google Cloud Functions)
- SSH remote execution
- Kubernetes pods

**Collaboration:**
- Invite team members by email
- Role-based permissions (admin, editor, viewer)
- Share projects with organization
- Activity log (who changed what when)

**Advanced Options:**
- Execution timeout customization
- Resource limits (CPU, memory, disk)
- Concurrent agent execution limit
- Log retention policy
- Custom agent discovery paths

**Authentication:**
- API key management with rotation
- OAuth integration (GitHub, Google)
- SSO for enterprise (SAML)
- Credential expiry and renewal
- Audit trail for credential access

**Project Templates:**
- Save project configuration as template
- Apply template to new projects
- Share templates with team
- Template marketplace

**Import/Export:**
- Export project configuration
- Import configuration to new project
- Backup settings
- Migrate between AgentForge instances

**Webhooks:**
- Notify external systems on project events
- Trigger on agent completion, errors
- Custom webhook endpoints
- Retry logic and logging
