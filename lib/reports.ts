import { supabaseAdmin } from './supabase';

export async function generateDailySummary(date?: string) {
  const today = date || new Date().toISOString().split('T')[0];
  const dayStart = `${today} 00:00:00`;
  const dayEnd = `${today} 23:59:59`;

  const { data: orders } = await supabaseAdmin
    .from('orders')
    .select('id, final_amount, discount_amount, tax_amount, total_amount, status')
    .gte('created_at', dayStart)
    .lte('created_at', dayEnd);

  const activeOrders = (orders || []).filter((o) => o.status !== 'cancelled');
  const cancelledOrders = (orders || []).filter((o) => o.status === 'cancelled');

  const totalOrders = activeOrders.length;
  const totalRevenue = activeOrders.reduce((s, o) => s + (o.final_amount || 0), 0);
  const totalDiscounts = activeOrders.reduce((s, o) => s + (o.discount_amount || 0), 0);
  const totalTax = activeOrders.reduce((s, o) => s + (o.tax_amount || 0), 0);
  const cancelledCount = cancelledOrders.length;
  const cancelledRevenue = cancelledOrders.reduce((s, o) => s + (o.total_amount || 0), 0);
  const netRevenue = totalRevenue - totalDiscounts;

  const { data: costs } = await supabaseAdmin
    .from('order_items')
    .select('quantity, order_id, menu_items!order_items_menu_item_id_fkey(cost)')
    .in('order_id', activeOrders.map((o: any) => o.id).filter(Boolean));

  const totalCost = (costs || []).reduce((s, item: any) => {
    const mi = Array.isArray(item.menu_items) ? item.menu_items[0] : item.menu_items;
    return s + ((mi?.cost || 0) * item.quantity);
  }, 0);
  const grossProfit = netRevenue - totalCost;
  const avgOrderValue = totalOrders > 0 ? Math.round(netRevenue / totalOrders) : 0;

  const summary = {
    date: today, total_orders: totalOrders, total_revenue: totalRevenue,
    total_cancellations: cancelledCount, cancelled_revenue: cancelledRevenue,
    total_discounts: totalDiscounts, total_tax: totalTax, net_revenue: netRevenue,
    total_cost: totalCost, gross_profit: grossProfit, avg_order_value: avgOrderValue,
  };

  const { data: existing } = await supabaseAdmin
    .from('daily_sales_summary').select('id').eq('date', today).maybeSingle();

  if (existing) {
    await supabaseAdmin.from('daily_sales_summary').update(summary).eq('id', existing.id);
  } else {
    await supabaseAdmin.from('daily_sales_summary').insert(summary);
  }

  return summary;
}

export async function getRecentDailySummaries(limit = 30) {
  const { data } = await supabaseAdmin
    .from('daily_sales_summary').select('*').order('date', { ascending: false }).limit(limit);
  return data || [];
}

export async function getPopularProducts(limit = 10) {
  const { data: items } = await supabaseAdmin
    .from('order_items')
    .select('menu_item_id, quantity, subtotal, order_id, is_cancelled, menu_items!order_items_menu_item_id_fkey(id, name, category, price, cost), orders!order_items_order_id_fkey(status)')
    .not('orders', 'eq', null);

  const filtered = (items || []).filter((i: any) => i.orders?.status !== 'cancelled' && !i.is_cancelled);
  const grouped: Record<number, any> = {};
  for (const item of filtered) {
    const mi = Array.isArray(item.menu_items) ? item.menu_items[0] : item.menu_items;
    if (!mi) continue;
    if (!grouped[mi.id]) {
      grouped[mi.id] = { id: mi.id, name: mi.name, category: mi.category, price: mi.price, cost: mi.cost, total_sold: 0, total_revenue: 0, total_cost: 0, total_profit: 0, order_count: 0, order_ids: new Set() };
    }
    grouped[mi.id].total_sold += item.quantity;
    grouped[mi.id].total_revenue += item.subtotal;
    grouped[mi.id].total_cost += mi.cost * item.quantity;
    grouped[mi.id].total_profit += item.subtotal - (mi.cost * item.quantity);
    grouped[mi.id].order_ids.add(item.order_id);
  }

  return Object.values(grouped)
    .map((g: any) => ({ ...g, order_count: g.order_ids.size, delete: { order_ids: undefined } }))
    .sort((a: any, b: any) => b.total_sold - a.total_sold)
    .slice(0, limit);
}

