# Malaika Nest — PostgreSQL Tuning & Database Best Practices

This document covers every database best practice applied to the Malaika Nest schema, plus production-grade PostgreSQL configuration for buffer pool, connection pooling, vacuuming, indexing, and scaling.

---

## 1. Normalization (3NF)

The schema is normalized to **Third Normal Form (3NF)**:

| Rule | How it's applied |
|------|------------------|
| **1NF — Atomic values** | Every column holds a single value. No comma-separated lists. Tags use a proper many-to-many junction via `Product.tags` ↔ `Tag.products`. |
| **2NF — No partial dependencies** | All non-key attributes depend on the whole primary key. Junction tables (`CartItem`, `OrderItem`, `Wishlist`) have no non-key attributes that depend on only one side of the composite key. |
| **3NF — No transitive dependencies** | No non-key column depends on another non-key column. E.g. `Category.group` is derived from the parent but stored only on the root category — never duplicated across children. |

### Controlled denormalization (snapshots)
The **only** intentional denormalization is in `Order` and `OrderItem`:
- `Order.shippingFirstName`, `shippingAddress`, etc. are **snapshots** of the address at order time. This is correct — an order is an immutable historical record; if the user later changes their address, past orders must not change.
- `OrderItem.variantDetails` (JSON) snapshots the variant's color/size/SKU at purchase time, because variants can be deleted or renamed after the sale.
- `Product.rating` and `Product.reviewCount` are **cached aggregates** updated by a trigger or application hook on `Review` insert/update/delete. This avoids a `COUNT` + `AVG` join on every product listing query.

---

## 2. Indexing Strategy

### 2.1 Single-column indexes (lookup by one field)
```
Product.slug, Product.sku, Product.name, Product.price, Product.featured,
Product.status, Product.ageGroup, Product.ageRange, Product.gender, Product.sizeLabel,
Order.status, Order.receiptNumber, Order.createdAt,
Payment.status, Payment.paymentMethod,
User.email, User.phoneNumber
```

### 2.2 Composite indexes (cover real query patterns)
```
Product(isActive, createdAt)         → "show me recent active products"
Product(categoryId, isActive)        → "browse category X, only active"
Order(status, createdAt)             → "admin: pending orders, newest first"
Order(userId, status)                → "my account: my paid orders"
CartItem(cartId, productId, variantId) → unique constraint doubles as index
InventoryLog(productId, createdAt)   → "audit trail for a product"
PaymentAuditLog(eventType, createdAt) → "show me recent STK failures"
Banner(isActive, position)           → "active banners in display order"
```

### 2.3 Unique constraints (prevent bad data)
```
Product.slug                          → slugs are URLs, must be unique
Product.sku                           → inventory tracking
User.email, User.phoneNumber          → login uniqueness
Coupon.code                           → case-insensitive lookups
Review(productId, userId)             → one review per user per product
Wishlist(userId, productId)           → no duplicate wishlist entries
CartItem(cartId, productId, variantId) → no duplicate line items
Category(parentId, slug)              → sibling slugs unique
ProductVariant(productId, size, color) → no duplicate variant combos
Invoice.invoiceNumber, Order.receiptNumber → human-facing IDs
```

### 2.4 When to add more indexes
Add a composite index only when a query pattern is **measured** to be slow via `EXPLAIN ANALYZE`. Don't speculatively index — every index slows writes.

```sql
-- Example: if the admin "recent paid orders by region" query is slow:
CREATE INDEX CONCURRENTLY idx_order_region_status_created
  ON orders_order (delivery_region, status, created_at DESC)
  WHERE status IN ('paid', 'processing', 'shipped');
```

### 2.5 Partial indexes (save space, speed up common filters)
```sql
-- Only index published products (drafts don't appear in storefront queries)
CREATE INDEX CONCURRENTLY idx_product_published
  ON products_product (created_at DESC)
  WHERE status = 'published' AND is_active = true;

-- Only index active banners
CREATE INDEX CONCURRENTLY idx_banner_active
  ON products_banner (position)
  WHERE is_active = true;
```

