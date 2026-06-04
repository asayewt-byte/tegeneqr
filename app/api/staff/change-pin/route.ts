import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { id, current_pin, new_pin } = body;

  if (!id || !current_pin || !new_pin) {
    return NextResponse.json({ error: 'id, current_pin, and new_pin are required' }, { status: 400 });
  }

  if (new_pin.length < 4 || new_pin.length > 10) {
    return NextResponse.json({ error: 'PIN must be 4-10 characters' }, { status: 400 });
  }

  const { data: staff } = await supabaseAdmin
    .from('staff')
    .select('id, pin_code')
    .eq('id', id)
    .single();

  if (!staff) {
    return NextResponse.json({ error: 'Staff not found' }, { status: 404 });
  }

  if (staff.pin_code !== current_pin) {
    return NextResponse.json({ error: 'Current PIN is incorrect' }, { status: 401 });
  }

  await supabaseAdmin
    .from('staff')
    .update({ pin_code: new_pin })
    .eq('id', id);

  return NextResponse.json({ success: true });
}
