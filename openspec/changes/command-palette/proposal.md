## Why

Users need fast, keyboard-driven navigation to access files, database tables, and pages within the AgentForge UI. Currently, all navigation requires multiple mouse clicks through nested hierarchies, slowing down power users and hindering discoverability of available resources.

## What Changes

- Add global command palette accessible via Cmd+K (Ctrl+K on Windows/Linux)
- Implement fuzzy search across all navigable items (project files, database tables, agent pages, sessions)
- Support keyboard navigation (arrow keys, Enter to select, Escape to close)
- Auto-focus search input when palette opens
- Close palette on item selection or outside click

## Capabilities

### New Capabilities
- `command-palette`: Global search and navigation interface with fuzzy matching
- `keyboard-shortcuts`: Hotkey registration and handling system for UI-wide shortcuts

### Modified Capabilities
<!-- No existing capabilities being modified -->

## Impact

- AgentForge UI (`src/services/agentforge-ui/ProjectViewer.tsx`) - add command palette component and keyboard handler
- UI Components package (`@agentforge/ui-components`) - may add reusable CommandPalette component if not already available
- No breaking changes - purely additive feature