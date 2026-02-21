# Project Settings - Design

## Context

AgentForge projects need comprehensive configuration options as they mature from prototypes to production systems. Users need to manage project metadata, runtime adapters, authentication, and potentially delete projects safely.

## Goals / Non-Goals

**Goals:**
- Centralized settings page for all project configuration
- Safe destructive actions (delete with confirmation)
- Clear, well-explained options
- GitHub-style multi-tab interface
- MVP focused on essential settings (rename, delete)

**Non-Goals (MVP):**
- Runtime adapter configuration (defer to v2)
- Team collaboration features (single-user MVP)
- Advanced performance tuning
- Audit log (defer to v2)

## Decisions

### Decision 1: Dedicated page vs modal
**Choice:** Dedicated `/project/:projectId/settings` page

**Rationale:**
- More space for complex forms and explanations
- Familiar pattern (GitHub, GitLab, Linear)
- Can add multiple tabs without cramping
- Better for accessibility and keyboard navigation
- Can bookmark settings URL

**Alternative considered:** Settings modal
- Faster access (no navigation)
- Limited space for multi-tab interface
- Harder to link directly to specific settings

### Decision 2: Multi-tab vs single long page
**Choice:** Multi-tab interface

**Rationale:**
- Logical grouping of related settings
- Reduces cognitive load (focus on one category at a time)
- Easier to navigate and find specific settings
- Follows GitHub/GitLab conventions
- Scalable (can add tabs for new features)

**Alternative considered:** Single scrollable page with sections
- Simpler implementation
- All settings visible at once
- Becomes unwieldy with many options
- Harder to navigate

### Decision 3: Inline editing vs edit mode
**Choice:** Edit mode with "Save Changes" button

**Rationale:**
- Clear indication of unsaved changes
- Batch updates (change multiple fields, save once)
- Easier to implement undo/cancel
- Prevents accidental changes
- Consistent with form best practices

**Alternative considered:** Inline editing (edit in place)
- Faster for single-field updates
- More complex state management
- Harder to batch changes
- Auto-save can be confusing

### Decision 4: Delete behavior
**Choice:** Delete from AgentForge only, preserve Git repository

**Rationale:**
- Safe by default (user can re-import project)
- Repository is source of truth
- Prevents data loss
- Matches user mental model (project is just metadata)

**Alternative considered:** Offer to delete repository too
- Complete cleanup option
- Dangerous (irreversible)
- Requires careful UX to prevent accidents
- Can add as advanced option later

### Decision 5: Confirmation pattern for destructive actions
**Choice:** Type-to-confirm (must type project name)

**Rationale:**
- Strong confirmation (prevents accidental clicks)
- Familiar pattern (GitHub, Heroku)
- Forces user to read warning message
- Low friction for intentional actions

**Alternative considered:** Simple confirmation dialog
- Easier to click through without reading
- Less protection against accidents

## Architecture

### Components

**UI Layer:**
```
ProjectViewer
  └─ Settings button/menu item
       └─ Navigate to SettingsPage

SettingsPage (/project/:projectId/settings)
  ├─ SettingsSidebar
  │    ├─ Tab: General (default)
  │    ├─ Tab: Runtime
  │    ├─ Tab: Authentication
  │    ├─ Tab: Collaboration
  │    ├─ Tab: Advanced
  │    └─ Tab: Danger Zone
  └─ SettingsContent
       └─ [Active Tab Component]
            ├─ GeneralSettings
            ├─ RuntimeSettings
            ├─ AuthSettings
            ├─ CollaborationSettings
            ├─ AdvancedSettings
            └─ DangerZone
```

**API Layer:**
```
PATCH /api/projects/:projectId
  └─ updateProject({ name, description, ... })
       ├─ Validate updates
       ├─ Check for conflicts (duplicate names)
       ├─ Update database
       └─ Return updated project

DELETE /api/projects/:projectId
  └─ deleteProject()
       ├─ Verify confirmation
       ├─ Remove from database
       ├─ Preserve repository on disk
       └─ Return success

PUT /api/projects/:projectId/runtime
  └─ updateRuntimeConfig({ adapter, config })
       ├─ Validate adapter type
       ├─ Test configuration
       ├─ Store config
       └─ Return updated runtime

POST /api/projects/:projectId/credentials
  └─ addCredential({ key, value, type })
       ├─ Encrypt value
       ├─ Store securely
       └─ Return masked credential

GET /api/projects/:projectId/credentials
  └─ listCredentials()
       ├─ Fetch from secure storage
       ├─ Mask sensitive values
       └─ Return credential list

DELETE /api/projects/:projectId/credentials/:key
  └─ removeCredential(key)
       └─ Delete from storage
```

