# UI System Documentation

This document describes the UI patterns, components, and conventions used in the AgentForge project viewer and related interfaces.

## Design Tokens

All colors, spacing, and typography are defined as CSS custom properties in `src/style.css`:

### Colors

```css
/* Backgrounds */
--bg-primary: #0a0a0f      /* Main background */
--bg-secondary: #12121a    /* Cards, panels */
--bg-tertiary: #1a1a24     /* Hover states, nested elements */

/* Text */
--text-primary: #f0f0f5    /* Headings, emphasis */
--text-secondary: #8888a0  /* Body text */
--text-muted: #555566      /* Labels, hints */

/* Accents */
--accent-primary: #f97316  /* Warm amber - primary CTA */
--accent-secondary: #ef4444 /* Coral red */
--accent-tertiary: #0ea5e9 /* Sky blue - links, selection */
--accent-green: #10b981    /* Success, done states */
--accent-orange: #f59e0b   /* Warnings, medium priority */

/* Semantic colors for roles/agents */
--pm-color: #ef4444
--engineer-color: #0ea5e9
--qa-color: #10b981
--lead-color: #f97316
```

### Spacing (defined in component CSS modules)

```css
--space-xs: 4px
--space-sm: 8px
--space-md: 16px
--space-lg: 24px
--space-xl: 32px
```

### Border Radius

```css
--radius-xs: 2px
--radius-sm: 4px
--radius-md: 8px
--radius-lg: 12px
```

---

## Component Architecture

### Directory Structure

```
src/components/
  shared/           # Reusable primitives
    icons.tsx       # SVG icon components
    badges/         # Status and type badges
    TabbedPane.tsx  # Tab container with drag-drop
    ListPanel/      # List with selection
    Badge/          # Generic badge component
    Spinner/        # Loading indicator
    StatusIndicator/

  project-viewer/   # File/database explorer
  task-board/       # Kanban-style task board
  chat/             # Chat interface
  knowledge-base/   # Document viewer
```

### Component Conventions

1. **CSS Modules**: Each component uses `.module.css` for scoped styles
2. **TypeScript interfaces**: Props defined with explicit interfaces
3. **Functional components**: All components are React functional components
4. **Icon components**: SVG icons in `shared/icons.tsx` accept standard SVG props

---

## Project Viewer System

The Project Viewer (`src/components/project-viewer/ProjectViewer.tsx`) is a VS Code-like interface for browsing project files and database records.

### Tab Types

```typescript
type TabType = 'file' | 'table' | 'record'
```

| Type | Description | Content |
|------|-------------|---------|
| `file` | Source file | Rendered with ContentPreview (markdown, JSON, YAML, etc.) |
| `table` | Database table | Data grid with all rows, optional rich view |
| `record` | Single record | Detail view of one database row |

### Pane System

The viewer supports split panes:

```typescript
type PaneId = 'left' | 'right'

interface OpenTab {
  id: string
  type: TabType
  path: string
  label: string
  icon?: ReactNode
  pane: PaneId
  // For record tabs
  record?: Record<string, unknown>
  tableName?: DbTableName
}
```

**Key behaviors:**
- Files and tables open in the active pane
- Records always open in the right pane (detail view pattern)
- If right pane doesn't exist, it's created automatically
- Tabs can be dragged between panes
- Drag to empty right edge creates a new pane

### View Modes

Tables with rich views support toggling between modes:

```typescript
type ViewMode = 'table' | 'view'

// Tables that support rich view
const TABLES_WITH_VIEW: DbTableName[] = ['tasks']
```

The `tasks` table can display as:
- **Table mode**: Standard data grid
- **View mode**: TaskBoard kanban component

### Opening Content

```typescript
// Open a file in the active pane
openFile(path: string)

// Open a database table in the active pane
openTable(tableName: DbTableName)

// Open a record in the right pane (creates pane if needed)
openRecord(tableName: DbTableName, record: Record<string, unknown>, key: string)
```

### Content Previews

Files are rendered based on extension:

| Extension | Component | Description |
|-----------|-----------|-------------|
| `.md` | MarkdownPreview | Rendered markdown with syntax highlighting |
| `.yaml`, `.yml` | YamlPreview | Syntax-highlighted YAML |
| `.json` | JsonPreview | Formatted and highlighted JSON |
| `.jsonl` | JsonlTimeline | Timeline view for session transcripts |
| Other | RawTextPreview | Plain preformatted text |

---

## TabbedPane Component

Reusable tabbed container with drag-drop support.

