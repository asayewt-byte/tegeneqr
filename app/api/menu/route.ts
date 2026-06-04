import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const all = searchParams.get('all');

  let query = supabaseAdmin.from('menu_items').select('*');
  if (all !== 'true') query = query.eq('is_available', 1);
  query = query.order('category').order('name');

  const { data: items } = await query;
  return NextResponse.json(items);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, price, cost, category, sub_category, description, image_url, is_available, is_recommended, preparation_time } = body;

  const { data: item } = await supabaseAdmin.from('menu_items').insert({
    name, price, cost: cost || 0, category, sub_category: sub_category || null,
    description: description || null, image_url: image_url || null,
    is_available: is_available ?? 1, is_recommended: is_recommended ?? 0,
    preparation_time: preparation_time || 10,
  }).select().single();

  return NextResponse.json(item, { status: 201 });
}
