import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { emitMenuChanged } from '@/lib/socket';

export async function GET(request: NextRequest) {
  const db = getDb();
  const { searchParams } = new URL(request.url);
  const all = searchParams.get('all');

  let query = 'SELECT * FROM menu_items';
  if (all !== 'true') query += ' WHERE is_available = 1';
  query += ' ORDER BY category, name';

  const items = db.prepare(query).all();
  return NextResponse.json(items);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const db = getDb();
  const { name, price, cost, category, sub_category, description, image_url, is_available, is_recommended, preparation_time } = body;
  const result = db.prepare(`
    INSERT INTO menu_items (name, price, cost, category, sub_category, description, image_url, is_available, is_recommended, preparation_time)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(name, price, cost || 0, category, sub_category || null, description || null, image_url || null, is_available ?? 1, is_recommended ?? 0, preparation_time || 10);
  const item = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(result.lastInsertRowid);
  emitMenuChanged();
  return NextResponse.json(item, { status: 201 });
}
