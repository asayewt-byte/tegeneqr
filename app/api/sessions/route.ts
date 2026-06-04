import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const cashier_id = searchParams.get('cashier_id');

  let query = supabaseAdmin
    .from('cashier_sessions')
    .select('*, staff!cashier_sessions_cashier_id_fkey(name)')
    .order('started_at', { ascending: false });

  if (cashier_id) query = query.eq('cashier_id', parseInt(cashier_id));

  const { data: sessions } = await query;
  const result = (sessions || []).map((s: any) => {
    const staff = Array.isArray(s.staff) ? s.staff[0] : s.staff;
    return { ...s, cashier_name: staff?.name, staff: undefined };
  });

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { cashier_id, starting_cash } = body;

  // Close any existing open session for this cashier
  await supabaseAdmin
    .from('cashier_sessions')
    .update({ ended_at: new Date().toISOString(), is_open: 0 })
    .eq('cashier_id', cashier_id)
    .eq('is_open', 1);

  const { data: session } = await supabaseAdmin
    .from('cashier_sessions')
    .insert({ cashier_id, starting_cash: starting_cash || 0 })
    .select()
    .single();

  return NextResponse.json(session, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, ending_cash } = body;

  const { data: sessionInfo } = await supabaseAdmin
    .from('cashier_sessions')
    .select('cashier_id, started_at')
    .eq('id', id)
    .single();

  if (!sessionInfo) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  const sinceStr = sessionInfo.started_at;

  const { count: orderCount } = await supabaseAdmin
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('cashier_id', sessionInfo.cashier_id)
    .gte('created_at', sinceStr)
    .neq('status', 'cancelled');

  const { data: orderSales } = await supabaseAdmin
    .from('orders')
    .select('final_amount')
    .eq('cashier_id', sessionInfo.cashier_id)
    .gte('created_at', sinceStr)
    .neq('status', 'cancelled');

  const { count: cancellationCount } = await supabaseAdmin
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('cashier_id', sessionInfo.cashier_id)
    .gte('created_at', sinceStr)
    .eq('status', 'cancelled');

  const totalSales = (orderSales || []).reduce((sum, o) => sum + (o.final_amount || 0), 0);

  const { data: session } = await supabaseAdmin
    .from('cashier_sessions')
    .update({
      ended_at: new Date().toISOString(),
      ending_cash: ending_cash ?? 0,
      total_sales: totalSales,
      total_orders: orderCount || 0,
      total_cancellations: cancellationCount || 0,
      is_open: 0,
    })
    .eq('id', id)
    .select()
    .single();

  return NextResponse.json(session);
}
