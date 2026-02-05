# SoleTrack - Architecture

## Stack
- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL via Drizzle ORM
- **Styling**: Tailwind CSS + shadcn/ui
- **Deployment**: Railway

## Data Model
- **brands**: id, name, code (e.g., 'NK' for Nike)
- **products**: id, brand_id, model, base_sku
- **variants**: id, product_id, size, color, sku (e.g., NK-AF1-10-WHT)
- **locations**: id, name, type (store/warehouse)
- **inventory**: id, variant_id, location_id, quantity
- **stock_movements**: id, variant_id, from_location_id, to_location_id, quantity, type (receiving/sale/transfer/adjustment/return), created_by, created_at

## SKU Format
`BRAND-MODEL-SIZE-COLOR` -- e.g., NK-AF1-10-WHT, AD-UB22-9H-BLK. Half sizes use H suffix.

## Key Patterns
- Stock movements are an immutable ledger (append-only, never updated/deleted)
- Inventory table is the computed current state, updated transactionally with each movement
- Row-level locking (SELECT FOR UPDATE) on inventory rows during mutations
- Barcode scanning via keyboard wedge pattern (50ms debounce to detect scanner vs human)

## Routes
- `/inventory` -- Stock levels by location with search/filter
- `/scan` -- Barcode scanning interface for receiving and adjustments
- `/transfers` -- Create and track stock transfers between locations
- `/alerts` -- Low-stock alert configuration and history
- `/reports` -- Sales velocity and stock turnover dashboards

## Wiki Reference
See `memory/decisions.md` for rationale on SKU encoding, locking strategy, and alert delivery.
See `memory/codebase.md` for full schema details and barcode implementation notes.
