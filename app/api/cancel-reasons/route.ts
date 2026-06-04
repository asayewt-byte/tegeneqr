import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const db = getDb();
  const reasons = db.prepare('SELECT * FROM cancellation_reasons ORDER BY category, reason').all();
  return NextResponse.json(reasons);
}
