'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { StatusBadge } from '@/components/StatusBadge';
import { OrderCardSkeleton } from '@/components/SkeletonCards';
import { LogOut, Clock, TrendingUp, AlertTriangle, CheckCircle2, Users, Bell, ChefHat } from 'lucide-react';
import toast from 'react-hot-toast';

function parseItems(items: any): any[] {
  if (!items) return [];
  if (Array.isArray(items)) return items;
  try { return JSON.parse(items); } catch { return []; }
}

interface Staff { id: number; name: string; role: string; }
interface Order {
  id: number; order_number: string; table_id: number; table_number: number;
  status: string; total_amount: number; discount_amount: number; final_amount: number;
  notes: string | null; created_at: string; waiter_id: number | null;
  cancellation_reason: string | null; items: string;
}

export default function CashierPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [cashier, setCashier] = useState<Staff | null>(null);
  const [pin, setPin] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('cashier_session');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setCashier(data);
        setLoggedIn(true);
      } catch { localStorage.removeItem('cashier_session'); }
    }
    setHydrated(true);
  }, []);
  const [orders, setOrders] = useState<Order[]>([]);
  const [waiters, setWaiters] = useState<Staff[]>([]);
  const [filter, setFilter] = useState('pending');
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [cancelReasons, setCancelReasons] = useState<any[]>([]);
  const [showCancelModal, setShowCancelModal] = useState<number | null>(null);
  const [selectedReason, setSelectedReason] = useState('');
  const [loading, setLoading] = useState(true);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playNotification = () => {
    if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 800;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  };

  useEffect(() => {
    fetch('/api/cancel-reasons').then((r) => r.json()).then(setCancelReasons);
    fetch('/api/staff?role=waiter').then((r) => r.json()).then(setWaiters);
  }, []);

  const refreshOrders = () => {
    fetch('/api/orders').then((r) => r.json()).then(setOrders);
  };

  useEffect(() => {
    if (!loggedIn || !cashier) return;
    setLoading(true);
    Promise.all([
      fetch('/api/orders').then((r) => r.json()),
      fetch('/api/sessions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cashier_id: cashier.id, starting_cash: 0 }) }).then((r) => r.ok ? r.json() : null),
    ]).then(([ordersData, session]) => {
      setOrders(ordersData);
      if (session) setSessionId(session.id);
      setLoading(false);
    });

    const channel = supabase
      .channel('cashier-orders')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
        refreshOrders();
        playNotification();
        toast.success(`New order from Table ${payload.new.table_id}!`, { icon: '🔔' });
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, () => {
        refreshOrders();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [loggedIn, cashier]);

  const handleLogin = async () => {
    if (loggingIn) return;
    setLoggingIn(true);
    const res = await fetch('/api/staff/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pin_code: pin, role: 'cashier' }) });
    setLoggingIn(false);
    if (res.ok) { const data = await res.json(); setCashier(data); setLoggedIn(true); localStorage.setItem('cashier_session', JSON.stringify(data)); toast.success(`Welcome, ${data.name}!`); }
    else { toast.error('Invalid PIN'); }
  };

  const handleLogout = async () => {
    if (sessionId) await fetch('/api/sessions', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: sessionId, ending_cash: 0 }) }).catch(() => {});
    setLoggedIn(false); setCashier(null); setSessionId(null); setPin(''); setOrders([]);
    localStorage.removeItem('cashier_session');
    toast.success('Logged out');
  };

  const handleApprove = async (orderId: number) => {
    if (submitting) return;
    setSubmitting(true);
    await fetch('/api/cashier', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order_id: orderId, action: 'approve', cashier_id: cashier?.id }) });
    setSubmitting(false);
    toast.success('Order confirmed');
  };

  const handleAssign = async (orderId: number, waiterId: number) => {
    if (submitting) return;
    setSubmitting(true);
    await fetch('/api/cashier', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order_id: orderId, action: 'assign', waiter_id: waiterId }) });
    setSubmitting(false);
    toast.success('Waiter assigned');
  };

  const handleCancel = async () => {
    if (!showCancelModal || !selectedReason || submitting) return;
    setSubmitting(true);
    await fetch('/api/cashier', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order_id: showCancelModal, action: 'cancel', cashier_id: cashier?.id, cancellation_reason: selectedReason }) });
    setSubmitting(false);
    setShowCancelModal(null); setSelectedReason('');
    toast.success('Order cancelled');
  };

  const handleStatusUpdate = async (orderId: number, status: string) => {
    if (submitting) return;
    setSubmitting(true);
    await fetch(`/api/orders/${orderId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status, cashier_id: cashier?.id }) });
    setSubmitting(false);
    toast.success(`Order ${status}`);
  };

  if (!hydrated) return null;
  if (!loggedIn) return (
    <div className="relative min-h-screen flex flex-col overflow-hidden bg-gray-950">
      {/* Full background photo */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1400&q=85')" }}>
          <div className="absolute inset-0 bg-gradient-to-b from-gray-950/40 via-gray-950/20 to-gray-950" />
          <div className="absolute inset-0 bg-gradient-to-r from-amber-900/20 to-transparent" />
        </div>
      </div>

      {/* Decorative glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px]" />

      {/* Top brand — subtle */}
      <div className="relative z-10 p-6 lg:p-10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
            <svg className="h-4.5 w-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
          <span className="text-white/70 text-sm font-semibold tracking-widest uppercase">Buna BeNet</span>
        </div>
      </div>

      {/* Login card — bottom-elevated on mobile, centered on desktop */}
      <div className="relative z-10 flex-1 flex items-end lg:items-center justify-center px-4 pb-8 lg:pb-0">
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm">
          <div className="bg-white/[0.06] backdrop-blur-2xl rounded-[2rem] p-7 pb-8 border border-white/[0.08] shadow-2xl">
            {/* Avatar + greeting */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-xl shadow-amber-500/20 ring-1 ring-white/10">
                <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white">Welcome, Team</h2>
              <p className="text-white/40 text-sm mt-1">Enter your PIN to start your shift</p>
            </div>

            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                </div>
                <input type="password" placeholder="PIN Code" value={pin} onChange={(e) => setPin(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 text-white placeholder:text-white/25 rounded-2xl text-base font-mono tracking-widest outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/15 transition-all" maxLength={4} autoFocus />
              </div>
              <Button type="submit" disabled={loggingIn}
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-semibold rounded-2xl shadow-xl shadow-amber-500/25 text-base transition-all hover:shadow-2xl hover:shadow-amber-500/30 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-xl">
                {loggingIn ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    Start Shift
                  </span>
                )}
              </Button>
            </form>

            <p className="text-white/20 text-xs text-center mt-6 tracking-wide">Hotel Staff Portal</p>
          </div>
        </motion.div>
      </div>
    </div>
  );

  const filteredOrders = orders.filter((o) => {
    if (filter === 'all') return true;
    if (filter === 'pending') return o.status === 'pending';
    if (filter === 'active') return ['confirmed', 'preparing', 'ready', 'served'].includes(o.status);
    return o.status === filter;
  });

  const stats = {
    pending: orders.filter((o) => o.status === 'pending').length,
    active: orders.filter((o) => ['confirmed', 'preparing', 'ready', 'served'].includes(o.status)).length,
    today: orders.filter((o) => new Date(o.created_at).toDateString() === new Date().toDateString()).length,
    revenue: orders.filter((o) => new Date(o.created_at).toDateString() === new Date().toDateString() && o.status !== 'cancelled').reduce((s, o) => s + o.final_amount, 0),
  };

  const tabs = [
    { key: 'pending', label: 'Pending', color: 'text-amber-300', bg: 'bg-amber-500/15', dot: 'bg-amber-400' },
    { key: 'active', label: 'Active', color: 'text-blue-300', bg: 'bg-blue-500/15', dot: 'bg-blue-400' },
    { key: 'cancelled', label: 'Cancelled', color: 'text-red-300', bg: 'bg-red-500/15', dot: 'bg-red-400' },
    { key: 'paid', label: 'Paid', color: 'text-emerald-300', bg: 'bg-emerald-500/15', dot: 'bg-emerald-400' },
    { key: 'all', label: 'All', color: 'text-white', bg: 'bg-white/10', dot: '' },
  ];
  const tabCounts: Record<string, number> = {
    pending: stats.pending, active: stats.active, cancelled: orders.filter(o => o.status === 'cancelled').length,
    paid: orders.filter(o => o.status === 'paid').length, all: orders.length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white sticky top-0 z-10">
        <div className="px-3 sm:px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <h1 className="text-base sm:text-lg font-bold">{cashier?.name}</h1>
              <Badge variant="info" className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-[10px] sm:text-xs">{stats.pending} pending</Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-gray-400 hover:text-white hover:bg-white/10 text-xs sm:text-sm">
              <LogOut className="h-4 w-4 sm:mr-1" /><span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
          <div className="grid grid-cols-4 gap-2 sm:gap-3 mb-3">
            {[
              { label: 'Pending', value: stats.pending, icon: Clock, accent: 'amber', gradient: 'from-amber-400/20 to-amber-500/5', iconBg: 'bg-amber-500/20', iconColor: 'text-amber-300' },
              { label: 'Active', value: stats.active, icon: ChefHat, accent: 'blue', gradient: 'from-blue-400/20 to-blue-500/5', iconBg: 'bg-blue-500/20', iconColor: 'text-blue-300' },
              { label: 'Today', value: stats.today, icon: TrendingUp, accent: 'emerald', gradient: 'from-emerald-400/20 to-emerald-500/5', iconBg: 'bg-emerald-500/20', iconColor: 'text-emerald-300' },
              { label: 'Revenue', value: stats.revenue, icon: TrendingUp, accent: 'orange', gradient: 'from-orange-400/20 to-orange-500/5', iconBg: 'bg-orange-500/20', iconColor: 'text-orange-300', prefix: 'ETB ' },
            ].map((s) => (
              <div key={s.label} className="relative rounded-xl p-2.5 sm:p-3 border border-white/[0.06] overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-br ${s.gradient}`} />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                    <span className="text-[9px] sm:text-[10px] text-white/50 uppercase tracking-[0.12em] font-semibold">{s.label}</span>
                    <div className={`${s.iconBg} p-1.5 rounded-lg ring-1 ring-white/10`}>
                      <s.icon className={`h-2.5 w-2.5 sm:h-3 sm:w-3 ${s.iconColor}`} />
                    </div>
                  </div>
                  <AnimatedCounter value={s.value} prefix={s.prefix || ''}
                    className={`text-lg sm:text-2xl font-bold tracking-tight text-white drop-shadow-sm`} />
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide -mx-3 px-3 pb-1">
            {tabs.map((t) => (
              <button key={t.key} onClick={() => setFilter(t.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                  filter === t.key
                    ? `${t.bg} ${t.color} shadow-sm`
                    : 'text-white/40 hover:text-white/70 hover:bg-white/[0.06]'
                }`}>
                {t.dot && <span className={`w-1.5 h-1.5 rounded-full ${t.dot}`} />}
                <span>{t.label}</span>
                <span className={`ml-0.5 text-[10px] font-semibold tabular-nums ${
                  filter === t.key ? 'opacity-70' : 'opacity-40'
                }`}>
                  {tabCounts[t.key]}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto p-4">
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => <OrderCardSkeleton key={i} />)}
          </div>
        ) : filteredOrders.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <Bell className="h-16 w-16 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 text-lg font-medium">No orders found</p>
            <p className="text-gray-300 text-sm mt-1">Waiting for customers...</p>
          </motion.div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {filteredOrders.map((order) => {
                const items = parseItems(order.items);
                const timeSince = Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60000);
                return (
                  <motion.div key={order.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className={`p-4 card-hover ${
                      order.status === 'pending' ? 'border-amber-200 bg-amber-50/50' :
                      order.status === 'cancelled' ? 'border-red-200 bg-red-50/30' :
                      order.status === 'ready' ? 'border-violet-200 bg-violet-50/30' : ''
                    }`}>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-gray-900">Table {order.table_number}</span>
                            {order.status === 'pending' && timeSince > 5 && (
                              <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                                <Clock className="h-3 w-3" /> {timeSince}m
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 font-mono">{order.order_number}</p>
                        </div>
                        <StatusBadge status={order.status} />
                      </div>
                      <div className="text-xs text-gray-400 mb-3">
                        {new Date(order.created_at).toLocaleTimeString()}
                      </div>
                      <div className="border-t pt-3 mb-3 space-y-1.5">
                        {items.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span className="text-gray-700">{item.quantity}x {item.name}</span>
                            <span className="font-medium text-gray-900">ETB {(item.subtotal || item.unit_price * item.quantity).toLocaleString()}</span>
                          </div>
                        ))}
                        <div className="flex justify-between pt-2 border-t font-bold">
                          <span>Total</span>
                          <span className="text-amber-600">ETB {order.final_amount.toLocaleString()}</span>
                        </div>
                      </div>
                      {order.notes && (
                        <div className="bg-amber-50 border border-amber-100 p-2.5 rounded-xl mb-3 text-sm text-amber-800">
                          📝 {order.notes}
                        </div>
                      )}
                      <div className="space-y-2">
                        {order.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button onClick={() => handleApprove(order.id)} size="sm" disabled={submitting}
                              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl disabled:opacity-50">
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Confirm
                            </Button>
                            <Button onClick={() => setShowCancelModal(order.id)} size="sm" variant="destructive" className="rounded-xl">
                              Cancel
                            </Button>
                          </div>
                        )}
                        {order.status === 'confirmed' && (
                          <div className="space-y-2">
                            <div className="flex gap-2">
                              <Select onValueChange={(v) => v && handleAssign(order.id, parseInt(v))}>
                                <SelectTrigger className="h-9 text-sm rounded-xl flex-1">
                                  <SelectValue placeholder="Assign waiter..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {waiters.map((w) => <SelectItem key={w.id} value={String(w.id)}>{w.name}</SelectItem>)}
                                </SelectContent>
                              </Select>
                              <Button onClick={() => handleStatusUpdate(order.id, 'preparing')} size="sm" disabled={submitting} className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl px-3 disabled:opacity-50">
                                Preparing
                              </Button>
                            </div>
                            <Button onClick={() => setShowCancelModal(order.id)} size="sm" variant="outline" className="w-full rounded-xl text-red-600 border-red-200 hover:bg-red-50">
                              Cancel Order
                            </Button>
                          </div>
                        )}
                        {['preparing', 'ready', 'served'].includes(order.status) && (
                          <div className="flex gap-2">
                            {order.status === 'preparing' && <Button onClick={() => handleStatusUpdate(order.id, 'ready')} size="sm" disabled={submitting} className="flex-1 bg-violet-500 hover:bg-violet-600 text-white rounded-xl disabled:opacity-50">Ready</Button>}
                            {order.status === 'ready' && <Button onClick={() => handleStatusUpdate(order.id, 'served')} size="sm" disabled={submitting} className="flex-1 bg-blue-500 hover:bg-blue-600 text-white rounded-xl disabled:opacity-50">Served</Button>}
                            {order.status === 'served' && <Button onClick={() => handleStatusUpdate(order.id, 'paid')} size="sm" disabled={submitting} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl disabled:opacity-50">Mark Paid</Button>}
                            <Button onClick={() => setShowCancelModal(order.id)} size="sm" variant="outline" className="rounded-xl text-red-600 border-red-200">
                              <AlertTriangle className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )}
                      </div>
                      {order.waiter_id && (
                        <div className="mt-2 text-xs text-gray-400 flex items-center gap-1">
                          <Users className="h-3 w-3" /> {waiters.find((w) => w.id === order.waiter_id)?.name || 'Assigned'}
                        </div>
                      )}
                      {order.cancellation_reason && (
                        <div className="mt-1 text-xs text-red-500">Cancelled: {order.cancellation_reason}</div>
                      )}
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
      <AnimatePresence>
        {showCancelModal && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowCancelModal(null)} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white p-6 rounded-2xl max-w-sm w-full mx-4 shadow-2xl">
              <h3 className="text-lg font-bold mb-4">Cancel Order</h3>
              <Select value={selectedReason} onValueChange={setSelectedReason}>
                <SelectTrigger className="mb-4"><SelectValue placeholder="Select reason..." /></SelectTrigger>
                <SelectContent>
                  {cancelReasons.map((r: any) => <SelectItem key={r.id} value={r.reason}>{r.reason}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button onClick={handleCancel} disabled={!selectedReason || submitting} variant="destructive" className="flex-1 rounded-xl">Confirm Cancel</Button>
                <Button onClick={() => setShowCancelModal(null)} variant="outline" className="flex-1 rounded-xl">Back</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