export async function getCashierPerformance(days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceStr = since.toISOString();

  const { data: staff } = await supabaseAdmin
    .from('staff')
    .select('id, name, orders!orders_cashier_id_fkey(id, final_amount, status, created_at, cashier_sessions!cashier_sessions_cashier_id_fkey(total_sales))')
    .in('role', ['cashier', 'admin'])
    .gte('orders.created_at', sinceStr);

  const grouped: Record<number, any> = {};
  for (const s of staff || []) {
    if (!grouped[s.id]) grouped[s.id] = { id: s.id, name: s.name, orders_processed: 0, total_sales: 0, cancellations: 0, cancelled_amount: 0, sessions_count: 0, avg_sales_per_session: 0 };
    // Supabase returns nested objects; we aggregate in JS
  }

  // Simpler: use raw counts approach
  const { data: staffList } = await supabaseAdmin
    .from('staff')
    .select('id, name')
    .in('role', ['cashier', 'admin']);

  const result = [];
  for (const s of staffList || []) {
    const { count: ordersProcessed } = await supabaseAdmin
      .from('orders').select('*', { count: 'exact', head: true })
      .eq('cashier_id', s.id)
      .gte('created_at', sinceStr);

    const { data: salesData } = await supabaseAdmin
      .from('orders')
      .select('final_amount, status')
      .eq('cashier_id', s.id)
      .gte('created_at', sinceStr)
      .neq('status', 'cancelled');

    const { count: cancellations } = await supabaseAdmin
      .from('orders').select('*', { count: 'exact', head: true })
      .eq('cashier_id', s.id)
      .eq('status', 'cancelled')
      .gte('created_at', sinceStr);

    const { data: cancelledData } = await supabaseAdmin
      .from('orders').select('total_amount')
      .eq('cashier_id', s.id)
      .eq('status', 'cancelled')
      .gte('created_at', sinceStr);

    const totalSales = (salesData || []).reduce((sum, o) => sum + (o.final_amount || 0), 0);
    const cancelledAmount = (cancelledData || []).reduce((sum, o) => sum + (o.total_amount || 0), 0);

    const { count: sessionsCount } = await supabaseAdmin
      .from('cashier_sessions').select('*', { count: 'exact', head: true })
      .eq('cashier_id', s.id)
      .gte('started_at', sinceStr);

    result.push({
      id: s.id, name: s.name, orders_processed: ordersProcessed || 0, total_sales: totalSales,
      cancellations: cancellations || 0, cancelled_amount: cancelledAmount,
      sessions_count: sessionsCount || 0,
      avg_sales_per_session: sessionsCount ? Math.round(totalSales / sessionsCount) : 0,
    });
  }

  return result.sort((a, b) => b.total_sales - a.total_sales);
}

export async function getCancellationAnalytics(days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceStr = since.toISOString();

  const { count: totalCancelled } = await supabaseAdmin
    .from('orders').select('*', { count: 'exact', head: true })
    .eq('status', 'cancelled')
    .gte('created_at', sinceStr);

  const { data: byReason } = await supabaseAdmin
    .from('orders')
    .select('cancellation_reason')
    .eq('status', 'cancelled')
    .gte('created_at', sinceStr)
    .not('cancellation_reason', 'is', null);

  const reasonCounts: Record<string, number> = {};
  for (const o of byReason || []) {
    reasonCounts[o.cancellation_reason] = (reasonCounts[o.cancellation_reason] || 0) + 1;
  }

  const { data: reasonsMeta } = await supabaseAdmin
    .from('cancellation_reasons').select('reason, category');

  const reasonMap: Record<string, string> = {};
  for (const r of reasonsMeta || []) reasonMap[r.reason] = r.category;

  const byReasonResult = Object.entries(reasonCounts).map(([reason, count]) => ({
    reason, category: reasonMap[reason] || null, count,
    percentage: totalCancelled ? (count / totalCancelled) * 100 : 0,
  })).sort((a, b) => b.count - a.count);

  const { data: byDay } = await supabaseAdmin
    .from('orders')
    .select('created_at, total_amount')
    .eq('status', 'cancelled')
    .gte('created_at', sinceStr)
    .order('created_at', { ascending: false });

  const dayGroups: Record<string, { count: number; revenue_lost: number }> = {};
  for (const o of byDay || []) {
    const d = o.created_at?.split('T')[0] || '';
    if (!dayGroups[d]) dayGroups[d] = { count: 0, revenue_lost: 0 };
    dayGroups[d].count++;
    dayGroups[d].revenue_lost += o.total_amount || 0;
  }

  return {
    by_reason: byReasonResult,
    by_day: Object.entries(dayGroups).map(([date, data]) => ({ date, ...data })),
  };
}

export async function getHourlyOrderDistribution(days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceStr = since.toISOString();

  const { data: orders } = await supabaseAdmin
    .from('orders')
    .select('created_at, final_amount')
    .gte('created_at', sinceStr)
    .neq('status', 'cancelled');

  const byHour: Record<number, { orders: number; revenue: number }> = {};
  for (const o of orders || []) {
    const hour = new Date(o.created_at).getHours();
    if (!byHour[hour]) byHour[hour] = { orders: 0, revenue: 0 };
    byHour[hour].orders++;
    byHour[hour].revenue += o.final_amount || 0;
  }

  return Object.entries(byHour)
    .map(([hour, data]) => ({ hour: parseInt(hour), ...data }))
    .sort((a, b) => a.hour - b.hour);
}
