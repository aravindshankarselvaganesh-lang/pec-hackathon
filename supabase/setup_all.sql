-- ==============================================================================
-- RUSHLLESS COMPLETE SUPABASE SETUP (SCHEMA + POLICIES + REALTIME + SEED DATA)
-- Copy and run this ENTIRE script in your Supabase SQL Editor (supabase.com)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
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

-- 3. RESTAURANT METADATA
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

-- 4. KITCHEN PREPARATION STATIONS & LIVE WORKLOAD
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

-- 5. MENU CATEGORIES
CREATE TABLE IF NOT EXISTS menu_categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    display_order INT NOT NULL DEFAULT 0,
    description TEXT,
    icon_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. MENU ITEMS
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

-- 7. ORDERS & LINE ITEMS
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

-- 8. AUTO-INSERT STATUS HISTORY ON ORDER STATUS UPDATE
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
        NEW.updated_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_order_status_history ON orders;
CREATE TRIGGER trg_order_status_history
BEFORE INSERT OR UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION record_order_status_history();

-- 9. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE kitchen_stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Public read restaurants" ON restaurants;
    CREATE POLICY "Public read restaurants" ON restaurants FOR SELECT USING (true);
EXCEPTION WHEN undefined_object THEN null; END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Public read stations" ON kitchen_stations;
    CREATE POLICY "Public read stations" ON kitchen_stations FOR SELECT USING (true);
    DROP POLICY IF EXISTS "Public update stations" ON kitchen_stations;
    CREATE POLICY "Public update stations" ON kitchen_stations FOR UPDATE USING (true);
EXCEPTION WHEN undefined_object THEN null; END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Public read categories" ON menu_categories;
    CREATE POLICY "Public read categories" ON menu_categories FOR SELECT USING (true);
EXCEPTION WHEN undefined_object THEN null; END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Public read menu items" ON menu_items;
    CREATE POLICY "Public read menu items" ON menu_items FOR SELECT USING (true);
    DROP POLICY IF EXISTS "Public update menu_items" ON menu_items;
    CREATE POLICY "Public update menu_items" ON menu_items FOR UPDATE USING (true);
EXCEPTION WHEN undefined_object THEN null; END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Public read orders" ON orders;
    CREATE POLICY "Public read orders" ON orders FOR SELECT USING (true);
    DROP POLICY IF EXISTS "Public insert orders" ON orders;
    CREATE POLICY "Public insert orders" ON orders FOR INSERT WITH CHECK (true);
    DROP POLICY IF EXISTS "Public update orders" ON orders;
    CREATE POLICY "Public update orders" ON orders FOR UPDATE USING (true);
EXCEPTION WHEN undefined_object THEN null; END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Public read order_line_items" ON order_line_items;
    CREATE POLICY "Public read order_line_items" ON order_line_items FOR SELECT USING (true);
    DROP POLICY IF EXISTS "Public insert order_line_items" ON order_line_items;
    CREATE POLICY "Public insert order_line_items" ON order_line_items FOR INSERT WITH CHECK (true);
EXCEPTION WHEN undefined_object THEN null; END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Public read order_status_history" ON order_status_history;
    CREATE POLICY "Public read order_status_history" ON order_status_history FOR SELECT USING (true);
    DROP POLICY IF EXISTS "Public insert order_status_history" ON order_status_history;
    CREATE POLICY "Public insert order_status_history" ON order_status_history FOR INSERT WITH CHECK (true);
EXCEPTION WHEN undefined_object THEN null; END $$;

-- 10. ENABLE SUPABASE REALTIME REPLICATION
DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE orders;
EXCEPTION WHEN others THEN null; END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE order_line_items;
EXCEPTION WHEN others THEN null; END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE order_status_history;
EXCEPTION WHEN others THEN null; END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE kitchen_stations;
EXCEPTION WHEN others THEN null; END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE menu_items;
EXCEPTION WHEN others THEN null; END $$;

-- 11. SEED DATA

