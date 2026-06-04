import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const DB_PATH = path.join(process.cwd(), 'data', 'qrmenu.db');

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema(db);
    seedIfEmpty(db);
  }
  return db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS tables (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_number INTEGER UNIQUE NOT NULL,
      qr_token TEXT UNIQUE,
      is_active INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS menu_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
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
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT UNIQUE NOT NULL,
      table_id INTEGER,
      cashier_id INTEGER,
      waiter_id INTEGER,
      status TEXT DEFAULT 'pending',
      total_amount INTEGER NOT NULL,
      discount_amount INTEGER DEFAULT 0,
      tax_amount INTEGER DEFAULT 0,
      final_amount INTEGER NOT NULL,
      notes TEXT,
      cancellation_reason TEXT,
      cancelled_by INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      approved_at TIMESTAMP,
      confirmed_at TIMESTAMP,
      prepared_at TIMESTAMP,
      served_at TIMESTAMP,
      cancelled_at TIMESTAMP,
      paid_at TIMESTAMP,
      FOREIGN KEY (table_id) REFERENCES tables(id),
      FOREIGN KEY (cashier_id) REFERENCES staff(id),
      FOREIGN KEY (waiter_id) REFERENCES staff(id)
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER,
      menu_item_id INTEGER,
      quantity INTEGER NOT NULL,
      unit_price INTEGER NOT NULL,
      subtotal INTEGER NOT NULL,
      special_request TEXT,
      is_cancelled INTEGER DEFAULT 0,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
    );

    CREATE TABLE IF NOT EXISTS staff (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      username TEXT UNIQUE,
      password_hash TEXT,
      pin_code TEXT,
      is_active INTEGER DEFAULT 1,
      hire_date DATE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS cancellation_reasons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reason TEXT NOT NULL,
      category TEXT
    );

    CREATE TABLE IF NOT EXISTS cashier_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cashier_id INTEGER,
      started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      ended_at TIMESTAMP,
      starting_cash INTEGER DEFAULT 0,
      ending_cash INTEGER,
      total_sales INTEGER DEFAULT 0,
      total_orders INTEGER DEFAULT 0,
      total_cancellations INTEGER DEFAULT 0,
      is_open INTEGER DEFAULT 1,
      FOREIGN KEY (cashier_id) REFERENCES staff(id)
    );

    CREATE TABLE IF NOT EXISTS daily_sales_summary (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
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
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS qr_scans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_id INTEGER,
      qr_token TEXT,
      scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      ip_address TEXT,
      FOREIGN KEY (table_id) REFERENCES tables(id)
    );
  `);
}

function seedIfEmpty(db: Database.Database) {
  const count = db.prepare('SELECT COUNT(*) as c FROM menu_items').get() as { c: number };
  if (count.c > 0) return;

  db.prepare(`INSERT INTO cancellation_reasons (reason, category) VALUES
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
  `).run();

  const menuItems = [
    { name: 'Doro Wat', price: 350, cost: 120, cat: 'Main Course', sub: 'Chicken', desc: 'Spicy chicken stew with berbere spice, served with injera', prep: 25 },
    { name: 'Kitfo', price: 280, cost: 140, cat: 'Main Course', sub: 'Beef', desc: 'Minced raw beef seasoned with mitmita and niter kibbeh', prep: 15 },
    { name: 'Tibs', price: 250, cost: 100, cat: 'Main Course', sub: 'Beef', desc: 'Sautéed beef with onions, peppers, and rosemary', prep: 20 },
    { name: 'Shiro', price: 150, cost: 35, cat: 'Vegan', sub: 'Stew', desc: 'Slow-cooked chickpea stew with berbere spices', prep: 15 },
    { name: 'Misir Wot', price: 130, cost: 30, cat: 'Vegan', sub: 'Stew', desc: 'Red lentil stew flavored with berbere', prep: 20 },
    { name: 'Gomen', price: 120, cost: 25, cat: 'Vegan', sub: 'Side', desc: 'Sautéed collard greens with garlic and ginger', prep: 15 },
    { name: 'Injera', price: 50, cost: 10, cat: 'Sides', sub: 'Bread', desc: 'Traditional spongy sourdough flatbread', prep: 5 },
    { name: 'Ayib', price: 80, cost: 25, cat: 'Sides', sub: 'Dairy', desc: 'Fresh homemade cottage cheese', prep: 5 },
    { name: 'Ethiopian Coffee', price: 60, cost: 15, cat: 'Beverages', sub: 'Hot', desc: 'Traditional coffee ceremony style with popcorn', prep: 10 },
    { name: 'Spiced Tea', price: 40, cost: 8, cat: 'Beverages', sub: 'Hot', desc: 'Tea brewed with cinnamon, cloves, and cardamom', prep: 5 },
    { name: 'Fruit Juice', price: 70, cost: 20, cat: 'Beverages', sub: 'Cold', desc: 'Fresh mango or papaya juice', prep: 5 },
    { name: 'Yebeg Alicha', price: 260, cost: 110, cat: 'Main Course', sub: 'Lamb', desc: 'Mild lamb stew with turmeric and potatoes', prep: 30 },
    { name: 'Firfir', price: 160, cost: 45, cat: 'Breakfast', sub: 'Bread', desc: 'Shredded injera stir-fried with berbere and niter kibbeh', prep: 10 },
    { name: 'Ful Medames', price: 120, cost: 30, cat: 'Breakfast', sub: 'Stew', desc: 'Fava beans with olive oil, tomatoes, and herbs', prep: 10 },
    { name: 'Spris', price: 300, cost: 130, cat: 'Main Course', sub: 'Mixed', desc: 'Mixed meat platter with assortment of wat and tibs', prep: 35 },
  ];

  const insert = db.prepare('INSERT INTO menu_items (name, price, cost, category, sub_category, description, preparation_time) VALUES (?, ?, ?, ?, ?, ?, ?)');
  for (const item of menuItems) {
    insert.run(item.name, item.price, item.cost, item.cat, item.sub, item.desc, item.prep);
  }

  const staffInsert = db.prepare('INSERT INTO staff (name, role, pin_code, hire_date) VALUES (?, ?, ?, ?)');
  const staff = [
    ['Admin User', 'admin', '1234', '2024-01-01'],
    ['Tigist Haile', 'cashier', '5678', '2024-02-15'],
    ['Biruk Tadese', 'cashier', '9012', '2024-03-01'],
    ['Bekele Worku', 'waiter', '1111', '2024-01-20'],
    ['Almaz Kebede', 'waiter', '2222', '2024-02-01'],
    ['Yonas Desta', 'waiter', '3333', '2024-03-15'],
    ['Genet Assefa', 'waiter', '4444', '2024-04-01'],

  ];
  for (const s of staff) {
    staffInsert.run(s[0], s[1], s[2], s[3]);
  }

  const tableInsert = db.prepare('INSERT INTO tables (table_number, qr_token) VALUES (?, ?)');
  const tokens = [
    'x7k9m2p4', 'z3v8n1q5', 't6r2b4w9', 'h5j8l1m3', 'p2q4r6s8',
    'a1b3c5d7', 'e9f2g4h6', 'i8j1k3l5', 'm7n9p2q4', 'r6s8t1v3',
  ];
  for (let i = 0; i < 10; i++) {
    tableInsert.run(i + 1, tokens[i]);
  }
}
