# Engineer Notepad -- run-001

## What I'm doing
Scaffolding the project and setting up the database layer.

## Working state
- [x] create-next-app with App Router, TypeScript, Tailwind
- [x] Install Drizzle ORM + libsql client
- [x] Create schema for tasks table
- [x] Create schema for users table
- [ ] Generate initial migration (next session)
- [ ] Create seed data (next session)

## Notes to self
- Used `@libsql/client` for Turso compatibility later
- Kept schema simple per ARCHITECTURE.md -- no over-indexing yet
- Need to ask PM about priority field -- should it be an enum or freeform?
