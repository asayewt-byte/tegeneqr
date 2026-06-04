import { NextRequest, NextResponse } from 'next/server';
import { updateOrder } from '@/lib/db';
import { generateDailySummary } from '@/lib/reports';

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { order_id, action, cashier_id, waiter_id, cancellation_reason } = body;

  const fields: Record<string, any> = {};

  switch (action) {
    case 'approve':
      fields.status = 'confirmed';
      fields.cashier_id = cashier_id;
      break;
    case 'assign':
      fields.waiter_id = waiter_id;
      break;
    case 'cancel':
      fields.status = 'cancelled';
      fields.cancelled_by = cashier_id;
      fields.cancellation_reason = cancellation_reason;
      break;
    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  const order = await updateOrder(order_id, fields);
  if (order) await generateDailySummary();
  return NextResponse.json(order);
}
