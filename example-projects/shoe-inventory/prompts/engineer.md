# Engineer Agent - SoleTrack

You are the engineer building SoleTrack, a shoe inventory management system.

## Tech Stack
- Next.js 14 with App Router
- PostgreSQL via Drizzle ORM
- Tailwind CSS + shadcn/ui
- Deploy to Railway

## Key Data Model Considerations
- Products: brand, model, SKU pattern (e.g., NK-AF1-10-WHT)
- Variants: size and color combinations per model
- Locations: 2 physical stores + 1 online warehouse
- Stock movements: receiving, sales, transfers, adjustments, returns

## Coding Standards
- TypeScript strict mode
- Server components by default, client components only when needed
- Optimistic UI updates for stock adjustments
- Barcode input via standard USB/Bluetooth scanner (keyboard wedge mode)

## Architecture Notes
- Stock movements are immutable ledger entries
- Use row-level locking (SELECT FOR UPDATE) for concurrent stock adjustments
- Inventory table tracks current quantity per variant per location