```typescript
interface TabbedPaneProps {
  tabs: Tab[]
  activeTabId: string | null
  onTabSelect: (id: string) => void
  onTabClose: (id: string) => void
  children: ReactNode
  emptyState?: ReactNode
  onSplitRight?: (tabId: string) => void
  paneId?: string
  onTabDrop?: (tabId: string, targetIndex: number) => void
  onTabDropFromOtherPane?: (tabId: string, sourcePane: string, targetIndex: number) => void
  onDragStart?: () => void
  onDragEnd?: () => void
}
```

**Features:**
- Draggable tabs for reordering
- Cross-pane tab movement
- Split-to-right button on each tab
- Close button (optional per tab)
- Empty state when no tabs

---

## TaskBoard Component

Kanban-style task board with columns for status.

```typescript
interface TaskBoardProps {
  projectName: string
  projectKey: string
  phase: string
  tasks: Task[]
  animate?: boolean
  minHeight?: string | number
  selectedTaskKey?: string | null
  onTaskClick?: (taskKey: string) => void
}
```

### Task Structure

```typescript
interface Task {
  key: string           // e.g., "TASK-001"
  title: string
  type: TaskType        // 'backend' | 'frontend' | 'api' | 'database' | 'testing'
  priority: TaskPriority // 'low' | 'medium' | 'high' | 'critical'
  status: TaskStatus    // 'todo' | 'in-progress' | 'done'
  assignee?: AgentRole  // 'pm' | 'engineer' | 'qa' | 'lead'
}
```

### Click Handling

Task cards support click events:
- Cards are clickable with hover/selected states
- `onTaskClick` callback receives the task key
- In Project Viewer, clicking opens the record in right pane

---

## Badge Components

Located in `src/components/shared/badges/`:

| Badge | Props | Usage |
|-------|-------|-------|
| `PriorityBadge` | `priority: TaskPriority` | low/medium/high/critical |
| `TypeBadge` | `type: TaskType` | backend/frontend/api/etc |
| `AssigneeBadge` | `role: AgentRole` | pm/engineer/qa/lead |
| `PhaseBadge` | `phase: string` | discovery/shaping/building/delivery |
| `AgentStatusBadge` | `status: AgentStatus` | active/busy/away/offline |

---

## Icon System

All icons are in `src/components/shared/icons.tsx`:

```typescript
interface IconProps extends React.SVGProps<SVGSVGElement> {}

// Usage
<ChevronRightIcon className={styles.icon} />
<DatabaseIcon />
<TableIcon />
<KanbanIcon />
```

Icons are 24x24 viewBox, stroke-based, and inherit color from parent.

---

## Adding New Features

### Adding a new tab type

1. Add to `TabType` union in ProjectViewer.tsx:
   ```typescript
   type TabType = 'file' | 'table' | 'record' | 'newtype'
   ```

2. Extend `OpenTab` interface if needed

3. Add open function:
   ```typescript
   const openNewType = useCallback((data: NewTypeData) => {
     const tabId = `newtype:${data.id}`
     // ... create tab
   }, [])
   ```

4. Add rendering in `renderTabContent`:
   ```typescript
   if (tab.type === 'newtype') {
     return <NewTypeView data={tab.data} />
   }
   ```

### Adding a new table rich view

1. Add table name to `TABLES_WITH_VIEW`:
   ```typescript
   const TABLES_WITH_VIEW: DbTableName[] = ['tasks', 'messages']
   ```

2. Create view component:
   ```typescript
   function MessagesView({ snapshot, onMessageClick }: {...}) {
     // Render messages in a chat-like view
   }
   ```

3. Add case in `DatabaseTableView`:
   ```typescript
   if (viewMode === 'view' && tableName === 'messages') {
     return <MessagesView ... />
   }
   ```

### Adding a new database table

1. Add to `DbSnapshot` interface in `types.ts`:
   ```typescript
   export interface DbSnapshot {
     // ... existing tables
     newTable: Record<string, unknown>[]
   }
   ```

2. Add to `TABLE_NAMES` and `TABLE_LABELS` in ProjectViewer.tsx

3. Load data in `project-viewer.tsx` entry point

---

## CSS Patterns

### Dark theme card

```css
.card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: var(--space-md);
}

.card:hover {
  border-color: var(--accent-tertiary);
}
```

### Selected state

```css
.selected {
  border-color: var(--accent-tertiary);
  box-shadow: 0 0 0 1px var(--accent-tertiary);
}
```

### Toolbar

```css
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-sm) var(--space-md);
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}
```

### Button group (toggle)

```css
.buttonGroup {
  display: flex;
  gap: 2px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  padding: 2px;
}

.button {
  background: transparent;
  border: none;
  border-radius: var(--radius-xs);
  color: var(--text-muted);
  cursor: pointer;
}

.buttonActive {
  background: var(--accent-tertiary);
  color: white;
}
```
