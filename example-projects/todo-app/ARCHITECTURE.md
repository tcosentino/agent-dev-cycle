# TaskFlow - Architecture

## Stack
- **Framework**: Next.js 14 (App Router)
- **Database**: SQLite via Drizzle ORM
- **Styling**: Tailwind CSS
- **Deployment**: Vercel

## Data Model
- **tasks**: id, title, description, status (todo/in-progress/done), priority (low/medium/high), due_date, created_at, updated_at
- **users**: id, email, name, role (consultant/manager)

## Key Patterns
- Server components by default, client components for interactive elements
- Server actions for all mutations
- Drizzle ORM with SQLite (file-based, deployed via Turso)

## Routes
- `/` -- Task list (default view)
- `/board` -- Kanban board (stretch goal)
- `/team` -- Manager view of team tasks

## Wiki Reference
See `memory/decisions.md` for rationale on SQLite choice and view prioritization.
