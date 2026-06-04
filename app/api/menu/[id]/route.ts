import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();

  await supabaseAdmin.from('menu_items').update({
    name: body.name, price: body.price, cost: body.cost ?? 0, category: body.category,
    sub_category: body.sub_category || null, description: body.description || null,
    image_url: body.image_url || null, is_available: body.is_available ?? 1,
    is_recommended: body.is_recommended ?? 0, preparation_time: body.preparation_time || 10,
  }).eq('id', id);

  const { data: item } = await supabaseAdmin.from('menu_items').select('*').eq('id', id).single();
  return NextResponse.json(item);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await supabaseAdmin.from('menu_items').delete().eq('id', id);
  return NextResponse.json({ success: true });
}