### 2.6 Full-text search
```sql
-- Add a generated tsvector column for product search
ALTER TABLE products_product
  ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, ''))
  ) STORED;

CREATE INDEX idx_product_search ON products_product USING GIN (search_vector);

-- Query:
SELECT * FROM products_product WHERE search_vector @@ plainto_tsquery('organic onesie');
```

---

## 3. PostgreSQL Server Tuning — Buffer Pool & Memory

These settings go in `postgresql.conf`. Values assume a dedicated DB server with **8 GB RAM** (scale proportionally).

### 3.1 Memory / Buffer pool
```ini
# ── Shared buffer pool: 25% of total RAM ──
# This is PostgreSQL's main cache — the pages most-read stay in RAM.
shared_buffers = 2GB

# ── Effective cache size: 75% of RAM ──
# Tells the planner how much OS cache is available. Affects join strategy.
effective_cache_size = 6GB

# ── Working memory per sort/hash operation ──
# Higher = fewer disk spills for ORDER BY, GROUP BY, DISTINCT, hash joins.
work_mem = 16MB

# ── Maintenance work mem (VACUUM, CREATE INDEX, ALTER TABLE) ──
maintenance_work_mem = 512MB

# ── WAL buffers (write-ahead log) ──
wal_buffers = 16MB
```

### 3.2 Connection pooling (PgBouncer)
PostgreSQL forks a process per connection — expensive at scale. Use **PgBouncer** in transaction-pooling mode:

```ini
# pgbouncer.ini
[databases]
malaika_prod = host=127.0.0.1 port=5432 dbname=malaika_prod

[pgbouncer]
listen_addr = 0.0.0.0
listen_port = 6432
auth_type = scram-sha-256
auth_file = /etc/pgbouncer/userlist.txt
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 25
reserve_pool_size = 5
reserve_pool_timeout = 3
server_idle_timeout = 600
```

App connects to PgBouncer (port 6432), which maintains a small pool of real backend connections. Supports 1000 concurrent clients with only 25 PostgreSQL processes.

### 3.3 WAL & replication
```ini
# ── Write-ahead log ──
wal_level = replica
max_wal_size = 2GB
min_wal_size = 256MB
checkpoint_completion_target = 0.9
max_wal_senders = 5

# ── Autovacuum (automatic dead-tuple cleanup) ──
autovacuum = on
autovacuum_max_workers = 4
autovacuum_naptime = 30s
autovacuum_vacuum_threshold = 50
autovacuum_analyze_threshold = 50
autovacuum_vacuum_scale_factor = 0.1
autovacuum_analyze_scale_factor = 0.05

# ── Parallel queries ──
max_worker_processes = 8
max_parallel_workers_per_gather = 2
max_parallel_workers = 8
```

### 3.4 Recommended `postgresql.conf` for production
```ini
# ── Safety ──
synchronous_commit = on              # never lose a committed txn
fsync = on
full_page_writes = on

# ── Logging ──
log_min_duration_statement = 500     # log queries slower than 500ms
log_checkpoints = on
log_connections = off
log_lock_waits = on
log_temp_files = 0                   # log any temp file spill (sort/hash to disk)
log_autovacuum_min_duration = 0

# ── Planner ──
random_page_cost = 1.1               # SSDs: random ≈ sequential
default_statistics_target = 200      # more accurate stats → better plans
jit = on

# ── Timeouts ──
statement_timeout = 30s              # kill runaway queries
idle_in_transaction_session_timeout = 60s
lock_timeout = 5s
```

---

## 4. Foreign Key Integrity & Cascade Rules

Every relationship has an explicit `onDelete` rule chosen to match business semantics:

