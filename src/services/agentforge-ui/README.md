# AgentForge UI

The main web interface for AgentForge. A project viewer with file browser, database explorer, and service management.

## Features

- **File Browser** - Navigate project files with syntax highlighting
- **Database Explorer** - Browse tasks, channels, messages, and other data
- **Service Viewer** - View data object schemas, endpoints, and documentation
- **Multi-pane Editor** - Split view with drag-and-drop tabs

## Structure

```
agentforge-ui/
├── index.tsx              # Main entry point
├── ProjectViewer.tsx      # Core component
├── ProjectViewer.module.css
├── types.ts               # TypeScript types
├── components/
│   ├── shared/            # Reusable UI components (icons, etc.)
│   ├── FileTree.tsx       # File tree sidebar
│   ├── ContentPreview.tsx # File content display
│   ├── DatabaseViews.tsx  # Table and board views
│   ├── RecordViews.tsx    # Record detail views
│   ├── DeploymentViews.tsx # Deployment and workload views
│   └── ServicePanel.tsx   # Service detail panel
└── service.json           # Service definition
```

## Development

```bash
yarn dev
# Open http://localhost:5173/project-viewer.html
```
