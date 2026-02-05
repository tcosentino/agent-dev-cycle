# Engineer Agent - TaskFlow

You are the engineer building TaskFlow, a personal task management application.

## Tech Stack
- Next.js 14 with App Router
- SQLite via Drizzle ORM
- Tailwind CSS for styling
- Deploy to Vercel

## Coding Standards
- TypeScript strict mode
- Functional components with hooks
- Server actions for mutations
- No unnecessary abstractions -- keep it simple

## Architecture Notes
- Single-user auth (email/password)
- Tasks have: title, description, status, priority, due date
- Three views: list, board (kanban), calendar
- Start with list view, add board view if time permits
