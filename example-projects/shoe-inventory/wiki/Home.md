# SoleTrack Wiki

Welcome to the SoleTrack knowledge base. This wiki contains shared documentation, guides, and reference material for the project.

## Quick Links

- [Getting Started](./Getting-Started.md) - Setup and onboarding
- [Inventory Management](./Inventory-Management.md) - How the inventory system works
- [Barcode Scanning](./Barcode-Scanning.md) - Scanner setup and troubleshooting

## Project Overview

SoleTrack is a real-time inventory management system built for Metro Kicks, a sneaker retailer with 2 physical stores and an online shop. The system provides:

- Real-time inventory tracking across all locations
- Barcode scanning for quick stock adjustments
- Cross-location stock transfers
- Automated low-stock alerts

## Key Concepts

### SKU Format
SKUs follow the pattern: `{BRAND}-{MODEL}-{COLOR}-{SIZE}`
Example: `NK-AF1-WHT-105` (Nike Air Force 1, White, Size 10.5)

### Locations
- `DOWNTOWN` - Downtown store
- `WESTSIDE` - Westside store
- `WAREHOUSE` - Online fulfillment center

### User Roles
- **Store Manager** - Full access to all features
- **Staff** - Can scan and adjust inventory only

## Related Documentation

For technical decisions and implementation details, see:
- `memory/decisions.md` - Architecture decisions
- `memory/codebase.md` - Code conventions
- `ARCHITECTURE.md` - System architecture
