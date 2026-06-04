'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { io } from 'socket.io-client';
import { Card, CardContent } from '@/components/ui/card';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { Clock, ShoppingCart, TrendingUp, DollarSign, UtensilsCrossed, LayoutDashboard, Users, AlertTriangle } from 'lucide-react';

export default function DashboardPanel() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = () => fetch('/api/reports?type=overview').then((r) => r.json()).then((d) => { setStats(d); setLoading(false); });
    load();
    const s = io(); s.emit('join-role', 'admin');
    s.on('new-order', load); s.on('order-updated', load);
    return () => { s.disconnect(); };
  }, []);

  if (loading) return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[1,2,3,4,5,6,7,8].map((i) => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}
    </div>
  );

  const cards = [
    { label: 'Pending Orders', value: stats.pending_orders, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
    { label: 'Active Orders', value: stats.active_orders, icon: ShoppingCart, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: "Today's Orders", value: stats.todays_orders, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: "Today's Revenue", value: stats.todays_revenue, icon: DollarSign, color: 'text-orange-500', bg: 'bg-orange-50', prefix: 'ETB ' },
    { label: 'Menu Items', value: stats.total_menu_items, icon: UtensilsCrossed, color: 'text-violet-500', bg: 'bg-violet-50' },
    { label: 'Active Tables', value: stats.active_tables, icon: LayoutDashboard, color: 'text-cyan-500', bg: 'bg-cyan-50' },
    { label: 'Active Staff', value: stats.active_staff, icon: Users, color: 'text-pink-500', bg: 'bg-pink-50' },
    { label: 'Cancellations', value: stats.todays_cancellations, icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((c, i) => (
        <motion.div key={c.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
          <Card className="card-hover">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{c.label}</p>
                  <AnimatedCounter value={c.value} prefix={c.prefix || ''} className="text-2xl font-bold text-gray-900" />
                </div>
                <div className={`w-11 h-11 ${c.bg} rounded-xl flex items-center justify-center`}>
                  <c.icon className={`h-5 w-5 ${c.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
