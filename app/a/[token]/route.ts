import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(_request: NextRequest, { params }: { params: { token: string } }) {
  const db = getDb();
  const table = db.prepare('SELECT id, table_number FROM tables WHERE qr_token = ? AND is_active = 1').get(params.token) as any;

  if (!table) {
    return NextResponse.redirect(new URL('/', _request.url));
  }

  db.prepare('INSERT INTO qr_scans (table_id, qr_token, ip_address) VALUES (?, ?, ?)').run(
    table.id, params.token, _request.headers.get('x-forwarded-for') || _request.headers.get('x-real-ip') || 'unknown'
  );

  const response = NextResponse.redirect(new URL(`/menu/${params.token}`, _request.url));
  response.cookies.set('qr_session', params.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 4,
    path: '/',
  });

  return response;
}
