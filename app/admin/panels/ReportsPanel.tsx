'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { motion } from 'framer-motion';

const COLORS = ['#f59e0b', '#f97316', '#ef4444', '#8b5cf6', '#06b6d4', '#10b981', '#ec4899'];

export default function ReportsPanel() {
  const [summary, setSummary] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [cashiers, setCashiers] = useState<any[]>([]);
  const [cancellations, setCancellations] = useState<any>(null);
  const [hourly, setHourly] = useState<any[]>([]);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/reports?type=daily&days=${days}`).then((r) => r.json()),
      fetch(`/api/reports?type=products&days=${days}`).then((r) => r.json()),
      fetch(`/api/reports?type=cashiers&days=${days}`).then((r) => r.json()),
      fetch(`/api/reports?type=cancellations&days=${days}`).then((r) => r.json()),
      fetch(`/api/reports?type=hourly&days=${days}`).then((r) => r.json()),
    ]).then(([s, p, c, ca, h]) => { setSummary(s); setProducts(p); setCashiers(c); setCancellations(ca); setHourly(h); setLoading(false); });
  }, [days]);

  const peakHour = [...hourly].sort((a, b) => b.orders - a.orders)[0];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Reports & Analytics</h2>
        <select value={days} onChange={(e) => setDays(parseInt(e.target.value))} className="h-9 px-3 border rounded-lg text-sm">
          <option value={7}>Last 7 days</option><option value={30}>Last 30 days</option><option value={90}>Last 90 days</option>
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[1,2,3,4].map((i) => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : summary?.summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Net Revenue', value: summary.summary.net_revenue, color: 'text-emerald-600' },
            { label: 'Gross Profit', value: summary.summary.gross_profit, color: 'text-blue-600' },
            { label: 'Avg Order Value', value: summary.summary.avg_order_value, color: 'text-purple-600' },
            { label: 'Cancellations', value: summary.summary.total_cancellations, color: 'text-red-600' },
          ].map((c, i) => (
            <motion.div key={c.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="card-hover">
                <CardContent className="p-5">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{c.label}</p>
                  <AnimatedCounter value={c.value} prefix="ETB " className={`text-2xl font-bold ${c.color}`} />
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-lg">Popular Products</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={products.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="total_sold" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Order Distribution</CardTitle></CardHeader>
          <CardContent>
            {peakHour && <p className="text-sm text-gray-500 mb-2">Peak: <span className="font-bold text-gray-800">{peakHour.hour}:00</span></p>}
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={hourly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="orders" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Cashier Performance</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {cashiers.map((c) => (
              <div key={c.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div>
                  <p className="font-medium text-gray-900">{c.name}</p>
                  <p className="text-xs text-gray-500">{c.orders_processed} orders · {c.sessions_count} sessions</p>
                </div>
                <span className="font-bold text-amber-600">ETB {(c.total_sales || 0).toLocaleString()}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Cancellation Reasons</CardTitle></CardHeader>
          <CardContent>
            {cancellations?.by_reason?.slice(0, 6).map((cr: any, i: number) => (
              <div key={cr.reason} className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ background: COLORS[i % COLORS.length] }}>{Math.round(cr.percentage)}%</div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{cr.reason}</p>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                    <div className="h-1.5 rounded-full" style={{ width: `${cr.percentage}%`, background: COLORS[i % COLORS.length] }} />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
