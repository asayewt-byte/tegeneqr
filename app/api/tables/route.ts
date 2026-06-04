import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  const { data: tables } = await supabaseAdmin
    .from('tables')
    .select('*, orders!left(id, status)')
    .order('table_number');

  const result = (tables || []).map((t: any) => ({
    ...t,
    active_orders: (t.orders || []).filter((o: any) => !['paid', 'cancelled'].includes(o.status)).length,
    orders: undefined,
  }));

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const token = uuidv4().replace(/-/g, '').substring(0, 8);

  const { data: table } = await supabaseAdmin.from('tables').insert({
    table_number: body.table_number, qr_token: token,
  }).select().single();

  return NextResponse.json(table, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  await supabaseAdmin.from('tables').update({
    table_number: body.table_number, is_active: body.is_active ?? 1,
  }).eq('id', body.id);

  const { data: table } = await supabaseAdmin.from('tables').select('*').eq('id', body.id).single();
  return NextResponse.json(table);
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = parseInt(searchParams.get('id') || '0');
  await supabaseAdmin.from('tables').delete().eq('id', id);
  return NextResponse.json({ success: true });
}