| Relation | Rule | Why |
|----------|------|-----|
| `Product → Category` | **PROTECT** | Never delete a category that has products (would orphan them). Admin must reassign first. |
| `Product → Brand` | **SET NULL** | If a brand is deleted, products stay but become "unbranded". |
| `Order → Product` (via OrderItem) | **PROTECT** | Never delete a product that was sold — it's part of a historical order. |
| `OrderItem → Order` | **CASCADE** | Delete the order, delete its items. |
| `Review → Product` | **CASCADE** | Delete product, delete its reviews. |
| `Wishlist → User` | **CASCADE** | Delete user, delete their wishlist. |
| `Wishlist → Product` | **CASCADE** | Delete product, remove from all wishlists. |
| `Cart → User` | **CASCADE** | Delete user, delete their cart. |
| `CartItem → Cart` | **CASCADE** | Delete cart, delete items. |
| `Payment → Order` | **PROTECT** | Never delete an order that has a payment record (financial audit). |
| `InventoryLog → Order` | **SET NULL** | Order can be deleted but the inventory audit trail stays. |
| `UserAddress → User` | **CASCADE** | Delete user, delete addresses. |
| `Invoice → Order` | **CASCADE** | Delete order, delete invoice. |

---

## 5. State Machine — Order Status

The `OrderStatus` enum enforces valid transitions at the **type level**. The application layer (`Order.transitionTo()`) validates the state machine before any write:

```
pending → initiated → paid → processing → shipped → delivered
                ↓        ↓        ↓           ↓
            payment_failed  cancelled  cancelled   cancelled
                                                                    ↓
                                                               refunded
```

- **pending** — order created, awaiting payment
- **initiated** — M-Pesa STK push sent to customer's phone
- **paid** — payment confirmed, inventory reserved → deducted, invoice generated
- **processing** — warehouse picking the order
- **shipped** — courier has it, tracking number set
- **delivered** — customer received it
- **cancelled** — void (inventory un-reserved)
- **refunded** — money returned

Invalid transitions (e.g. `delivered → pending`) are rejected before the SQL `UPDATE`.

---

## 6. Concurrency & Race Conditions

### 6.1 Inventory reservation with row-level locking
The `create_order_from_cart()` service uses `SELECT FOR UPDATE` to lock inventory rows during checkout, preventing overselling when two customers check out the last item simultaneously:

```sql
BEGIN;
  SELECT * FROM products_inventory
    WHERE product_id IN (...)
    FOR UPDATE;  -- locks rows until COMMIT
  -- validate stock, reserve, create order
COMMIT;
```

### 6.2 Optimistic concurrency on cart updates
Cart quantity updates use debounce + server reconciliation. If two tabs update the same cart, the last write wins but the server re-fetches the canonical state.

### 6.3 Receipt number generation
`receipt_number` is `MN-<12-hex>` from `uuid4().hex[:12]`. Collision probability is negligible (~1 in 16¹²). A `UNIQUE` constraint backstops it.

---

## 7. Backup & Recovery

### 7.1 Automated daily backups (pg_dump)
```bash
# /etc/cron.d/malaika-db-backup
0 2 * * * postgres pg_dump -Fc malaika_prod | gzip > /backups/malaika_$(date +\%F).sql.gz
# Retain 30 days
0 3 * * * postgres find /backups -name 'malaika_*.sql.gz' -mtime +30 -delete
```

### 7.2 Point-in-time recovery (PITR) with WAL archiving
```ini
# postgresql.conf
archive_mode = on
archive_command = 'test ! -f /archive/%f && cp %p /archive/%f'
archive_timeout = 300
```

Combined with a base backup, you can restore to any second. Critical for accidental `DELETE` recovery.

### 7.3 Replication
- **Streaming replication** to a hot standby for read scaling + failover.
- **Logical replication** if you need to replicate only some tables (e.g. sync products to a read-only analytics DB).

---

## 8. Vacuuming & Bloat Prevention

PostgreSQL's MVCC leaves "dead tuples" after UPDATE/DELETE. Autovacuum cleans them, but tune it for high-write tables:

```sql
-- For the orders table (high INSERT rate), vacuum more aggressively:
ALTER TABLE orders_order SET (
  autovacuum_vacuum_scale_factor = 0.05,
  autovacuum_analyze_scale_factor = 0.02
);

-- For the payments audit log (append-only, never updated):
ALTER TABLE payments_paymentauditlog SET (
  autovacuum_vacuum_scale_factor = 0.2,
  fillfactor = 100  -- no updates expected, pack pages tight
);
```

