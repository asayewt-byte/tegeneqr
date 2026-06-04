import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { generateDailySummary, getRecentDailySummaries, getPopularProducts, getCashierPerformance, getCancellationAnalytics, getHourlyOrderDistribution } from '@/lib/reports';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'daily';
  const date = searchParams.get('date');
  const days = parseInt(searchParams.get('days') || '30');

  switch (type) {
    case 'daily': {
      const summary = date ? await generateDailySummary(date) : await generateDailySummary();
      const recent = await getRecentDailySummaries(30);
      return NextResponse.json({ summary, recent });
    }
    case 'products':
      return NextResponse.json(await getPopularProducts(20));
    case 'cashiers':
      return NextResponse.json(await getCashierPerformance(days));
    case 'cancellations':
      return NextResponse.json(await getCancellationAnalytics(days));
    case 'hourly':
      return NextResponse.json(await getHourlyOrderDistribution(days));
    case 'overview': {
      const today = date || new Date().toISOString().split('T')[0];
      const { count: pendingOrders } = await supabaseAdmin
        .from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending');
      const { count: activeOrders } = await supabaseAdmin
        .from('orders').select('*', { count: 'exact', head: true }).not('status', 'in', ['paid', 'cancelled', 'served']);
      const { count: todaysOrders } = await supabaseAdmin
        .from('orders').select('*', { count: 'exact', head: true }).gte('created_at', `${today} 00:00:00`).lte('created_at', `${today} 23:59:59`);
      const { count: todaysCancellations } = await supabaseAdmin
        .from('orders').select('*', { count: 'exact', head: true }).eq('status', 'cancelled').gte('created_at', `${today} 00:00:00`).lte('created_at', `${today} 23:59:59`);
      const { data: todaysRevenueData } = await supabaseAdmin
        .from('orders').select('final_amount').gte('created_at', `${today} 00:00:00`).lte('created_at', `${today} 23:59:59`).neq('status', 'cancelled');
      const todaysRevenue = (todaysRevenueData || []).reduce((s, o) => s + (o.final_amount || 0), 0);
      const { count: totalMenuItems } = await supabaseAdmin
        .from('menu_items').select('*', { count: 'exact', head: true });
      const { count: availableItems } = await supabaseAdmin
        .from('menu_items').select('*', { count: 'exact', head: true }).eq('is_available', 1);
      const { count: activeTables } = await supabaseAdmin
        .from('tables').select('*', { count: 'exact', head: true }).eq('is_active', 1);
      const { count: activeStaff } = await supabaseAdmin
        .from('staff').select('*', { count: 'exact', head: true }).eq('is_active', 1);

      return NextResponse.json({
        pending_orders: pendingOrders || 0,
        active_orders: activeOrders || 0,
        todays_orders: todaysOrders || 0,
        todays_revenue: todaysRevenue,
        todays_cancellations: todaysCancellations || 0,
        total_menu_items: totalMenuItems || 0,
        available_items: availableItems || 0,
        active_tables: activeTables || 0,
        active_staff: activeStaff || 0,
      });
    }
    default:
      return NextResponse.json(await generateDailySummary());
  }
}
