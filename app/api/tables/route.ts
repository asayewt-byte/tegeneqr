import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { emitTablesChanged } from '@/lib/socket';

export async function GET() {
  const db = getDb();
  const tables = db.prepare('SELECT t.*, (SELECT COUNT(*) FROM orders o WHERE o.table_id = t.id AND o.status NOT IN (\'paid\', \'cancelled\')) as active_orders FROM tables t ORDER BY table_number').all();
  return NextResponse.json(tables);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const db = getDb();
  const token = uuidv4().replace(/-/g, '').substring(0, 8);
  const result = db.prepare('INSERT INTO tables (table_number, qr_token) VALUES (?, ?)').run(body.table_number, token);
  const table = db.prepare('SELECT * FROM tables WHERE id = ?').get(result.lastInsertRowid);
  emitTablesChanged();
  return NextResponse.json(table, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const db = getDb();
  db.prepare('UPDATE tables SET table_number=?, is_active=? WHERE id=?').run(body.table_number, body.is_active ?? 1, body.id);
  const table = db.prepare('SELECT * FROM tables WHERE id = ?').get(body.id);
  emitTablesChanged();
  return NextResponse.json(table);
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = parseInt(searchParams.get('id') || '0');
  const db = getDb();
  db.prepare('DELETE FROM tables WHERE id = ?').run(id);
  emitTablesChanged();
  return NextResponse.json({ success: true });
}
