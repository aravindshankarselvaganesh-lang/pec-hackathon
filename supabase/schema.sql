-- ==============================================================================
-- RUSHLLESS: Time-Aware Restaurant Ordering & Live Kitchen KDS
-- Supabase PostgreSQL Schema & Realtime Setup
-- ==============================================================================

-- 1. ENUMS & EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
    CREATE TYPE station_id_enum AS ENUM ('quick-bites', 'hot-kitchen', 'fryer', 'drinks');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE dietary_enum AS ENUM ('PURE_VEG', 'VEG', 'NON_VEG', 'VEGAN', 'BEVERAGE', 'JAIN_AVAIL');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE order_type_enum AS ENUM ('DINE_IN', 'TAKEAWAY');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE order_status_enum AS ENUM ('PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'COLLECTED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE station_status_enum AS ENUM ('CALM', 'BUSY', 'PEAK');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. RESTAURANT METADATA
CREATE TABLE IF NOT EXISTS restaurants (
    id TEXT PRIMARY KEY DEFAULT 'universal-food-hall-01',
    name TEXT NOT NULL,
    descriptor TEXT,
    tagline TEXT,
    address TEXT,
    neighbourhood TEXT,
    phone TEXT,
    currency TEXT DEFAULT '₹',
    tax_rate_percent NUMERIC(5, 2) DEFAULT 5.0,
    default_buffer_minutes INT DEFAULT 3,
    is_open BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. KITCHEN PREPARATION STATIONS & LIVE WORKLOAD
CREATE TABLE IF NOT EXISTS kitchen_stations (
    id station_id_enum PRIMARY KEY,
    name TEXT NOT NULL,
    capacity_slots INT NOT NULL DEFAULT 2,
    avg_time_multiplier NUMERIC(3, 2) DEFAULT 1.0,
    description TEXT,
    current_wait_minutes INT DEFAULT 0,
    active_load INT DEFAULT 0,
    queue_count INT DEFAULT 0,
    status station_status_enum DEFAULT 'CALM',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. MENU CATEGORIES
CREATE TABLE IF NOT EXISTS menu_categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    display_order INT NOT NULL DEFAULT 0,
    description TEXT,
    icon_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. MENU ITEMS
CREATE TABLE IF NOT EXISTS menu_items (
    id TEXT PRIMARY KEY,
    category_id TEXT REFERENCES menu_categories(id) ON UPDATE CASCADE,
    station_id station_id_enum REFERENCES kitchen_stations(id) ON UPDATE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    preparation_time_minutes INT NOT NULL DEFAULT 5,
    is_available BOOLEAN DEFAULT TRUE,
    image_url TEXT,
    dietary dietary_enum DEFAULT 'VEG',
    is_popular BOOLEAN DEFAULT FALSE,
    chef_pick BOOLEAN DEFAULT FALSE,
    fast_prep BOOLEAN DEFAULT FALSE,
    fast_prep_badge TEXT,
    portion_note TEXT,
    spice_level TEXT,
    allergens TEXT[] DEFAULT '{}',
    alternative_item_ids TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ORDERS & LINE ITEMS
CREATE SEQUENCE IF NOT EXISTS order_token_seq START 26;

CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    order_token TEXT NOT NULL UNIQUE,
    order_type order_type_enum NOT NULL DEFAULT 'TAKEAWAY',
    customer_name TEXT NOT NULL DEFAULT 'Guest',
    customer_phone TEXT,
    table_number TEXT,
    subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0,
    tax NUMERIC(10, 2) NOT NULL DEFAULT 0,
    total NUMERIC(10, 2) NOT NULL DEFAULT 0,
    requested_deadline TEXT NOT NULL,
    estimated_ready_time TEXT NOT NULL,
    status order_status_enum NOT NULL DEFAULT 'PENDING',
    is_walk_in BOOLEAN DEFAULT FALSE,
    feasibility_snapshot TEXT DEFAULT 'FEASIBLE',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_line_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id TEXT REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id TEXT REFERENCES menu_items(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    preparation_time_minutes INT NOT NULL,
    station_id station_id_enum NOT NULL,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS order_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id TEXT REFERENCES orders(id) ON DELETE CASCADE,
    status order_status_enum NOT NULL,
    note TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 7. FUNCTION: AUTO-INSERT STATUS HISTORY ON ORDER STATUS UPDATE
CREATE OR REPLACE FUNCTION set_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_orders_updated_at ON orders;
CREATE TRIGGER trg_orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION set_orders_updated_at();

CREATE OR REPLACE FUNCTION record_order_status_history()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') OR (OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO order_status_history (order_id, status, note, timestamp)
        VALUES (
            NEW.id,
            NEW.status,
            CASE 
                WHEN TG_OP = 'INSERT' THEN 'Order registered'
                ELSE 'Status updated to ' || NEW.status
            END,
            NOW()
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_order_status_history ON orders;
CREATE TRIGGER trg_order_status_history
AFTER INSERT OR UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION record_order_status_history();

-- 8. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE kitchen_stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;

-- Allow public read access to catalog data
CREATE POLICY "Public read restaurants" ON restaurants FOR SELECT USING (true);
CREATE POLICY "Public read stations" ON kitchen_stations FOR SELECT USING (true);
CREATE POLICY "Public read categories" ON menu_categories FOR SELECT USING (true);
CREATE POLICY "Public read menu items" ON menu_items FOR SELECT USING (true);

-- Allow public read & insert for orders (so customers can create and track orders)
CREATE POLICY "Public read orders" ON orders FOR SELECT USING (true);
CREATE POLICY "Public insert orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update orders" ON orders FOR UPDATE USING (true);

CREATE POLICY "Public read order_line_items" ON order_line_items FOR SELECT USING (true);
CREATE POLICY "Public insert order_line_items" ON order_line_items FOR INSERT WITH CHECK (true);

CREATE POLICY "Public read order_status_history" ON order_status_history FOR SELECT USING (true);
CREATE POLICY "Public insert order_status_history" ON order_status_history FOR INSERT WITH CHECK (true);

-- Allow kitchen staff / admin updates on menu availability & station status
CREATE POLICY "Public update menu_items" ON menu_items FOR UPDATE USING (true);
CREATE POLICY "Public update kitchen_stations" ON kitchen_stations FOR UPDATE USING (true);

-- 9. ENABLE SUPABASE REALTIME REPLICATION
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE order_line_items;
ALTER PUBLICATION supabase_realtime ADD TABLE order_status_history;
ALTER PUBLICATION supabase_realtime ADD TABLE kitchen_stations;
ALTER PUBLICATION supabase_realtime ADD TABLE menu_items;
