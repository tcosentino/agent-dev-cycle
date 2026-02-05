# Application Architecture Visualization

This document describes how AgentForge visualizes the software it builds, focusing on grounded, real-world building blocks rather than abstract diagrams.

## Design Philosophy

### Grounded in Reality

The ApplicationView component shows real infrastructure components—not magic boxes. When users see their application architecture, they should understand:

1. **What each component actually does** - API endpoints, database tables, message queues
2. **How data flows between them** - HTTP calls, webhooks, polling, pub/sub
3. **What protocols are used** - REST, GraphQL, WebSocket, AMQP
4. **Where state lives** - Databases, caches, sync checkpoints

This transparency serves two purposes:
- **Trust** - Users can verify the system is doing what they expect
- **Education** - Users learn how distributed systems work

### Visual Language Standards

Our visualization follows industry standards from the [C4 model](https://c4model.com/) and cloud provider conventions:

| Element | Visual Treatment |
|---------|-----------------|
| **External Services** | Brand colors (HubSpot orange, ConnectWise blue) |
| **Orchestration** | Primary accent color (amber) |
| **Data Stores** | Distinct database icon, neutral styling |
| **Transformations** | Process/gear iconography |
| **Connections** | Arrows showing data flow direction |
| **Active Status** | Green glow, pulsing indicator |
| **Syncing Status** | Blue pulsing ring |
| **Error Status** | Red glow, solid indicator |

---

## Building Blocks

These are the infrastructure primitives that AgentForge agents can create and manage. Each maps to real, deployable components.

### 1. API Endpoints

REST or GraphQL endpoints that expose functionality.

```yaml
type: api-endpoint
name: inventory-api
spec:
  base_path: /api/v1/inventory
  endpoints:
    - method: GET
      path: /products
      description: List all products with optional filters
    - method: POST
      path: /products
      description: Create a new product
    - method: PUT
      path: /products/{id}
      description: Update product details
    - method: DELETE
      path: /products/{id}
      description: Remove a product
  authentication: api-key
  rate_limit: 100/minute
```

**Visual representation**: Rectangle with HTTP method badges, shows request/response flow.

### 2. Database Schemas

Relational or document database structures.

```yaml
type: database
name: inventory-db
spec:
  engine: postgresql
  tables:
    - name: products
      columns:
        - name: id
          type: uuid
          primary: true
        - name: sku
          type: varchar(50)
          unique: true
        - name: name
          type: varchar(255)
        - name: quantity
          type: integer
          default: 0
      indexes:
        - columns: [sku]
        - columns: [name]
    - name: stock_movements
      columns:
        - name: id
          type: uuid
          primary: true
        - name: product_id
          type: uuid
          foreign_key: products.id
        - name: quantity_change
          type: integer
        - name: timestamp
          type: timestamptz
```

**Visual representation**: Cylinder/database icon, shows table names and relationships.

### 3. Scheduled Jobs

Cron-based or interval-triggered background processes.

```yaml
type: scheduled-job
name: inventory-sync
spec:
  schedule: "*/15 * * * *"  # Every 15 minutes
  description: Sync inventory levels from warehouse API
  steps:
    - fetch: warehouse-api/inventory
    - transform: map-to-internal-format
    - upsert: inventory-db/products
  retry:
    attempts: 3
    backoff: exponential
  timeout: 5m
```

**Visual representation**: Clock icon with schedule indicator, shows trigger frequency.

### 4. Webhooks

Inbound event receivers from external systems.

```yaml
type: webhook
name: hubspot-contact-webhook
spec:
  source: hubspot
  events:
    - contact.creation
    - contact.propertyChange
    - contact.deletion
  endpoint: /webhooks/hubspot/contacts
  authentication:
    type: signature
    header: X-HubSpot-Signature
  processing:
    queue: hubspot-events
    deduplication: true
```

**Visual representation**: Incoming arrow with event type label, shows source system.

### 5. Message Queues

Async communication channels between components.

```yaml
type: message-queue
name: sync-events
spec:
  provider: sqs  # or rabbitmq, redis
  queues:
    - name: contact-sync
      visibility_timeout: 30s
      retention: 7d
      dlq: contact-sync-dlq
    - name: company-sync
      visibility_timeout: 60s
      retention: 7d
      dlq: company-sync-dlq
```

**Visual representation**: Queue icon with message count, shows consumers.

### 6. Integration Connectors

Pre-built connections to external SaaS platforms.

```yaml
type: connector
name: hubspot-connector
spec:
  platform: hubspot
  authentication:
    type: oauth2
    scopes:
      - crm.objects.contacts.read
      - crm.objects.contacts.write
      - crm.objects.companies.read
  capabilities:
    - read: contacts, companies, deals
    - write: contacts, companies
    - webhook: contact.*, company.*
  rate_limits:
    - 100 requests/10 seconds (standard)
    - 150 requests/10 seconds (with burst)
```

**Visual representation**: Platform logo/icon with connection status.

### 7. Data Transformers

Field mapping and data transformation logic.

```yaml
type: transformer
name: hubspot-to-connectwise-contact
spec:
  source_schema: hubspot.contact
  target_schema: connectwise.contact
  mappings:
    - source: firstname
      target: firstName
    - source: lastname
      target: lastName
    - source: email
      target: communicationItems[type=Email].value
    - source: phone
      target: communicationItems[type=Phone].value
    - source: company
      target: company.name
      lookup: companies-by-name
  defaults:
    - target: type.id
      value: 1  # Contact type
  validation:
    - field: email
      rule: required
      on_fail: skip_record
```

**Visual representation**: Transform/process icon showing input->output schemas.

### 8. Sync State Store

Tracks synchronization progress and handles resumption.

```yaml
type: sync-state
name: hubspot-connectwise-sync
spec:
  storage: postgresql
  tracking:
    - entity: contacts
      cursor_type: timestamp
      cursor_field: hs_lastmodifieddate
    - entity: companies
      cursor_type: timestamp
      cursor_field: hs_lastmodifieddate
  checkpointing:
    interval: 100 records
    on_error: rollback_to_checkpoint
  deduplication:
    window: 24h
    key_fields: [source_id, target_id]
```

**Visual representation**: Database icon with sync arrows, shows last sync time.

### 9. Error Handlers

Dead letter queues and error recovery logic.

```yaml
type: error-handler
name: sync-error-handler
spec:
  sources:
    - queue: contact-sync-dlq
    - queue: company-sync-dlq
  classification:
    - pattern: "rate_limit"
      action: retry_with_backoff
      max_retries: 5
    - pattern: "not_found"
      action: skip_and_log
    - pattern: "validation"
      action: route_to_review
    - pattern: "*"
      action: alert_and_hold
  alerts:
    - channel: slack
      on: [alert_and_hold, retry_exhausted]
```

**Visual representation**: Warning icon with error counts, shows recovery status.

### 10. API Gateway / Rate Limiter

Manages outbound API call rates and authentication.

```yaml
type: api-gateway
name: external-api-gateway
spec:
  targets:
    - name: hubspot-api
      base_url: https://api.hubapi.com
      rate_limit: 100/10s
      auth: oauth2
      retry: exponential_backoff
    - name: connectwise-api
      base_url: https://api-na.myconnectwise.net
      rate_limit: 1000/minute
      auth: basic
      retry: linear_backoff
  circuit_breaker:
    failure_threshold: 5
    recovery_time: 60s
```

**Visual representation**: Gateway icon with throughput meter.

---

## Architecture Patterns

### Integration Pipeline (Current Demo)

The HubSpot to ConnectWise sync demonstrates a typical integration pattern:

```
Source (HubSpot)          Transform Layer              Destination (ConnectWise)
----------------          ---------------              -------------------------

[HubSpot API] ──webhook──> [Event Queue]
                              │
                              ▼
                          [Field Mapper] ──────────> [ConnectWise API]
                              │
                              ▼
                          [Sync State DB]
```

Components:
1. **Webhook receiver** - Catches real-time events from HubSpot
2. **Event queue** - Buffers events for reliable processing
3. **Field mapper** - Transforms HubSpot schema to ConnectWise schema
4. **Sync state** - Tracks what's been synced, handles deduplication
5. **API gateway** - Manages rate limits to ConnectWise

### CRUD Application

A typical business application pattern:

```
User Interface              Backend                    Data Layer
--------------              -------                    ----------

[Web App] ────REST────> [API Server] ──────────> [PostgreSQL]
                              │
                              ├──────────> [Redis Cache]
                              │
                              └──────────> [S3 Storage]
```

### Event-Driven System

For complex business logic and workflows:

```
Triggers                    Processing                 Actions
--------                    ----------                 -------

[Webhook] ─────┐
               │
[Schedule] ────┼──> [Event Bus] ──> [Worker Pool] ──> [External APIs]
               │                          │
[API Call] ────┘                          ▼
                                    [State Store]
```

---

## Visualization States

### Node States

| State | Indicator | Meaning |
|-------|-----------|---------|
| `idle` | Gray dot | No activity, waiting |
| `active` | Green glow | Successfully processing |
| `syncing` | Blue pulse | Data transfer in progress |
| `polling` | Blue blink | Checking for changes |
| `rate-limited` | Yellow | Waiting on API limits |
| `error` | Red glow | Failed, needs attention |

### Connection States

| State | Visual | Meaning |
|-------|--------|---------|
| Inactive | Dashed gray | No current data flow |
| Active | Solid colored | Data currently flowing |
| Error | Red dashed | Connection failed |

### Data Pulses

Animated dots traveling along connections represent actual data:

| Pulse Color | Data Type |
|-------------|-----------|
| Green | Contacts/People |
| Blue | Companies/Organizations |
| Amber | Tickets/Issues |
| Pink | Opportunities/Deals |

---

## Implementation

The ApplicationView component lives in `src/components/application-view/` with:

- `types.ts` - Type definitions for nodes, connections, pulses
- `SystemNode.tsx` - Individual component blocks
- `ConnectionLines.tsx` - SVG paths with animated pulses
- `ApplicationView.tsx` - Main container with header and legend
- `ApplicationViewDemo.tsx` - Animated demo with story player

See the component in action at `/component-preview.html` (scroll to "Application View" section).

---

## Future Enhancements

### Interactive Mode

- Click nodes to see detailed configuration
- Hover connections to see data samples
- Pause/resume animation
- Time scrubbing through sync history

### Real Data Integration

- Connect to actual monitoring data
- Show real record counts and timing
- Alert on actual errors
- Historical playback of sync events

### Multiple Views

- **Logical view** - Business-level components (current)
- **Physical view** - Actual infrastructure (servers, containers)
- **Data flow view** - Focus on data transformation
- **Timeline view** - Sequential event visualization
