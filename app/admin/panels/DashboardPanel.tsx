'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { StatusBadge } from '@/components/StatusBadge';
import { getCached, setCache } from '@/lib/cache';
import { Clock, ShoppingCart, TrendingUp, DollarSign, UtensilsCrossed, LayoutDashboard, Users, AlertTriangle, ChevronRight } from 'lucide-react';

const CACHE_KEY = 'dashboard';
const ORDERS_CACHE = 'dashboard-orders';

function parseItems(items: any): any[] {
  if (!items) return [];
  if (Array.isArray(items)) return items;
  try { return JSON.parse(items); } catch { return []; }
}

function timeAgo(dateStr: string): string {
  const min = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  return `${h}h ${min % 60}m ago`;
}

const cards = [
  { label: 'Pending Orders', key: 'pending_orders', icon: Clock, gradient: 'from-amber-400/20 to-amber-500/5', iconBg: 'bg-amber-500/20', iconColor: 'text-amber-300' },
  { label: 'Active Orders', key: 'active_orders', icon: ShoppingCart, gradient: 'from-blue-400/20 to-blue-500/5', iconBg: 'bg-blue-500/20', iconColor: 'text-blue-300' },
  { label: "Today's Orders", key: 'todays_orders', icon: TrendingUp, gradient: 'from-emerald-400/20 to-emerald-500/5', iconBg: 'bg-emerald-500/20', iconColor: 'text-emerald-300' },
  { label: "Today's Revenue", key: 'todays_revenue', icon: DollarSign, gradient: 'from-orange-400/20 to-orange-500/5', iconBg: 'bg-orange-500/20', iconColor: 'text-orange-300', prefix: 'ETB ' },
  { label: 'Menu Items', key: 'total_menu_items', icon: UtensilsCrossed, gradient: 'from-violet-400/20 to-violet-500/5', iconBg: 'bg-violet-500/20', iconColor: 'text-violet-300' },
  { label: 'Active Tables', key: 'active_tables', icon: LayoutDashboard, gradient: 'from-cyan-400/20 to-cyan-500/5', iconBg: 'bg-cyan-500/20', iconColor: 'text-cyan-300' },
  { label: 'Active Staff', key: 'active_staff', icon: Users, gradient: 'from-pink-400/20 to-pink-500/5', iconBg: 'bg-pink-500/20', iconColor: 'text-pink-300' },
  { label: 'Cancellations', key: 'todays_cancellations', icon: AlertTriangle, gradient: 'from-red-400/20 to-red-500/5', iconBg: 'bg-red-500/20', iconColor: 'text-red-300' },
];

export default function DashboardPanel() {
  const [stats, setStats] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => Promise.all([
    fetch('/api/reports?type=overview').then((r) => r.json()),
    fetch('/api/orders?limit=6').then((r) => r.json()),
  ]).then(([s, orders]) => {
    setStats(s);
    setRecentOrders(orders);
    setLoading(false);
    setCache(CACHE_KEY, s);
    setCache(ORDERS_CACHE, orders);
  });

  useEffect(() => {
    const cached = getCached<any>(CACHE_KEY);
    const ordersCached = getCached<any[]>(ORDERS_CACHE);
    if (cached && ordersCached) { setStats(cached); setRecentOrders(ordersCached); setLoading(false); return; }
    load();
    const channel = supabase
      .channel('admin-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => { load(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  if (loading) return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1,2,3,4,5,6,7,8].map((i) => <div key={i} className="h-28 bg-gray-800/80 rounded-xl animate-pulse" />)}
      </div>
      <div className="h-64 bg-gray-800/80 rounded-2xl animate-pulse" />
    </div>
  );

  const statusCounts = {
    pending: recentOrders.filter((o: any) => o.status === 'pending').length,
    confirmed: recentOrders.filter((o: any) => o.status === 'confirmed').length,
    preparing: recentOrders.filter((o: any) => o.status === 'preparing').length,
    ready: recentOrders.filter((o: any) => o.status === 'ready').length,
    served: recentOrders.filter((o: any) => o.status === 'served').length,
    paid: recentOrders.filter((o: any) => o.status === 'paid').length,
    cancelled: recentOrders.filter((o: any) => o.status === 'cancelled').length,
  };

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((c, i) => {
          const value = stats?.[c.key];
          return (
            <motion.div key={c.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <div className="relative rounded-xl p-3 sm:p-4 border border-white/[0.06] overflow-hidden bg-gray-900/80">
                <div className={`absolute inset-0 bg-gradient-to-br ${c.gradient}`} />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                    <span className="text-[9px] sm:text-[10px] text-white/50 uppercase tracking-[0.12em] font-semibold">{c.label}</span>
                    <div className={`${c.iconBg} p-1.5 rounded-lg ring-1 ring-white/10`}>
                      <c.icon className={`h-2.5 w-2.5 sm:h-3 sm:w-3 ${c.iconColor}`} />
                    </div>
                  </div>
                  <AnimatedCounter value={value} prefix={c.prefix || ''} className="text-lg sm:text-2xl font-bold tracking-tight text-white drop-shadow-sm" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Bottom section: Recent Orders + Status Distribution */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="md:col-span-2 rounded-xl border border-white/[0.06] overflow-hidden bg-gray-900/80">
          <div className="p-4 pb-3 border-b border-white/[0.06]">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white/70">Recent Orders</h3>
              <span className="text-[11px] text-white/30">Last 6 orders</span>
            </div>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {recentOrders.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-white/30">No orders yet today</p>
              </div>
            ) : recentOrders.slice(0, 6).map((order: any, i: number) => {
              const items = parseItems(order.items);
              return (
                <motion.div key={order.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors">
                  <div className="flex-1 min-w-0 flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/10 text-xs font-bold text-white/60 shrink-0">
                      {order.table_number || '?'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white/80 truncate">{order.order_number}</p>
                      <p className="text-[11px] text-white/40">{items.length} item{items.length !== 1 ? 's' : ''} · {timeAgo(order.created_at)}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-white/90">ETB {order.final_amount?.toLocaleString()}</p>
                    <StatusBadge status={order.status} />
                  </div>
                  <ChevronRight className="h-4 w-4 text-white/20" />
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Status Distribution */}
        <div className="rounded-xl border border-white/[0.06] overflow-hidden bg-gray-900/80">
          <div className="p-4 pb-3 border-b border-white/[0.06]">
            <h3 className="text-sm font-semibold text-white/70">Order Status</h3>
          </div>
          <div className="p-4 space-y-3">
            {[
              { label: 'Pending', key: 'pending', color: 'bg-amber-400' },
              { label: 'Confirmed', key: 'confirmed', color: 'bg-blue-400' },
              { label: 'Preparing', key: 'preparing', color: 'bg-orange-400' },
              { label: 'Ready', key: 'ready', color: 'bg-violet-400' },
              { label: 'Served', key: 'served', color: 'bg-cyan-400' },
              { label: 'Paid', key: 'paid', color: 'bg-emerald-400' },
              { label: 'Cancelled', key: 'cancelled', color: 'bg-red-400' },
            ].map((s) => {
              const count = (statusCounts as any)[s.key] || 0;
              const total = recentOrders.length || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={s.key} className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full ${s.color} shrink-0`} />
                  <span className="text-xs text-white/50 flex-1">{s.label}</span>
                  <span className="text-xs font-semibold text-white/80 w-6 text-right">{count}</span>
                  <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${s.color} transition-all duration-500`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
