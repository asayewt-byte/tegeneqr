import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { emitMenuChanged } from '@/lib/socket';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  const body = await request.json();
  const db = getDb();
  db.prepare(`
    UPDATE menu_items SET name=?, price=?, cost=?, category=?, sub_category=?, description=?, image_url=?, is_available=?, is_recommended=?, preparation_time=?
    WHERE id=?
  `).run(body.name, body.price, body.cost ?? 0, body.category, body.sub_category || null, body.description || null, body.image_url || null, body.is_available ?? 1, body.is_recommended ?? 0, body.preparation_time || 10, id);
  const item = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(id);
  emitMenuChanged();
  return NextResponse.json(item);
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  const db = getDb();
  db.prepare('DELETE FROM menu_items WHERE id = ?').run(id);
  emitMenuChanged();
  return NextResponse.json({ success: true });
}
