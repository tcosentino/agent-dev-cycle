---
id: st-c-001
timestamp: 2026-01-11T15:00:00Z
recordedBy: engineer
tags: [database, schema]
relatedTasks: [ST-1, ST-2]
---
## Database schema established

Tables created:
- `brands` - Brand registry (Nike, Adidas, etc.)
- `products` - Model-level info (Air Force 1, Ultraboost)
- `variants` - Size/color combinations per product
- `locations` - Store and warehouse locations
- `inventory` - Current stock levels (variant + location)
- `stock_movements` - Immutable ledger of all stock changes

Indexes on: variants(sku), inventory(variant_id, location_id),
stock_movements(created_at).

---

---
id: st-c-002
timestamp: 2026-01-13T10:00:00Z
recordedBy: engineer
tags: [api, barcode]
relatedTasks: [ST-3]
---
## Barcode scanning uses keyboard wedge pattern

Scanner acts as keyboard input. Frontend listens for rapid keystrokes
followed by Enter. No special hardware API needed. Debounce timeout
of 50ms differentiates scanner from human typing.
