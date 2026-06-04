import { supabaseAdmin } from './supabase';
import { generateOrderNumber } from './auth';

export function getDb() {
  return supabaseAdmin;
}

function flattenItems(items: any[]) {
  return (items || []).map((i: any) => {
    const mi = Array.isArray(i.menu_items) ? i.menu_items[0] : i.menu_items;
    return { ...i, name: mi?.name, category: mi?.category, menu_items: undefined };
  });
}

function getNested<T>(val: T | T[] | null | undefined): T | null {
  if (!val) return null;
  return Array.isArray(val) ? val[0] : val;
}

export async function getOrderWithItems(orderId: number) {
  const { data: order, error } = await supabaseAdmin
    .from('orders')
    .select('*, tables!orders_table_id_fkey(table_number, qr_token)')
    .eq('id', orderId)
    .single();
  if (error || !order) return null;

  const { data: items } = await supabaseAdmin
    .from('order_items')
    .select('*, menu_items!order_items_menu_item_id_fkey(name, category)')
    .eq('order_id', orderId);

  const t = getNested(order.tables);
  const orderData: Record<string, any> = { ...order, items: flattenItems(items || []) };
  delete orderData.tables;
  return { ...orderData, table_number: t?.table_number, qr_token: t?.qr_token };
}

export async function getOrdersWithItems(params: {
  status?: string; waiter_id?: number; date?: string; limit?: number;
}) {
  let query = supabaseAdmin
    .from('orders')
    .select('*, tables!orders_table_id_fkey(table_number, qr_token)');
  if (params.status) query = query.eq('status', params.status);
  if (params.waiter_id) query = query.eq('waiter_id', params.waiter_id);
  if (params.date) query = query.gte('created_at', `${params.date} 00:00:00`).lte('created_at', `${params.date} 23:59:59`);
  query = query.order('created_at', { ascending: false });
  if (params.limit) query = query.limit(params.limit);

  const { data: orders } = await query;
  if (!orders) return [];

  const result: any[] = [];
  for (const o of orders) {
    const { data: items } = await supabaseAdmin
      .from('order_items')
      .select('*, menu_items!order_items_menu_item_id_fkey(name, category)')
      .eq('order_id', o.id);
    const t = getNested(o.tables);
    const entry: Record<string, any> = { ...o, table_number: t?.table_number, qr_token: t?.qr_token, items: flattenItems(items || []) };
    delete entry.tables;
    result.push(entry);
  }
  return result;
}

export async function createOrder(table_id: number | null, items: any[], notes: string | null) {
  const orderNumber = generateOrderNumber();
  let totalAmount = 0;
  for (const item of items) totalAmount += item.unit_price * item.quantity;

  const { data: order } = await supabaseAdmin
    .from('orders')
    .insert({ order_number: orderNumber, table_id, status: 'pending', total_amount: totalAmount, final_amount: totalAmount, notes })
    .select()
    .single();
  if (!order) return null;

  const orderItems = items.map((item: any) => ({
    order_id: order.id, menu_item_id: item.menu_item_id, quantity: item.quantity,
    unit_price: item.unit_price, subtotal: item.unit_price * item.quantity,
    special_request: item.special_request || null,
  }));
  await supabaseAdmin.from('order_items').insert(orderItems);

  return getOrderWithItems(order.id);
}

export async function updateOrder(id: number, fields: Record<string, any>) {
  const statusTimestamps: Record<string, string> = {
    approved: 'approved_at', confirmed: 'confirmed_at', preparing: 'prepared_at',
    ready: 'prepared_at', served: 'served_at', paid: 'paid_at', cancelled: 'cancelled_at',
  };

  const updateData: Record<string, any> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined) continue;
    if (key === 'status') {
      updateData.status = value;
      const tsField = statusTimestamps[value as string];
      if (tsField) updateData[tsField] = new Date().toISOString();
    } else if (key === 'discount_amount') {
      updateData.discount_amount = value;
      const { data: o } = await supabaseAdmin.from('orders').select('total_amount').eq('id', id).single();
      updateData.final_amount = (o?.total_amount || 0) - value;
    } else {
      updateData[key] = value;
    }
  }

  if (Object.keys(updateData).length > 0) {
    await supabaseAdmin.from('orders').update(updateData).eq('id', id);
  }

  return getOrderWithItems(id);
}