### Data Flow

**Accessing Settings:**
1. User clicks "Settings" in ProjectViewer
2. Navigate to `/project/:projectId/settings`
3. Settings page loads with General tab active
4. Fetch current project metadata
5. Populate form fields

**Updating Settings:**
1. User edits fields (name, description)
2. Form becomes "dirty" (has unsaved changes)
3. "Save Changes" button enables
4. User clicks "Save Changes"
5. Frontend validates form
6. POST/PATCH to API endpoint
7. Backend validates and updates database
8. Success: Show notification, mark form clean, update UI
9. Error: Show inline error messages, keep form dirty

**Deleting Project:**
1. User scrolls to Danger Zone
2. User clicks "Delete Project"
3. Modal opens with warning
4. User must type project name to confirm
5. User clicks "Delete Project" in modal
6. Frontend validates typed name matches
7. DELETE request to API
8. Backend removes project from database
9. Success: Redirect to projects list
10. Repository remains on disk

## Tab-Specific Design

### General Tab (MVP)

**Fields:**
- **Project Name** (editable)
  - Text input
  - Validation: Required, 1-100 chars, unique
  - Help text: "Display name for this project"
  
- **Description** (editable)
  - Textarea
  - Validation: Optional, max 500 chars
  - Help text: "Brief description of what this project does"
  
- **Project Key** (read-only)
  - Display only
  - Help text: "Auto-generated identifier (cannot be changed)"
  
- **Repository URL** (read-only)
  - Display as clickable link
  - Help text: "Git repository location"
  
- **Created** (read-only)
  - Display formatted date
  
- **Owner** (read-only)
  - Display username/email

**Layout:**
```
┌─────────────────────────────────────────┐
│ General Settings                        │
├─────────────────────────────────────────┤
│                                         │
│ Project Name                            │
│ ┌─────────────────────────────────┐   │
│ │ MyProject                       │   │
│ └─────────────────────────────────┘   │
│ Display name for this project          │
│                                         │
│ Description                             │
│ ┌─────────────────────────────────┐   │
│ │                                 │   │
│ │                                 │   │
│ └─────────────────────────────────┘   │
│ Brief description of what this does    │
│                                         │
│ Project Key (Read-only)                │
│ MY-PROJECT                              │
│ Auto-generated identifier              │
│                                         │
│ Repository                              │
│ https://github.com/user/my-project     │
│                                         │
│ ┌──────────────┐                       │
│ │ Save Changes │                       │
│ └──────────────┘                       │
└─────────────────────────────────────────┘
```

### Runtime Tab (Future)

**Sections:**
- **Runtime Adapter**
  - Dropdown: Local, Docker, AWS Lambda, GCP Functions, Kubernetes
  - Adapter-specific configuration form appears below
  
- **Execution Limits**
  - Timeout (seconds)
  - Max concurrent agents
  - Memory limit
  
- **Environment Variables**
  - Key-value pairs
  - Add/remove rows
  - Mark as secret (masked display)

### Authentication Tab (Future)

**Sections:**
- **API Keys**
  - List of configured keys
  - Add new key button
  - Show/hide/rotate/delete actions
  
- **OAuth Connections**
  - GitHub, Google, etc.
  - Connect/disconnect buttons
  - Scope information

### Collaboration Tab (Future)

**Sections:**
- **Team Members**
  - List of users with access
  - Invite by email
  - Role dropdown (Admin, Editor, Viewer)
  - Remove access button
  
- **Permissions**
  - Fine-grained access control
  - Can edit agents, can run agents, can delete, etc.

### Advanced Tab (Future)

**Sections:**
- **Debug Mode**
  - Toggle switch
  - Enables verbose logging
  
- **Experimental Features**
  - Feature flags
  - Warning about stability
  
- **Performance**
  - Agent discovery paths
  - Cache settings
  - Log retention

### Danger Zone (MVP)

**Actions:**
- **Delete Project**
  - Red button
  - Warning: "This will remove the project from AgentForge but preserve the Git repository"
  - Confirmation: Must type project name
  - Irreversible warning

