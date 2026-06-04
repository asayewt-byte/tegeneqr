import { getDb } from './db';

export function generateDailySummary(date?: string) {
  const db = getDb();
  const today = date || new Date().toISOString().split('T')[0];

  const existing = db.prepare('SELECT id FROM daily_sales_summary WHERE date = ?').get(today) as any;

  const dayStart = `${today} 00:00:00`;
  const dayEnd = `${today} 23:59:59`;

  const orders = db.prepare(`
    SELECT COUNT(*) as count, COALESCE(SUM(final_amount), 0) as revenue,
           COALESCE(SUM(discount_amount), 0) as discounts, COALESCE(SUM(tax_amount), 0) as tax
    FROM orders WHERE date(created_at) = ? AND status != 'cancelled'
  `).get(today) as any;

  const cancelled = db.prepare(`
    SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as revenue
    FROM orders WHERE date(created_at) = ? AND status = 'cancelled'
  `).get(today) as any;

  const costs = db.prepare(`
    SELECT COALESCE(SUM(mi.cost * oi.quantity), 0) as total_cost
    FROM order_items oi
    JOIN menu_items mi ON mi.id = oi.menu_item_id
    JOIN orders o ON o.id = oi.order_id
    WHERE date(o.created_at) = ? AND o.status != 'cancelled'
  `).get(today) as any;

  const totalOrders = orders.count || 0;
  const totalRevenue = orders.revenue || 0;
  const totalDiscounts = orders.discounts || 0;
  const totalTax = orders.tax || 0;
  const cancelledCount = cancelled.count || 0;
  const cancelledRevenue = cancelled.revenue || 0;
  const netRevenue = totalRevenue - totalDiscounts;
  const totalCost = costs.total_cost || 0;
  const grossProfit = netRevenue - totalCost;
  const avgOrderValue = totalOrders > 0 ? Math.round(netRevenue / totalOrders) : 0;

  const summary = {
    date: today,
    total_orders: totalOrders,
    total_revenue: totalRevenue,
    total_cancellations: cancelledCount,
    cancelled_revenue: cancelledRevenue,
    total_discounts: totalDiscounts,
    total_tax: totalTax,
    net_revenue: netRevenue,
    total_cost: totalCost,
    gross_profit: grossProfit,
    avg_order_value: avgOrderValue,
  };

  if (existing) {
    db.prepare(`
      UPDATE daily_sales_summary SET total_orders=?, total_revenue=?, total_cancellations=?,
        cancelled_revenue=?, total_discounts=?, total_tax=?, net_revenue=?, total_cost=?,
        gross_profit=?, avg_order_value=?, updated_at=CURRENT_TIMESTAMP WHERE date=?
    `).run(totalOrders, totalRevenue, cancelledCount, cancelledRevenue, totalDiscounts,
      totalTax, netRevenue, totalCost, grossProfit, avgOrderValue, today);
  } else {
    db.prepare(`
      INSERT INTO daily_sales_summary (date, total_orders, total_revenue, total_cancellations,
        cancelled_revenue, total_discounts, total_tax, net_revenue, total_cost, gross_profit, avg_order_value)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(today, totalOrders, totalRevenue, cancelledCount, cancelledRevenue, totalDiscounts,
      totalTax, netRevenue, totalCost, grossProfit, avgOrderValue);
  }

  return summary;
}

export function getPopularProducts(limit = 10) {
  const db = getDb();
  return db.prepare(`
    SELECT mi.id, mi.name, mi.category, mi.price, mi.cost,
           SUM(oi.quantity) as total_sold,
           SUM(oi.subtotal) as total_revenue,
           SUM(mi.cost * oi.quantity) as total_cost,
           (SUM(oi.subtotal) - SUM(mi.cost * oi.quantity)) as total_profit,
           COUNT(DISTINCT o.id) as order_count
    FROM order_items oi
    JOIN menu_items mi ON mi.id = oi.menu_item_id
    JOIN orders o ON o.id = oi.order_id
    WHERE o.status != 'cancelled' AND oi.is_cancelled = 0
    GROUP BY mi.id
    ORDER BY total_sold DESC
    LIMIT ?
  `).all(limit);
}

export function getCashierPerformance(days = 30) {
  const db = getDb();
  return db.prepare(`
    SELECT s.id, s.name,
           COUNT(o.id) as orders_processed,
           COALESCE(SUM(o.final_amount), 0) as total_sales,
           COUNT(CASE WHEN o.status = 'cancelled' THEN 1 END) as cancellations,
           COALESCE(SUM(CASE WHEN o.status = 'cancelled' THEN o.total_amount ELSE 0 END), 0) as cancelled_amount,
           COUNT(DISTINCT cs.id) as sessions_count,
           ROUND(AVG(cs.total_sales), 0) as avg_sales_per_session
    FROM staff s
    LEFT JOIN orders o ON o.cashier_id = s.id AND o.created_at >= date('now', ? || ' days')
    LEFT JOIN cashier_sessions cs ON cs.cashier_id = s.id AND cs.started_at >= date('now', ? || ' days')
    WHERE s.role IN ('cashier', 'admin')
    GROUP BY s.id
    ORDER BY total_sales DESC
  `).all(-days, -days);
}

export function getCancellationAnalytics(days = 30) {
  const db = getDb();
  return {
    by_reason: db.prepare(`
      SELECT cr.reason, cr.category, COUNT(*) as count, COUNT(*) * 100.0 / (SELECT COUNT(*) FROM orders WHERE status = 'cancelled' AND created_at >= date('now', ? || ' days')) as percentage
      FROM orders o
      JOIN cancellation_reasons cr ON cr.reason = o.cancellation_reason
      WHERE o.status = 'cancelled' AND o.created_at >= date('now', ? || ' days')
      GROUP BY cr.reason ORDER BY count DESC
    `).all(-days, -days),
    by_day: db.prepare(`
      SELECT date(created_at) as date, COUNT(*) as count, SUM(total_amount) as revenue_lost
      FROM orders WHERE status = 'cancelled' AND created_at >= date('now', ? || ' days')
      GROUP BY date(created_at) ORDER BY date DESC
    `).all(-days),
  };
}

export function getHourlyOrderDistribution(days = 30) {
  const db = getDb();
  return db.prepare(`
    SELECT CAST(strftime('%H', created_at) AS INTEGER) as hour, COUNT(*) as orders, SUM(final_amount) as revenue
    FROM orders WHERE created_at >= date('now', ? || ' days') AND status != 'cancelled'
    GROUP BY hour ORDER BY hour
  `).all(-days);
}
