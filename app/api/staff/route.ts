import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const role = searchParams.get('role');
  const all = searchParams.get('all');

  let query = supabaseAdmin
    .from('staff')
    .select('id, name, role, is_active, hire_date');

  if (all !== 'true') query = query.eq('is_active', 1);
  if (role) query = query.eq('role', role);
  query = query.order('name');

  const { data: staff } = await query;
  return NextResponse.json(staff);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { data: staff } = await supabaseAdmin.from('staff').insert({
    name: body.name, role: body.role, pin_code: body.pin_code,
    hire_date: body.hire_date || new Date().toISOString().split('T')[0],
  }).select('id, name, role, is_active, hire_date').single();

  return NextResponse.json(staff, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  await supabaseAdmin.from('staff').update({
    name: body.name, role: body.role, pin_code: body.pin_code,
    is_active: body.is_active ?? 1,
  }).eq('id', body.id);

  const { data: staff } = await supabaseAdmin
    .from('staff').select('id, name, role, is_active, hire_date').eq('id', body.id).single();

  return NextResponse.json(staff);
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = parseInt(searchParams.get('id') || '0');
  await supabaseAdmin.from('staff').delete().eq('id', id);
  return NextResponse.json({ success: true });
}
