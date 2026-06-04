import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { pin_code, role } = body;

  let query = supabaseAdmin
    .from('staff')
    .select('id, name, role, is_active')
    .eq('pin_code', pin_code)
    .eq('is_active', 1);

  if (role) query = query.eq('role', role);

  const { data: staff } = await query.maybeSingle();

  if (!staff) {
    return NextResponse.json({ error: 'Invalid PIN or unauthorized role' }, { status: 401 });
  }

  return NextResponse.json(staff);
}
