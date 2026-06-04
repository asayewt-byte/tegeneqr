import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { generateDailySummary, getPopularProducts, getCashierPerformance, getCancellationAnalytics, getHourlyOrderDistribution } from '@/lib/reports';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'daily';
  const date = searchParams.get('date');
  const days = parseInt(searchParams.get('days') || '30');

  switch (type) {
    case 'daily': {
      const db = getDb();
      const summary = date ? generateDailySummary(date) : generateDailySummary();
      const recent = db.prepare('SELECT * FROM daily_sales_summary ORDER BY date DESC LIMIT 30').all();
      return NextResponse.json({ summary, recent });
    }
    case 'products':
      return NextResponse.json(getPopularProducts(20));
    case 'cashiers':
      return NextResponse.json(getCashierPerformance(days));
    case 'cancellations':
      return NextResponse.json(getCancellationAnalytics(days));
    case 'hourly':
      return NextResponse.json(getHourlyOrderDistribution(days));
    case 'overview': {
      const db = getDb();
      const today = date || new Date().toISOString().split('T')[0];
      const stats = {
        pending_orders: (db.prepare("SELECT COUNT(*) as c FROM orders WHERE status = 'pending'").get() as any).c,
        active_orders: (db.prepare("SELECT COUNT(*) as c FROM orders WHERE status NOT IN ('paid', 'cancelled', 'served')").get() as any).c,
        todays_orders: (db.prepare('SELECT COUNT(*) as c FROM orders WHERE date(created_at) = ?').get(today) as any).c,
        todays_revenue: (db.prepare("SELECT COALESCE(SUM(final_amount), 0) as s FROM orders WHERE date(created_at) = ? AND status != 'cancelled'").get(today) as any).s,
        todays_cancellations: (db.prepare("SELECT COUNT(*) as c FROM orders WHERE date(created_at) = ? AND status = 'cancelled'").get(today) as any).c,
        total_menu_items: (db.prepare('SELECT COUNT(*) as c FROM menu_items').get() as any).c,
        available_items: (db.prepare('SELECT COUNT(*) as c FROM menu_items WHERE is_available = 1').get() as any).c,
        active_tables: (db.prepare('SELECT COUNT(*) as c FROM tables WHERE is_active = 1').get() as any).c,
        active_staff: (db.prepare('SELECT COUNT(*) as c FROM staff WHERE is_active = 1').get() as any).c,
      };
      return NextResponse.json(stats);
    }
    default:
      return NextResponse.json(generateDailySummary());
  }
}
