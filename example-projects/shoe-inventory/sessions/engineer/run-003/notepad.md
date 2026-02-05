# Engineer Notepad -- run-003

## What I'm doing
Implementing barcode scanning and inventory lookup.

## Working state
- [x] BarcodeInput component with keyboard wedge detection
- [x] 50ms debounce to differentiate scanner from human typing
- [x] Inventory lookup API route (/api/inventory/lookup?sku=)
- [x] Returns variant details + stock at all locations
- [ ] Wire scan result to stock adjustment form (next session)
- [ ] Add error handling for invalid/unknown SKUs (next session)

## Notes to self
- Scanner sends characters very fast then Enter -- the debounce approach works well
- Need to handle case where SKU is scanned but variant doesn't exist in DB yet (new receiving flow)
- The lookup response includes all locations -- UI should highlight the current store