**Layout:**
```
┌─────────────────────────────────────────┐
│ ⚠️  Danger Zone                         │
├─────────────────────────────────────────┤
│                                         │
│ Delete this project                     │
│                                         │
│ Once you delete a project, there is no │
│ going back. The project will be removed│
│ from AgentForge, but the Git repository│
│ will be preserved on disk.             │
│                                         │
│ ┌──────────────────┐                   │
│ │ Delete Project   │                   │
│ └──────────────────┘                   │
└─────────────────────────────────────────┘
```

**Delete Confirmation Modal:**
```
┌─────────────────────────────────────────┐
│ Are you absolutely sure?                │
├─────────────────────────────────────────┤
│                                         │
│ This action cannot be undone. This will│
│ permanently delete the "MyProject"     │
│ project from AgentForge.               │
│                                         │
│ The Git repository at                  │
│ ~/repos/my-project will be preserved.  │
│                                         │
│ Please type "MyProject" to confirm.    │
│ ┌─────────────────────────────────┐   │
│ │                                 │   │
│ └─────────────────────────────────┘   │
│                                         │
│ ┌────────┐  ┌──────────────────┐      │
│ │ Cancel │  │ Delete Project   │      │
│ └────────┘  └──────────────────┘      │
└─────────────────────────────────────────┘
```

## API Design

### Update Project Metadata

**Request:**
```http
PATCH /api/projects/:projectId
Content-Type: application/json

{
  "name": "SuperApp",
  "description": "An amazing application built with AgentForge"
}
```

**Response (Success):**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "project": {
    "id": "proj_abc123",
    "name": "SuperApp",
    "description": "An amazing application built with AgentForge",
    "key": "SUPER-APP",
    "repositoryUrl": "https://github.com/user/super-app",
    "createdAt": "2026-01-15T10:00:00Z",
    "updatedAt": "2026-02-13T18:00:00Z",
    "owner": "user@example.com"
  }
}
```

**Response (Error - Duplicate Name):**
```http
HTTP/1.1 409 Conflict
Content-Type: application/json

{
  "error": "Project with name 'SuperApp' already exists",
  "code": "DUPLICATE_PROJECT_NAME"
}
```

### Delete Project

**Request:**
```http
DELETE /api/projects/:projectId
Content-Type: application/json

{
  "confirmation": "MyProject"
}
```

**Response (Success):**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "deleted": true,
  "message": "Project 'MyProject' deleted from AgentForge",
  "repositoryPreserved": true,
  "repositoryPath": "/Users/user/repos/my-project"
}
```

**Response (Error - Invalid Confirmation):**
```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "error": "Confirmation does not match project name",
  "code": "INVALID_CONFIRMATION"
}
```

## Implementation Notes

**Form State Management:**
- Track dirty state (form has unsaved changes)
- Disable "Save Changes" button when form is pristine
- Show warning when navigating away with unsaved changes
- Reset form on successful save or cancel

**Validation:**
- Client-side validation for immediate feedback
- Server-side validation for security
- Show inline errors below each field
- Prevent submission if validation fails

**Security:**
- CSRF protection for all mutations
- Authentication required for all settings endpoints
- Authorization check (user must own project)
- Rate limiting on destructive actions
- Audit log for sensitive changes (future)

**Error Handling:**
- Network errors: Show retry button
- Validation errors: Show inline with field
- Conflict errors: Suggest alternatives (e.g., "SuperApp-2")
- Generic errors: Show error message with support link

**Performance:**
- Load settings page quickly (< 500ms)
- Debounce validation (don't validate on every keystroke)
- Optimistic updates for fast perceived performance
- Cache current project metadata

## Accessibility

**Keyboard Navigation:**
- Tab through all form fields
- Enter submits form
- Escape cancels edit mode or closes modal
- Arrow keys navigate tabs

**Screen Reader Support:**
- All fields have labels
- Required fields indicated
- Error messages announced
- Loading states announced
- Success/failure announced

**Visual:**
- High contrast for text
- Focus indicators on all interactive elements
- Error states clearly visible
- Consistent color coding (red for danger)

## Future Enhancements

**Project Archiving:**
- Soft delete (archive instead of hard delete)
- Restore archived projects
- Auto-archive after inactivity

**Settings Templates:**
- Save configuration as template
- Apply template to new projects
- Share templates with team

**Settings Import/Export:**
- Export project configuration as JSON
- Import configuration from file
- Migrate settings between instances

**Audit Log:**
- Track all settings changes
- Who changed what when
- Revert changes from audit log

**Advanced Permissions:**
- Who can access settings
- Who can delete projects
- Role-based access control