**Manual vacuum schedule** (off-peak, weekly):
```sql
VACUUM (ANALYZE, VERBOSE) orders_order;
VACUUM (ANALYZE, VERBOSE) payments_payment;
REINDEX INDEX CONCURRENTLY orders_order_receipt_number_idx;
```

---

## 9. Monitoring

### 9.1 Key metrics to alert on
- `pg_stat_activity` — active connections vs. `max_connections`
- `pg_stat_user_tables.n_dead_tup` — bloat (vacuum lag)
- `pg_stat_database.blks_hit / (blks_hit + blks_read)` — cache hit ratio (target > 99%)
- `pg_stat_user_indexes.idx_scan = 0` — unused indexes (candidates for removal)
- `pg_locks` — blocked queries
- WAL generation rate (MB/min) — sudden spikes = bulk writes

### 9.2 Slow query log
`log_min_duration_statement = 500` logs every query slower than 500ms. Review weekly with:
```sql
SELECT query, calls, mean_exec_time, total_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 20;
```

---

## 10. Scaling Strategy

### Vertical (first)
- Bump `shared_buffers` to 25% of RAM
- Add more `work_mem` for complex admin reports
- Faster disks (NVMe)

### Horizontal (when vertical plateaus)
1. **Read replicas** — send storefront `SELECT` queries to a hot standby. Writes stay on primary.
2. **Connection pooling** — PgBouncer (see §3.2)
3. **Table partitioning** — partition `Order` and `Payment` by `createdAt` month once you hit ~10M rows:
   ```sql
   CREATE TABLE orders_order (LIKE orders_order INCLUDING ALL)
     PARTITION BY RANGE (created_at);
   CREATE TABLE orders_order_2026_01 PARTITION OF orders_order
     FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
   ```
4. **Caching layer** — Redis for product listings, category trees, banners (5–10 min TTL). The `api.ts` interceptor already implements in-memory caching; Redis is the next step for multi-instance deploys.
5. **Full-text search** — move from `tsvector` to Meilisearch or Elasticsearch once product count > 50k and search latency > 200ms.

---

## 11. Security

- **TLS everywhere** — `ssl = on` in `postgresql.conf`, `sslmode = verify-full` in the app connection string.
- **Least privilege** — app DB user has `SELECT, INSERT, UPDATE, DELETE` on tables but **no** `DROP`, `TRUNCATE`, or `CREATE`. Migrations run as a separate user.
- **Row-level security** (optional) — if you ever host multiple stores in one DB:
  ```sql
  ALTER TABLE orders_order ENABLE ROW LEVEL SECURITY;
  CREATE POLICY tenant_isolation ON orders_order
    USING (tenant_id = current_setting('app.tenant_id')::uuid);
  ```
- **Secrets** — `DATABASE_URL` in `.env` only, never committed. Rotate quarterly.
- **Audit** — `PaymentAuditLog` records every M-Pesa callback with `requestIp`, `payloadHash`, and `resultCode` for fraud detection.

---

## 12. Migration Workflow

```bash
# Create a migration after schema changes
bun run db:migrate -- --name add_product_search_vector

# Apply to dev
bun run db:push

# Production (zero-downtime):
# 1. Create new index CONCURRENTLY (doesn't block writes)
CREATE INDEX CONCURRENTLY idx_x ON table (col);

# 2. Add columns with defaults (instant in PG 11+)
ALTER TABLE products_product ADD COLUMN new_col TEXT DEFAULT '';

# 3. Backfill in batches (never one big UPDATE)
UPDATE products_product SET new_col = 'x' WHERE id IN (SELECT id FROM products_product WHERE new_col = '' LIMIT 1000);

# 4. Drop old column in a maintenance window
ALTER TABLE products_product DROP COLUMN old_col;
```

**Never** run `DROP TABLE`, `ALTER TABLE ... DROP COLUMN`, or `CREATE INDEX` (non-concurrent) in production without a maintenance window.
