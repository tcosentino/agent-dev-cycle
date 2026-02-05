---
id: st-d-001
timestamp: 2026-01-10T09:30:00Z
recordedBy: lead
tags: [architecture, sku]
relatedTasks: [ST-1]
---
## SKU encoding scheme: BRAND-MODEL-SIZE-COLOR

Standardized SKU format for all products. Examples:
- NK-AF1-10-WHT (Nike Air Force 1, Size 10, White)
- AD-UB22-9H-BLK (Adidas Ultraboost 22, Size 9.5, Black)
Half sizes use H suffix. This enables barcode generation and scanning.

---

---
id: st-d-002
timestamp: 2026-01-11T11:00:00Z
recordedBy: lead
tags: [architecture, database]
relatedTasks: [ST-2]
---
## PostgreSQL with row-level locking for inventory transactions

Stock movements must be atomic to prevent overselling. Using PostgreSQL
transactions with SELECT FOR UPDATE on inventory rows. Each movement
creates an immutable ledger entry in stock_movements table.

---

---
id: st-d-003
timestamp: 2026-01-12T14:00:00Z
recordedBy: pm
tags: [scope, alerts]
relatedTasks: [ST-5]
---
## Email alerts for low stock, not push notifications

MVP uses email for low-stock alerts. Reasoning: (1) store managers already
check email for supplier communications, (2) no mobile app needed, (3) can
batch into daily digest to avoid alert fatigue.
