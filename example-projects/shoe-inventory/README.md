# SoleTrack - Shoe Inventory Management

Real-time inventory management for Metro Kicks (2 stores + online).

## Status

Phase: Building (Sprint 2)

## Stack

Next.js 14, PostgreSQL, Tailwind CSS + shadcn/ui, Railway

## Key Decisions

- Custom SKU format: BRAND-MODEL-SIZE-COLOR
- Row-level locking for inventory transactions
- Barcode scanning via keyboard wedge (no special API)
- Email alerts for low stock (not push)
