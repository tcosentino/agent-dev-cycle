# Brand Data Object

A data object service for managing shoe brands in the inventory system.

## Overview

The Brand service stores and manages brand information such as Nike, Adidas, New Balance, etc. Each brand has a unique code (2-4 characters) used in SKU generation.

## Schema

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Unique identifier (auto-generated) |
| name | string | Brand display name (e.g., "Nike") |
| code | string | 2-4 character code for SKUs (e.g., "NK") |
| createdAt | date | Creation timestamp |
| updatedAt | date | Last update timestamp |

## Usage

```typescript
// Create a brand
POST /brands
{
  "name": "Nike",
  "code": "NK"
}

// List brands
GET /brands

// Get by ID
GET /brands/:id

// Update
PUT /brands/:id
{
  "name": "Nike Inc."
}

// Delete
DELETE /brands/:id
```

## Business Rules

- Brand codes must be unique across the system
- Brand codes are automatically uppercased
- Brands cannot be deleted if they have associated products
