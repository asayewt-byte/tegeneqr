import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  const db = getDb();
  const { searchParams } = new URL(request.url);
  const cashier_id = searchParams.get('cashier_id');

  let query = 'SELECT cs.*, s.name as cashier_name FROM cashier_sessions cs JOIN staff s ON s.id = cs.cashier_id';
  const params: any[] = [];
  if (cashier_id) { query += ' WHERE cs.cashier_id = ?'; params.push(parseInt(cashier_id)); }
  query += ' ORDER BY cs.started_at DESC';

  return NextResponse.json(db.prepare(query).all(...params));
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const db = getDb();
  const { cashier_id, starting_cash } = body;

  const existing = db.prepare('SELECT id FROM cashier_sessions WHERE cashier_id = ? AND is_open = 1').get(cashier_id) as any;
  if (existing) {
    return NextResponse.json({ error: 'Cashier already has an open session' }, { status: 400 });
  }

  const result = db.prepare('INSERT INTO cashier_sessions (cashier_id, starting_cash) VALUES (?, ?)').run(cashier_id, starting_cash || 0);
  const session = db.prepare('SELECT * FROM cashier_sessions WHERE id = ?').get(result.lastInsertRowid);
  return NextResponse.json(session, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const db = getDb();
  const { id, ending_cash } = body;

  const orders = db.prepare("SELECT COUNT(*) as count, COALESCE(SUM(final_amount), 0) as sales FROM orders WHERE cashier_id = (SELECT cashier_id FROM cashier_sessions WHERE id = ?) AND created_at >= (SELECT started_at FROM cashier_sessions WHERE id = ?) AND status != 'cancelled'").get(id, id) as any;
  const cancellations = db.prepare("SELECT COUNT(*) as count FROM orders WHERE cashier_id = (SELECT cashier_id FROM cashier_sessions WHERE id = ?) AND created_at >= (SELECT started_at FROM cashier_sessions WHERE id = ?) AND status = 'cancelled'").get(id, id) as any;

  db.prepare(`
    UPDATE cashier_sessions SET ended_at = CURRENT_TIMESTAMP, ending_cash = ?, total_sales = ?, total_orders = ?, total_cancellations = ?, is_open = 0 WHERE id = ?
  `).run(ending_cash ?? 0, orders.sales, orders.count, cancellations.count, id);

  const session = db.prepare('SELECT * FROM cashier_sessions WHERE id = ?').get(id);
  return NextResponse.json(session);
}
