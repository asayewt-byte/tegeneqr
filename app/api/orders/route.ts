import { NextRequest, NextResponse } from 'next/server';
import { getOrdersWithItems, createOrder } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || undefined;
  const waiter_id = searchParams.get('waiter_id') ? parseInt(searchParams.get('waiter_id')!) : undefined;
  const date = searchParams.get('date') || undefined;
  const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;

  const orders = await getOrdersWithItems({ status, waiter_id, date, limit });
  return NextResponse.json(orders);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { table_id, items, notes } = body;

  const order = await createOrder(table_id, items, notes || null);
  return NextResponse.json(order, { status: 201 });
}
