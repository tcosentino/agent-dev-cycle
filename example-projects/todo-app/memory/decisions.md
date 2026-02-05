---
id: tf-d-001
timestamp: 2026-01-20T09:00:00Z
recordedBy: lead
tags: [architecture, database]
relatedTasks: [TF-1]
---
## SQLite over PostgreSQL for simplicity

Chose SQLite because: (1) starter tier project, (2) single-user app does not need
connection pooling, (3) deploys as a single file with Turso/Litestream for persistence.

---

---
id: tf-d-002
timestamp: 2026-01-20T10:00:00Z
recordedBy: pm
tags: [scope, mvp]
relatedTasks: [TF-2, TF-3]
---
## List view first, board view stretch goal

Customer wants kanban board but list view delivers core value faster.
Ship list view in sprint 1, board view in sprint 2 if time allows.
