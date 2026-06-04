import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { emitStaffChanged } from '@/lib/socket';

export async function GET(request: NextRequest) {
  const db = getDb();
  const { searchParams } = new URL(request.url);
  const role = searchParams.get('role');
  const all = searchParams.get('all');
  let query = 'SELECT id, name, role, is_active, hire_date FROM staff';
  if (all !== 'true') query += ' WHERE is_active = 1';
  const params: any[] = [];
  if (role) { query += all !== 'true' ? ' AND role = ?' : ' WHERE role = ?'; params.push(role); }
  query += ' ORDER BY name';
  const staff = db.prepare(query).all(...params);
  return NextResponse.json(staff);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const db = getDb();
  const result = db.prepare('INSERT INTO staff (name, role, pin_code, hire_date) VALUES (?, ?, ?, ?)').run(
    body.name, body.role, body.pin_code, body.hire_date || new Date().toISOString().split('T')[0]
  );
  const staff = db.prepare('SELECT id, name, role, is_active, hire_date FROM staff WHERE id = ?').get(result.lastInsertRowid);
  emitStaffChanged();
  return NextResponse.json(staff, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const db = getDb();
  db.prepare('UPDATE staff SET name=?, role=?, pin_code=?, is_active=? WHERE id=?').run(
    body.name, body.role, body.pin_code, body.is_active ?? 1, body.id
  );
  const staff = db.prepare('SELECT id, name, role, is_active, hire_date FROM staff WHERE id = ?').get(body.id);
  emitStaffChanged();
  return NextResponse.json(staff);
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = parseInt(searchParams.get('id') || '0');
  const db = getDb();
  db.prepare('DELETE FROM staff WHERE id = ?').run(id);
  emitStaffChanged();
  return NextResponse.json({ success: true });
}
