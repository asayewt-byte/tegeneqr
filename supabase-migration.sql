-- Run this in Supabase SQL Editor to create the schema and enable Realtime

CREATE TABLE IF NOT EXISTS staff (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  username TEXT UNIQUE,
  password_hash TEXT,
  pin_code TEXT,
  is_active INTEGER DEFAULT 1,
  hire_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tables (
  id SERIAL PRIMARY KEY,
  table_number INTEGER UNIQUE NOT NULL,
  qr_token TEXT UNIQUE,
  is_active INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS menu_items (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  cost INTEGER DEFAULT 0,
  category TEXT,
  sub_category TEXT,
  description TEXT,
  image_url TEXT,
  is_available INTEGER DEFAULT 1,
  is_recommended INTEGER DEFAULT 0,
  preparation_time INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  table_id INTEGER REFERENCES tables(id),
  cashier_id INTEGER REFERENCES staff(id),
  waiter_id INTEGER REFERENCES staff(id),
  status TEXT DEFAULT 'pending',
  total_amount INTEGER NOT NULL,
  discount_amount INTEGER DEFAULT 0,
  tax_amount INTEGER DEFAULT 0,
  final_amount INTEGER NOT NULL,
  notes TEXT,
  cancellation_reason TEXT,
  cancelled_by INTEGER REFERENCES staff(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  prepared_at TIMESTAMPTZ,
  served_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id INTEGER REFERENCES menu_items(id),
  quantity INTEGER NOT NULL,
  unit_price INTEGER NOT NULL,
  subtotal INTEGER NOT NULL,
  special_request TEXT,
  is_cancelled INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS cancellation_reasons (
  id SERIAL PRIMARY KEY,
  reason TEXT NOT NULL,
  category TEXT
);

CREATE TABLE IF NOT EXISTS cashier_sessions (
  id SERIAL PRIMARY KEY,
  cashier_id INTEGER REFERENCES staff(id),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  starting_cash INTEGER DEFAULT 0,
  ending_cash INTEGER,
  total_sales INTEGER DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  total_cancellations INTEGER DEFAULT 0,
  is_open INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS daily_sales_summary (
  id SERIAL PRIMARY KEY,
  date TEXT UNIQUE,
  total_orders INTEGER DEFAULT 0,
  total_revenue INTEGER DEFAULT 0,
  total_cancellations INTEGER DEFAULT 0,
  cancelled_revenue INTEGER DEFAULT 0,
  total_discounts INTEGER DEFAULT 0,
  total_tax INTEGER DEFAULT 0,
  net_revenue INTEGER DEFAULT 0,
  total_cost INTEGER DEFAULT 0,
  gross_profit INTEGER DEFAULT 0,
  avg_order_value INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS qr_scans (
  id SERIAL PRIMARY KEY,
  table_id INTEGER REFERENCES tables(id),
  qr_token TEXT,
  scanned_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT
);

-- Seed data (run only if tables are empty)
INSERT INTO cancellation_reasons (reason, category)
SELECT * FROM (VALUES
  ('Customer changed mind', 'customer'),
  ('Order placed by mistake', 'customer'),
  ('Item unavailable', 'kitchen'),
  ('Preparation too slow', 'kitchen'),
  ('Wrong item ordered', 'customer'),
  ('Menu item discontinued', 'restaurant'),
  ('Duplicate order', 'system'),
  ('Customer left before service', 'customer'),
  ('Quality issue reported', 'kitchen'),
  ('Dietary restriction not met', 'customer')
) AS v(reason, category)
WHERE NOT EXISTS (SELECT 1 FROM cancellation_reasons);

INSERT INTO staff (name, role, pin_code, hire_date)
SELECT * FROM (VALUES
  ('Admin User', 'admin', '1234', '2024-01-01'::date),
  ('Tigist Haile', 'cashier', '5678', '2024-02-15'::date),
  ('Biruk Tadese', 'cashier', '9012', '2024-03-01'::date),
  ('Bekele Worku', 'waiter', '1111', '2024-01-20'::date),
  ('Almaz Kebede', 'waiter', '2222', '2024-02-01'::date),
  ('Yonas Desta', 'waiter', '3333', '2024-03-15'::date),
  ('Genet Assefa', 'waiter', '4444', '2024-04-01'::date)
) AS v(name, role, pin_code, hire_date)
WHERE NOT EXISTS (SELECT 1 FROM staff);

INSERT INTO menu_items (name, price, cost, category, sub_category, description, preparation_time)
SELECT * FROM (VALUES
  ('Doro Wat', 350, 120, 'Main Course', 'Chicken', 'Spicy chicken stew with berbere spice, served with injera', 25),
  ('Kitfo', 280, 140, 'Main Course', 'Beef', 'Minced raw beef seasoned with mitmita and niter kibbeh', 15),
  ('Tibs', 250, 100, 'Main Course', 'Beef', 'Sautéed beef with onions, peppers, and rosemary', 20),
  ('Shiro', 150, 35, 'Vegan', 'Stew', 'Slow-cooked chickpea stew with berbere spices', 15),
  ('Misir Wot', 130, 30, 'Vegan', 'Stew', 'Red lentil stew flavored with berbere', 20),
  ('Gomen', 120, 25, 'Vegan', 'Side', 'Sautéed collard greens with garlic and ginger', 15),
  ('Injera', 50, 10, 'Sides', 'Bread', 'Traditional spongy sourdough flatbread', 5),
  ('Ayib', 80, 25, 'Sides', 'Dairy', 'Fresh homemade cottage cheese', 5),
  ('Ethiopian Coffee', 60, 15, 'Beverages', 'Hot', 'Traditional coffee ceremony style with popcorn', 10),
  ('Spiced Tea', 40, 8, 'Beverages', 'Hot', 'Tea brewed with cinnamon, cloves, and cardamom', 5),
  ('Fruit Juice', 70, 20, 'Beverages', 'Cold', 'Fresh mango or papaya juice', 5),
  ('Yebeg Alicha', 260, 110, 'Main Course', 'Lamb', 'Mild lamb stew with turmeric and potatoes', 30),
  ('Firfir', 160, 45, 'Breakfast', 'Bread', 'Shredded injera stir-fried with berbere and niter kibbeh', 10),
  ('Ful Medames', 120, 30, 'Breakfast', 'Stew', 'Fava beans with olive oil, tomatoes, and herbs', 10),
  ('Spris', 300, 130, 'Main Course', 'Mixed', 'Mixed meat platter with assortment of wat and tibs', 35)
) AS v(name, price, cost, category, sub_category, description, preparation_time)
WHERE NOT EXISTS (SELECT 1 FROM menu_items);

INSERT INTO tables (table_number, qr_token)
SELECT * FROM (VALUES
  (1, 'x7k9m2p4'), (2, 'z3v8n1q5'), (3, 't6r2b4w9'), (4, 'h5j8l1m3'), (5, 'p2q4r6s8'),
  (6, 'a1b3c5d7'), (7, 'e9f2g4h6'), (8, 'i8j1k3l5'), (9, 'm7n9p2q4'), (10, 'r6s8t1v3')
) AS v(table_number, qr_token)
WHERE NOT EXISTS (SELECT 1 FROM tables);

-- Enable Realtime for all tracked tables (safe to re-run)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'orders') THEN ALTER PUBLICATION supabase_realtime ADD TABLE orders; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'order_items') THEN ALTER PUBLICATION supabase_realtime ADD TABLE order_items; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'menu_items') THEN ALTER PUBLICATION supabase_realtime ADD TABLE menu_items; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'staff') THEN ALTER PUBLICATION supabase_realtime ADD TABLE staff; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'tables') THEN ALTER PUBLICATION supabase_realtime ADD TABLE tables; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'cashier_sessions') THEN ALTER PUBLICATION supabase_realtime ADD TABLE cashier_sessions; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'daily_sales_summary') THEN ALTER PUBLICATION supabase_realtime ADD TABLE daily_sales_summary; END IF;
END;
$$;