-- Restaurant
INSERT INTO restaurants (id, name, descriptor, tagline, address, neighbourhood, phone, currency, tax_rate_percent, default_buffer_minutes, is_open)
VALUES (
    'universal-food-hall-01',
    'Crossroads Food Hall',
    'Campus Food Hall',
    'Fresh food, timed to your break.',
    'Central Galleria, Campus Food Hub',
    'University Campus',
    '+91 98108 54321',
    '₹',
    5.0,
    3,
    true
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    tagline = EXCLUDED.tagline;

-- Kitchen Stations
INSERT INTO kitchen_stations (id, name, capacity_slots, avg_time_multiplier, description, current_wait_minutes, active_load, queue_count, status)
VALUES
    ('quick-bites', 'Quick Bites', 3, 1.0, 'Sandwiches, wraps, and momos', 4, 1, 1, 'CALM'),
    ('hot-kitchen', 'Hot Kitchen', 2, 1.2, 'Dosas, curries, burgers, and pasta', 9, 2, 3, 'PEAK'),
    ('fryer', 'Fryer', 2, 1.0, 'Samosas and crispy fries', 4, 1, 1, 'BUSY'),
    ('drinks', 'Drinks Bar', 4, 0.8, 'Chai, coffee, boba, and coolers', 2, 1, 0, 'CALM')
ON CONFLICT (id) DO UPDATE SET
    current_wait_minutes = EXCLUDED.current_wait_minutes,
    active_load = EXCLUDED.active_load,
    queue_count = EXCLUDED.queue_count,
    status = EXCLUDED.status;

-- Menu Categories
INSERT INTO menu_categories (id, name, display_order, description)
VALUES
    ('all', 'All Items', 0, 'Full menu'),
    ('indian', 'Indian Tiffin', 1, 'Dosas, Chole Bhature, & Samosas'),
    ('continental', 'Burgers & Pasta', 2, 'Burgers, pasta, and fries'),
    ('asian', 'Noodles & Momos', 3, 'Momos and wok noodles'),
    ('beverages', 'Drinks & Chai', 4, 'Chai, coffee, and boba')
ON CONFLICT (id) DO NOTHING;

-- Menu Items
INSERT INTO menu_items (id, category_id, station_id, name, description, price, preparation_time_minutes, is_available, image_url, dietary, is_popular, chef_pick, fast_prep, fast_prep_badge, portion_note, spice_level, alternative_item_ids)
VALUES
    (
        'item-masala-dosa', 'indian', 'hot-kitchen', 'Crispy Butter Masala Dosa',
        'Golden fermented crepe smeared with pure ghee, filled with spiced potato masala, served with Madras sambar & coconut chutney.',
        90, 8, true, 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=600&q=80',
        'PURE_VEG', true, true, false, null, 'Served with Madras sambar & fresh coconut chutney', 'Medium',
        ARRAY['item-bombay-sandwich', 'item-samosa']
    ),
    (
        'item-chole-bhature', 'indian', 'hot-kitchen', 'Amritsari Chole Bhature (2 pcs)',
        'Rich dark chickpea gravy simmered with roasted anardana and ground spices, served with two giant puffed bhaturas and pickled carrots.',
        110, 11, true, 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&w=600&q=80',
        'PURE_VEG', true, false, false, null, '2 hot bhaturas with house pickled chillies & onions', 'Fiery',
        ARRAY['item-bombay-sandwich', 'item-samosa', 'item-steamed-momos']
    ),
    (
        'item-bombay-sandwich', 'indian', 'quick-bites', 'Bombay Masala Grill Sandwich',
        'Crisp layered sandwich with spicy potato masala, beets, onions, mint chutney and melted cheese grilled golden with Amul butter.',
        70, 5, true, 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=600&q=80',
        'PURE_VEG', true, false, true, '⚡ 5 min Express', 'Includes mint-coriander dip & nylon sev garnish', 'Medium',
        ARRAY['item-samosa', 'item-steamed-momos']
    ),
    (
        'item-samosa', 'indian', 'fryer', 'Garam Aloo Samosas (2 pcs with Chutneys)',
        'Flaky golden triangular pastries stuffed with spiced potatoes and peas, served with sweet tamarind saunth and fresh mint chutney.',
        40, 3, true, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80',
        'PURE_VEG', true, false, true, '⚡ 3 min Flash', 'Served with sweet tamarind & spicy pudina chutney', 'Medium',
        ARRAY['item-bombay-sandwich']
    ),
    (
        'item-paneer-roll', 'indian', 'quick-bites', 'Tawa Paneer Tikka Kathi Roll',
        'Tawa-tossed paneer cubes marinated in roasted cumin and tandoori spices, rolled in a flaky paratha with sliced lachha onions.',
        90, 6, true, 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=600&q=80',
        'PURE_VEG', false, false, false, null, 'Wrapped in foil with tangy lemon pickled onions', 'Medium',
        ARRAY['item-bombay-sandwich']
    ),
    (
        'item-smash-burger', 'continental', 'hot-kitchen', 'Artisan Veggie Smash Burger',
        'Crispy herb-crusted patty, melted cheddar slice, crunchy lettuce, caramelised onions, and tangy burger sauce in a toasted brioche bun.',
        120, 8, true, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
        'VEG', true, true, false, null, 'Served with house gherkin relish & potato wafers', 'Mild',
        ARRAY['item-bombay-sandwich', 'item-bbq-wrap']
    ),
    (
        'item-penne-alfredo', 'continental', 'hot-kitchen', 'Creamy Penne Alfredo with Herb Toast',
        'Al dente Italian penne tossed in a velvety parmesan and garlic cream sauce with sautéed mushrooms, served with garlic herb toast.',
        130, 10, true, 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?auto=format&fit=crop&w=600&q=80',
        'VEG', true, false, false, null, 'Served with 2 slices of crispy sourdough garlic toast', 'Mild',
        ARRAY['item-bombay-sandwich', 'item-steamed-momos']
    ),
    (
        'item-bbq-wrap', 'continental', 'quick-bites', 'Smoky BBQ Grilled Chicken / Paneer Wrap',
        'Tender grilled fillings tossed in smoky barbecue glaze, crisp garden greens, and house chipotle dressing in a grilled tortilla.',
        130, 6, true, 'https://images.unsplash.com/photo-1529042410759-befb1204b468?auto=format&fit=crop&w=600&q=80',
        'NON_VEG', false, false, false, null, 'Includes roasted garlic dip & crunchy slaw', 'Medium',
        ARRAY['item-paneer-roll', 'item-bombay-sandwich']
    ),
    (
        'item-truffle-fries', 'continental', 'fryer', 'Peri Peri & Herb Loaded Fries',
        'Golden double-cooked fries tossed in fiery peri-peri seasoning and oregano herbs, drizzled with garlic mayo.',
        80, 5, true, 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=600&q=80',
        'VEGAN', true, false, true, '⚡ 5 min Express', 'Generous sharing bowl with signature dipping sauce', 'Medium',
        ARRAY['item-samosa']
    ),
    (
        'item-steamed-momos', 'asian', 'quick-bites', 'Steamed Himalayan Dumplings (6 pcs)',
        'Delicate steamed dumplings stuffed with finely minced vegetables, scallions and ginger, served with fiery red sesame chilli dip.',
        80, 4, true, 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=600&q=80',
        'VEGAN', true, true, true, '⚡ 4 min Flash', 'Served with roasted sesame chilli sauce & mild broth', 'Fiery',
        ARRAY['item-samosa', 'item-bombay-sandwich']
    ),
    (
        'item-hakka-noodles', 'asian', 'hot-kitchen', 'Wok Street Hakka Noodles',
        'Wok-tossed wheat noodles with crisp shredded cabbage, carrots, bell peppers, dark soy and spicy chilli vinegar sauce.',
        95, 10, true, 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=600&q=80',
        'VEG', true, false, false, null, 'Tossed fresh over high flame with crunchy greens', 'Medium',
        ARRAY['item-steamed-momos', 'item-bombay-sandwich']
    ),
    (
        'item-chilli-fried-rice', 'asian', 'hot-kitchen', 'Asian Chilli Garlic Fried Rice',
        'Fragrant basmati rice tossed in a high-flame wok with spring onions, French beans, roasted garlic, and mild Asian soy seasonings.',
        105, 9, true, 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=600&q=80',
        'VEG', false, false, false, null, 'Finished with toasted garlic flakes and spring onions', 'Medium',
        ARRAY['item-steamed-momos', 'item-paneer-roll']
    ),
    (
        'item-kulhad-chai', 'beverages', 'drinks', 'Kulhad Adrak Elaichi Kadak Chai',
        'Classic slow-simmered tea brewed with crushed ginger and green cardamom pods, served in a traditional earthen clay kulhad.',
        25, 3, true, 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80',
        'BEVERAGE', true, false, true, '⚡ 3 min Flash', 'Poured steaming in an earthen clay kulhad', 'Sweet',
        ARRAY['item-filter-coffee']
    ),
    (
        'item-filter-coffee', 'beverages', 'drinks', 'Degree South Indian Filter Kaapi',
        'Rich dark chicory-coffee decoction frothed high in traditional brass dabarah and tumbler with boiled creamy milk.',
        35, 3, true, 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80',
        'BEVERAGE', true, true, true, '⚡ 3 min Flash', 'Frothed hot in a brass dabarah set', 'Sweet',
        ARRAY['item-kulhad-chai']
    ),
    (
        'item-boba-tea', 'beverages', 'drinks', 'Brown Sugar Pearl Boba Milk Tea',
        'Chilled Taiwanese black milk tea sweetened with rich caramelised brown sugar syrup and chewy tapioca boba pearls.',
        95, 3, true, 'https://images.unsplash.com/photo-1558857563-b37fe78a8732?auto=format&fit=crop&w=600&q=80',
        'BEVERAGE', true, false, true, '⚡ 3 min Flash', 'Served with jumbo straw & freshly cooked brown sugar pearls', 'Sweet',
        ARRAY['item-iced-frappe']
    ),
    (
        'item-iced-frappe', 'beverages', 'drinks', 'Iced Hazelnut Frappé with Ice Cream',
        'Thick, creamy blended espresso shaken with roasted hazelnut syrup, chilled milk, and crowned with a scoop of vanilla ice cream.',
        75, 4, true, 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=600&q=80',
        'BEVERAGE', false, false, true, '⚡ 4 min Flash', 'Capped with vanilla bean scoop & chocolate dust', 'Sweet',
        ARRAY['item-boba-tea']
    ),
    (
        'item-nimbu-shikanji', 'beverages', 'drinks', 'Delhi Masala Nimbu Shikanji',
        'Freshly squeezed lemon soda spiked with black salt, roasted cumin, mint leaves and crushed ice.',
        35, 3, true, 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80',
        'BEVERAGE', false, false, true, '⚡ 3 min Flash', 'Stirred with fresh mint, rock salt & lime wedge', 'Mild',
        ARRAY['item-kulhad-chai']
    )
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    preparation_time_minutes = EXCLUDED.preparation_time_minutes,
    is_available = EXCLUDED.is_available,
    image_url = EXCLUDED.image_url;

-- Initial Demo Orders
INSERT INTO orders (id, order_token, order_type, customer_name, customer_phone, table_number, subtotal, tax, total, requested_deadline, estimated_ready_time, status, is_walk_in, feasibility_snapshot)
VALUES
    ('ord-rl-021', 'RL-021', 'DINE_IN', 'Ananya Sharma', '+91 98112 34567', 'Table 4 (Galleria Courtyard)', 165, 8, 173, '13:15', '13:10', 'READY', false, 'FEASIBLE'),
    ('ord-rl-022', 'RL-022', 'TAKEAWAY', 'Rohan Verma', '+91 97234 56789', null, 200, 10, 210, '13:20', '13:18', 'PREPARING', false, 'FEASIBLE'),
    ('ord-rl-023', 'RL-023', 'DINE_IN', 'Priya Menon', '+91 94567 89012', 'Table 12 (Central Hall)', 175, 9, 184, '13:30', '13:22', 'ACCEPTED', false, 'FEASIBLE'),
    ('ord-rl-024', 'RL-024', 'TAKEAWAY', 'Walk-in Counter Guest', null, null, 110, 6, 116, '13:12', '13:11', 'PREPARING', true, 'FEASIBLE')
ON CONFLICT (id) DO NOTHING;

-- Order Line Items
INSERT INTO order_line_items (order_id, menu_item_id, name, price, quantity, preparation_time_minutes, station_id, notes)
VALUES
    ('ord-rl-021', 'item-bombay-sandwich', 'Bombay Masala Grill Sandwich', 70, 1, 5, 'quick-bites', 'Extra crisp grill'),
    ('ord-rl-021', 'item-boba-tea', 'Brown Sugar Pearl Boba Milk Tea', 95, 1, 3, 'drinks', 'Less sweet'),
    ('ord-rl-022', 'item-smash-burger', 'Artisan Veggie Smash Burger', 120, 1, 8, 'hot-kitchen', 'No onions'),
    ('ord-rl-022', 'item-truffle-fries', 'Peri Peri & Herb Loaded Fries', 80, 1, 5, 'fryer', 'Extra seasoning'),
    ('ord-rl-023', 'item-chole-bhature', 'Amritsari Chole Bhature (2 pcs)', 110, 1, 11, 'hot-kitchen', 'Extra pickles'),
    ('ord-rl-023', 'item-kulhad-chai', 'Kulhad Adrak Elaichi Kadak Chai', 25, 1, 3, 'drinks', null),
    ('ord-rl-024', 'item-chole-bhature', 'Amritsari Chole Bhature (2 pcs)', 110, 1, 11, 'hot-kitchen', 'To-go box')
ON CONFLICT DO NOTHING;
