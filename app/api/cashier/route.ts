import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const db = getDb();

  const { order_id, action, cashier_id, waiter_id, cancellation_reason } = body;

  const updates: string[] = [];
  const values: any[] = [];

  switch (action) {
    case 'approve':
      updates.push('status = ?', 'cashier_id = ?', 'approved_at = CURRENT_TIMESTAMP');
      values.push('confirmed', cashier_id);
      break;
    case 'assign':
      updates.push('waiter_id = ?');
      values.push(waiter_id);
      break;
    case 'cancel':
      updates.push('status = ?', 'cancelled_at = CURRENT_TIMESTAMP', 'cancelled_by = ?', 'cancellation_reason = ?');
      values.push('cancelled', cashier_id, cancellation_reason);
      break;
    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  values.push(order_id);
  db.prepare(`UPDATE orders SET ${updates.join(', ')} WHERE id = ?`).run(...values);

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(order_id);
  return NextResponse.json(order);
}
