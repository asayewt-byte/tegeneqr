import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { generateOrderNumber } from '@/lib/auth';
import { emitNewOrder } from '@/lib/socket';

export async function GET(request: NextRequest) {
  const db = getDb();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const waiter_id = searchParams.get('waiter_id');
  const date = searchParams.get('date');
  const limit = searchParams.get('limit');

  let query = `
    SELECT o.*, t.table_number, t.qr_token,
      (SELECT json_group_array(json_object('id', oi.id, 'menu_item_id', oi.menu_item_id, 'name', mi.name, 'quantity', oi.quantity, 'unit_price', oi.unit_price, 'subtotal', oi.subtotal, 'special_request', oi.special_request, 'is_cancelled', oi.is_cancelled, 'category', mi.category))
       FROM order_items oi LEFT JOIN menu_items mi ON mi.id = oi.menu_item_id WHERE oi.order_id = o.id) as items
    FROM orders o LEFT JOIN tables t ON t.id = o.table_id WHERE 1=1
  `;
  const params: any[] = [];

  if (status) { query += ' AND o.status = ?'; params.push(status); }
  if (waiter_id) { query += ' AND o.waiter_id = ?'; params.push(parseInt(waiter_id)); }
  if (date) { query += ' AND date(o.created_at) = ?'; params.push(date); }

  query += ' ORDER BY o.created_at DESC';
  if (limit) { query += ' LIMIT ?'; params.push(parseInt(limit)); }

  const orders = db.prepare(query).all(...params);
  return NextResponse.json(orders);
}

export async function POST(request: NextRequest) {
  const db = getDb();
  const body = await request.json();
  const { table_id, items, notes } = body;

  const orderNumber = generateOrderNumber();
  let totalAmount = 0;
  for (const item of items) {
    totalAmount += item.unit_price * item.quantity;
  }

  const result = db.prepare(
    'INSERT INTO orders (order_number, table_id, status, total_amount, final_amount, notes) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(orderNumber, table_id, 'pending', totalAmount, totalAmount, notes || null);

  const orderId = result.lastInsertRowid;

  const insertItem = db.prepare(
    'INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, special_request) VALUES (?, ?, ?, ?, ?, ?)'
  );
  for (const item of items) {
    insertItem.run(orderId, item.menu_item_id, item.quantity, item.unit_price, item.unit_price * item.quantity, item.special_request || null);
  }

  const order = db.prepare(`
    SELECT o.*, t.table_number, t.qr_token,
      (SELECT json_group_array(json_object('id', oi.id, 'menu_item_id', oi.menu_item_id, 'name', mi.name, 'quantity', oi.quantity, 'unit_price', oi.unit_price, 'subtotal', oi.subtotal, 'special_request', oi.special_request, 'is_cancelled', oi.is_cancelled, 'category', mi.category))
       FROM order_items oi LEFT JOIN menu_items mi ON mi.id = oi.menu_item_id WHERE oi.order_id = o.id) as items
    FROM orders o LEFT JOIN tables t ON t.id = o.table_id WHERE o.id = ?
  `).get(orderId);

  emitNewOrder(order);

  return NextResponse.json(order, { status: 201 });
}
