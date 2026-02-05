# SoleTrack - Project Briefing

## Customer
Metro Kicks -- sneaker retailer with 2 physical stores (Downtown, Westside) and an online shop. Primary contact: Marcus Rivera (Owner).

## Problem
Inventory discrepancies between stores and online. Manual stock counts take a full day per location. No visibility into which sizes sell fast, leading to overstock on slow sizes and stockouts on popular ones. Lost an estimated $15K/month in missed sales from stockouts.

## Solution
Real-time inventory management system with barcode scanning, cross-location stock transfers, and automated low-stock alerts.

## Success Metrics
- Real-time inventory accuracy within 1% across all locations
- Stock transfer between locations completed in under 2 minutes
- Low-stock alerts sent before stockout occurs (at configurable threshold)
- Staff can scan and adjust inventory in under 10 seconds per item

## Constraints
- Professional tier project
- Must support shoe-specific attributes (size with half sizes, color, brand)
- Two user roles: store manager (full access) and staff (scan/adjust only)
- Barcode scanners already purchased (Symbol LS2208 USB, Socket Mobile S700 Bluetooth)
- Mobile-friendly for in-store use on tablets

## Wiki Reference
Deeper context available in the knowledge base:
- `memory/decisions.md` -- SKU encoding, database locking strategy, alert approach
- `memory/codebase.md` -- schema details, barcode scanning implementation
- `memory/research.md` -- barcode scanner compatibility findings
- `memory/blockers.md` -- resolved concurrency issues
