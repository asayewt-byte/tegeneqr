import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { data: table } = await supabaseAdmin
    .from('tables')
    .select('id, table_number')
    .eq('qr_token', token)
    .eq('is_active', 1)
    .maybeSingle();

  if (!table) {
    return NextResponse.redirect(new URL('/', _request.url));
  }

  await supabaseAdmin.from('qr_scans').insert({
    table_id: table.id, qr_token: token,
    ip_address: _request.headers.get('x-forwarded-for') || _request.headers.get('x-real-ip') || 'unknown',
  });

  const response = NextResponse.redirect(new URL(`/menu/${token}`, _request.url));
  response.cookies.set('qr_session', token, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict', maxAge: 60 * 60 * 4, path: '/',
  });

  return response;
}
