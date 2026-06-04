'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { motion } from 'framer-motion';
import { getCached, setCache } from '@/lib/cache';
import { TrendingUp, Wallet, ShoppingBag, XCircle, Users, Clock, ChevronDown } from 'lucide-react';

const COLORS = ['#f59e0b', '#f97316', '#ef4444', '#8b5cf6', '#06b6d4', '#10b981', '#ec4899'];

const summaryCards = [
  { label: 'Net Revenue', key: 'net_revenue', icon: Wallet, gradient: 'from-emerald-400/20 to-emerald-500/5', iconBg: 'bg-emerald-500/20', iconColor: 'text-emerald-300' },
  { label: 'Gross Profit', key: 'gross_profit', icon: TrendingUp, gradient: 'from-blue-400/20 to-blue-500/5', iconBg: 'bg-blue-500/20', iconColor: 'text-blue-300' },
  { label: 'Avg Order Value', key: 'avg_order_value', icon: ShoppingBag, gradient: 'from-violet-400/20 to-violet-500/5', iconBg: 'bg-violet-500/20', iconColor: 'text-violet-300' },
  { label: 'Cancellations', key: 'total_cancellations', icon: XCircle, gradient: 'from-red-400/20 to-red-500/5', iconBg: 'bg-red-500/20', iconColor: 'text-red-300' },
];

export default function ReportsPanel() {
  const [summary, setSummary] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [cashiers, setCashiers] = useState<any[]>([]);
  const [cancellations, setCancellations] = useState<any>(null);
  const [hourly, setHourly] = useState<any[]>([]);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cached = getCached<any>(`reports-${days}`);
    if (cached) { setSummary(cached.summary); setProducts(cached.products); setCashiers(cached.cashiers); setCancellations(cached.cancellations); setHourly(cached.hourly); setLoading(false); return; }
    setLoading(true);
    Promise.all([
      fetch(`/api/reports?type=daily&days=${days}`).then((r) => r.json()),
      fetch(`/api/reports?type=products&days=${days}`).then((r) => r.json()),
      fetch(`/api/reports?type=cashiers&days=${days}`).then((r) => r.json()),
      fetch(`/api/reports?type=cancellations&days=${days}`).then((r) => r.json()),
      fetch(`/api/reports?type=hourly&days=${days}`).then((r) => r.json()),
    ]).then(([s, p, c, ca, h]) => { setSummary(s); setProducts(p); setCashiers(c); setCancellations(ca); setHourly(h); setLoading(false); setCache(`reports-${days}`, { summary: s, products: p, cashiers: c, cancellations: ca, hourly: h }); });
  }, [days]);

  const peakHour = [...hourly].sort((a, b) => b.orders - a.orders)[0];

  if (loading) return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1,2,3,4].map((i) => <div key={i} className="h-28 bg-gray-800/80 rounded-xl animate-pulse" />)}
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        {[1,2,3,4].map((i) => <div key={i} className="h-72 bg-gray-800/80 rounded-xl animate-pulse" />)}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Reports</h2>
          <p className="text-sm text-white/40 mt-0.5">Performance analytics</p>
        </div>
        <div className="relative">
          <select value={days} onChange={(e) => setDays(parseInt(e.target.value))}
            className="appearance-none pl-3 pr-8 py-2 bg-white/5 border border-white/10 text-white/80 rounded-xl text-sm outline-none focus:border-white/20 focus:ring-1 focus:ring-white/10 cursor-pointer">
            <option value={7} className="bg-gray-900">Last 7 days</option>
            <option value={30} className="bg-gray-900">Last 30 days</option>
            <option value={90} className="bg-gray-900">Last 90 days</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 pointer-events-none" />
        </div>
      </div>

      {/* Summary cards */}
      {summary?.summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {summaryCards.map((c, i) => (
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
                  <AnimatedCounter value={summary.summary[c.key]} prefix="ETB " className="text-lg sm:text-2xl font-bold tracking-tight text-white drop-shadow-sm" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Charts grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Popular Products */}
        <div className="rounded-xl border border-white/[0.06] overflow-hidden bg-gray-900/80">
          <div className="p-4 pb-3 border-b border-white/[0.06]">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white/70">Popular Products</h3>
              <span className="text-[11px] text-white/30">Top sellers</span>
            </div>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={products.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} />
                <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff', fontSize: 12 }} />
                <Bar dataKey="total_sold" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order Distribution */}
        <div className="rounded-xl border border-white/[0.06] overflow-hidden bg-gray-900/80">
          <div className="p-4 pb-3 border-b border-white/[0.06]">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white/70">Hourly Orders</h3>
              {peakHour && <span className="text-[11px] text-white/30">Peak: {peakHour.hour}:00</span>}
            </div>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={hourly}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="hour" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} />
                <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff', fontSize: 12 }} />
                <Line type="monotone" dataKey="orders" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b', r: 3, strokeWidth: 0 }} activeDot={{ r: 5, fill: '#f59e0b' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cashier Performance */}
        <div className="rounded-xl border border-white/[0.06] overflow-hidden bg-gray-900/80">
          <div className="p-4 pb-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <Users className="h-3.5 w-3.5 text-white/40" />
              <h3 className="text-sm font-semibold text-white/70">Cashier Performance</h3>
            </div>
          </div>
          <div className="p-3 space-y-1.5">
            {cashiers.length === 0 ? (
              <p className="text-sm text-white/30 text-center py-6">No data</p>
            ) : cashiers.map((c, i) => (
              <motion.div key={c.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between p-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.06] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400/20 to-orange-500/20 flex items-center justify-center text-xs font-bold text-amber-300">
                    {c.name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white/80">{c.name}</p>
                    <p className="text-[10px] text-white/40">{c.orders_processed} orders · {c.sessions_count} sessions</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-amber-300">ETB {(c.total_sales || 0).toLocaleString()}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Cancellation Reasons */}
        <div className="rounded-xl border border-white/[0.06] overflow-hidden bg-gray-900/80">
          <div className="p-4 pb-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <XCircle className="h-3.5 w-3.5 text-white/40" />
              <h3 className="text-sm font-semibold text-white/70">Cancellation Reasons</h3>
            </div>
          </div>
          <div className="p-4 space-y-3">
            {cancellations?.by_reason?.length === 0 ? (
              <p className="text-sm text-white/30 text-center py-6">No cancellations</p>
            ) : cancellations?.by_reason?.slice(0, 6).map((cr: any, i: number) => (
              <motion.div key={cr.reason} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-white/70">{cr.reason}</p>
                  <span className="text-xs font-semibold text-white/50">{Math.round(cr.percentage)}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${cr.percentage}%` }}
                    className="h-full rounded-full transition-all duration-700"
                    style={{ background: COLORS[i % COLORS.length] }} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
