import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  const { data: reasons } = await supabaseAdmin
    .from('cancellation_reasons')
    .select('*')
    .order('category')
    .order('reason');

  return NextResponse.json(reasons);
}
