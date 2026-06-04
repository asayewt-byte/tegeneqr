import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { emitOrderUpdate } from '@/lib/socket';
import { generateDailySummary } from '@/lib/reports';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  const body = await request.json();
  const db = getDb();

  const fields: string[] = [];
  const values: any[] = [];

  const statusTimestamps: Record<string, string> = {
    'approved': 'approved_at', 'confirmed': 'confirmed_at', 'preparing': 'prepared_at',
    'ready': 'prepared_at', 'served': 'served_at', 'paid': 'paid_at', 'cancelled': 'cancelled_at',
  };

  if (body.status) {
    fields.push('status = ?');
    values.push(body.status);
    const tsField = statusTimestamps[body.status];
    if (tsField) {
      fields.push(`${tsField} = CURRENT_TIMESTAMP`);
    }
  }
  if (body.waiter_id !== undefined) { fields.push('waiter_id = ?'); values.push(body.waiter_id); }
  if (body.cashier_id !== undefined) { fields.push('cashier_id = ?'); values.push(body.cashier_id); }
  if (body.notes !== undefined) { fields.push('notes = ?'); values.push(body.notes); }
  if (body.cancellation_reason !== undefined) { fields.push('cancellation_reason = ?'); values.push(body.cancellation_reason); }
  if (body.cancelled_by !== undefined) { fields.push('cancelled_by = ?'); values.push(body.cancelled_by); }
  if (body.discount_amount !== undefined) {
    fields.push('discount_amount = ?, final_amount = total_amount - ?');
    values.push(body.discount_amount, body.discount_amount);
  }

  if (fields.length > 0) {
    values.push(id);
    db.prepare(`UPDATE orders SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  }

  const order = db.prepare(`
    SELECT o.*, t.table_number, t.qr_token,
      (SELECT json_group_array(json_object('id', oi.id, 'menu_item_id', oi.menu_item_id, 'name', mi.name, 'quantity', oi.quantity, 'unit_price', oi.unit_price, 'subtotal', oi.subtotal, 'special_request', oi.special_request, 'is_cancelled', oi.is_cancelled, 'category', mi.category))
       FROM order_items oi LEFT JOIN menu_items mi ON mi.id = oi.menu_item_id WHERE oi.order_id = o.id) as items
    FROM orders o LEFT JOIN tables t ON t.id = o.table_id WHERE o.id = ?
  `).get(id);

  generateDailySummary();
  emitOrderUpdate(order);

  return NextResponse.json(order);
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const db = getDb();
  db.prepare('DELETE FROM order_items WHERE order_id = ?').run(parseInt(params.id));
  db.prepare('DELETE FROM orders WHERE id = ?').run(parseInt(params.id));
  return NextResponse.json({ success: true });
}
