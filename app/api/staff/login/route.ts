import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const db = getDb();
  const { pin_code, role } = body;

  let query = 'SELECT id, name, role, is_active FROM staff WHERE pin_code = ? AND is_active = 1';
  const params: any[] = [pin_code];
  if (role) { query += ' AND role = ?'; params.push(role); }

  const staff = db.prepare(query).get(...params) as any;
  if (!staff) {
    return NextResponse.json({ error: 'Invalid PIN or unauthorized role' }, { status: 401 });
  }
  return NextResponse.json(staff);
}
