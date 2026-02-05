---
id: st-b-001
timestamp: 2026-01-12T09:00:00Z
recordedBy: engineer
tags: [database, concurrency]
relatedTasks: [ST-2]
---
## Resolved: Race condition in concurrent stock adjustments

Two store staff adjusting the same SKU simultaneously caused incorrect totals.
Fixed by adding row-level locking with SELECT FOR UPDATE in the stock
adjustment transaction. Added retry logic with exponential backoff for
deadlock scenarios.
