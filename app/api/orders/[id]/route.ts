import { NextRequest, NextResponse } from 'next/server';
import { updateOrder } from '@/lib/db';
import { supabaseAdmin } from '@/lib/supabase';
import { generateDailySummary } from '@/lib/reports';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();

  const order = await updateOrder(parseInt(id), body);
  if (order) {
    await generateDailySummary();
  }

  return NextResponse.json(order);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await supabaseAdmin.from('order_items').delete().eq('order_id', id);
  await supabaseAdmin.from('orders').delete().eq('id', id);
  return NextResponse.json({ success: true });
}
