ALTER TABLE orders_coupon ADD COLUMN IF NOT EXISTS created_at timestamptz;
ALTER TABLE orders_coupon ADD COLUMN IF NOT EXISTS updated_at timestamptz;
UPDATE orders_coupon SET created_at = COALESCE(created_at, NOW()), updated_at = COALESCE(updated_at, NOW());
ALTER TABLE orders_coupon ALTER COLUMN created_at SET DEFAULT NOW();
ALTER TABLE orders_coupon ALTER COLUMN updated_at SET DEFAULT NOW();
ALTER TABLE orders_coupon ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE orders_coupon ALTER COLUMN updated_at SET NOT NULL;

ALTER TABLE orders_invoice ADD COLUMN IF NOT EXISTS created_at timestamptz;
ALTER TABLE orders_invoice ADD COLUMN IF NOT EXISTS updated_at timestamptz;
UPDATE orders_invoice SET created_at = COALESCE(created_at, NOW()), updated_at = COALESCE(updated_at, NOW());
ALTER TABLE orders_invoice ALTER COLUMN created_at SET DEFAULT NOW();
ALTER TABLE orders_invoice ALTER COLUMN updated_at SET DEFAULT NOW();
ALTER TABLE orders_invoice ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE orders_invoice ALTER COLUMN updated_at SET NOT NULL;

ALTER TABLE orders_order ADD COLUMN IF NOT EXISTS created_at timestamptz;
ALTER TABLE orders_order ADD COLUMN IF NOT EXISTS updated_at timestamptz;
UPDATE orders_order SET created_at = COALESCE(created_at, NOW()), updated_at = COALESCE(updated_at, NOW());
ALTER TABLE orders_order ALTER COLUMN created_at SET DEFAULT NOW();
ALTER TABLE orders_order ALTER COLUMN updated_at SET DEFAULT NOW();
ALTER TABLE orders_order ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE orders_order ALTER COLUMN updated_at SET NOT NULL;

ALTER TABLE orders_orderitem ADD COLUMN IF NOT EXISTS created_at timestamptz;
ALTER TABLE orders_orderitem ADD COLUMN IF NOT EXISTS updated_at timestamptz;
UPDATE orders_orderitem SET created_at = COALESCE(created_at, NOW()), updated_at = COALESCE(updated_at, NOW());
ALTER TABLE orders_orderitem ALTER COLUMN created_at SET DEFAULT NOW();
ALTER TABLE orders_orderitem ALTER COLUMN updated_at SET DEFAULT NOW();
ALTER TABLE orders_orderitem ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE orders_orderitem ALTER COLUMN updated_at SET NOT NULL;

ALTER TABLE orders_cart ADD COLUMN IF NOT EXISTS created_at timestamptz;
ALTER TABLE orders_cart ADD COLUMN IF NOT EXISTS updated_at timestamptz;
UPDATE orders_cart SET created_at = COALESCE(created_at, NOW()), updated_at = COALESCE(updated_at, NOW());
ALTER TABLE orders_cart ALTER COLUMN created_at SET DEFAULT NOW();
ALTER TABLE orders_cart ALTER COLUMN updated_at SET DEFAULT NOW();
ALTER TABLE orders_cart ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE orders_cart ALTER COLUMN updated_at SET NOT NULL;

ALTER TABLE orders_cartitem ADD COLUMN IF NOT EXISTS created_at timestamptz;
ALTER TABLE orders_cartitem ADD COLUMN IF NOT EXISTS updated_at timestamptz;
UPDATE orders_cartitem SET created_at = COALESCE(created_at, NOW()), updated_at = COALESCE(updated_at, NOW());
ALTER TABLE orders_cartitem ALTER COLUMN created_at SET DEFAULT NOW();
ALTER TABLE orders_cartitem ALTER COLUMN updated_at SET DEFAULT NOW();
ALTER TABLE orders_cartitem ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE orders_cartitem ALTER COLUMN updated_at SET NOT NULL;
