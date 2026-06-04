'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { io, Socket } from 'socket.io-client';
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

  useEffect(() => {
    if (!loggedIn || !cashier) return;
    setLoading(true);
    const s: Socket = io();
    s.emit('join-role', 'cashier');
    s.on('new-order', (order: Order) => {
      refreshOrders();
      playNotification();
      toast.success(`New order from Table ${order.table_number}!`, { icon: '🔔' });
    });
    s.on('order-updated', (updated: Order) => {
      refreshOrders();
    });
    Promise.all([
      fetch('/api/orders').then((r) => r.json()),
      fetch('/api/sessions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cashier_id: cashier.id, starting_cash: 0 }) }).then((r) => r.ok ? r.json() : null),
    ]).then(([ordersData, session]) => {
      setOrders(ordersData);
      if (session) setSessionId(session.id);
      setLoading(false);
    });
    return () => { s.disconnect(); };
  }, [loggedIn, cashier]);

  const handleLogin = async () => {
    const res = await fetch('/api/staff/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pin_code: pin, role: 'cashier' }) });
    if (res.ok) { const data = await res.json(); setCashier(data); setLoggedIn(true); toast.success(`Welcome, ${data.name}!`); }
    else { toast.error('Invalid PIN'); }
  };

  const handleLogout = async () => {
    if (sessionId) await fetch('/api/sessions', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: sessionId, ending_cash: 0 }) }).catch(() => {});
    setLoggedIn(false); setCashier(null); setSessionId(null); setPin(''); setOrders([]);
    toast.success('Logged out');
  };

  const refreshOrders = () => {
    fetch('/api/orders').then((r) => r.json()).then(setOrders);
  };

  const handleApprove = async (orderId: number) => {
    await fetch('/api/cashier', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order_id: orderId, action: 'approve', cashier_id: cashier?.id }) });
    toast.success('Order confirmed');
  };

  const handleAssign = async (orderId: number, waiterId: number) => {
    await fetch('/api/cashier', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order_id: orderId, action: 'assign', waiter_id: waiterId }) });
    toast.success('Waiter assigned');
  };

  const handleCancel = async () => {
    if (!showCancelModal || !selectedReason) return;
    await fetch('/api/cashier', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order_id: showCancelModal, action: 'cancel', cashier_id: cashier?.id, cancellation_reason: selectedReason }) });
    setShowCancelModal(null); setSelectedReason('');
    toast.success('Order cancelled');
  };

  const handleStatusUpdate = async (orderId: number, status: string) => {
    await fetch(`/api/orders/${orderId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status, cashier_id: cashier?.id }) });
    toast.success(`Order ${status}`);
  };

  if (!loggedIn) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-lg p-8 rounded-3xl shadow-2xl max-w-sm w-full border border-white/60">
        <div className="text-center mb-8">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.1 }}
            className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/30">
            <CheckCircle2 className="h-8 w-8 text-white" />
          </motion.div>
          <h1 className="text-2xl font-bold text-gray-900">Cashier Login</h1>
          <p className="text-gray-400 text-sm mt-1">Enter your PIN to start your shift</p>
        </div>
        <Input type="password" placeholder="• • • •" value={pin} onChange={(e) => setPin(e.target.value)}
          className="text-center text-2xl tracking-[0.5em] h-14 mb-4 rounded-xl" maxLength={4} autoFocus />
        <Button onClick={handleLogin} className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl shadow-lg shadow-amber-500/30">
          Start Shift
        </Button>
      </motion.div>
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
    { key: 'pending', label: 'Pending', short: 'Pend' },
    { key: 'active', label: 'Active', short: 'Active' },
    { key: 'cancelled', label: 'Cancelled', short: 'Canc' },
    { key: 'paid', label: 'Paid', short: 'Paid' },
    { key: 'all', label: 'All', short: 'All' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white sticky top-0 z-10">
        <div className="px-3 sm:px-4 py-3">
          {/* Top row: name + logout */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <h1 className="text-base sm:text-lg font-bold">{cashier?.name}</h1>
              <Badge variant="info" className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-[10px] sm:text-xs">{stats.pending} pending</Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-gray-400 hover:text-white hover:bg-white/10 text-xs sm:text-sm">
              <LogOut className="h-4 w-4 sm:mr-1" /><span className="hidden sm:inline">Logout</span>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-2 sm:gap-3 mb-3">
            {[
              { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-amber-400' },
              { label: 'Active', value: stats.active, icon: ChefHat, color: 'text-blue-400' },
              { label: 'Today', value: stats.today, icon: TrendingUp, color: 'text-emerald-400' },
              { label: 'Revenue', value: stats.revenue, icon: TrendingUp, color: 'text-orange-400', prefix: 'ETB ' },
            ].map((s) => (
              <div key={s.label} className="bg-white/10 rounded-xl p-2 sm:p-3">
                <div className="flex items-center gap-1 sm:gap-2 mb-0.5 sm:mb-1">
                  <s.icon className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${s.color}`} />
                  <span className="text-[9px] sm:text-[10px] text-gray-400 uppercase tracking-wider">{s.label}</span>
                </div>
                <AnimatedCounter value={s.value} prefix={s.prefix || ''} className={`text-base sm:text-xl font-bold ${s.color}`} />
              </div>
            ))}
          </div>

          {/* Filter Tabs — scrollable, compact on mobile */}
          <div className="flex gap-1 sm:gap-1.5 overflow-x-auto scrollbar-hide -mx-3 px-3 pb-1">
            {tabs.map((t) => (
              <button key={t.key} onClick={() => setFilter(t.key)}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-medium whitespace-nowrap transition-all ${
                  filter === t.key ? 'bg-white text-gray-900 shadow' : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}>
                <span className="sm:hidden">{t.short}</span>
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders Grid */}
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
                const items = JSON.parse(order.items || '[]');
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

                      {/* Actions */}
                      <div className="space-y-2">
                        {order.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button onClick={() => handleApprove(order.id)} size="sm"
                              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl">
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
                              <Button onClick={() => handleStatusUpdate(order.id, 'preparing')} size="sm" className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl px-3">
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
                            {order.status === 'preparing' && <Button onClick={() => handleStatusUpdate(order.id, 'ready')} size="sm" className="flex-1 bg-violet-500 hover:bg-violet-600 text-white rounded-xl">Ready</Button>}
                            {order.status === 'ready' && <Button onClick={() => handleStatusUpdate(order.id, 'served')} size="sm" className="flex-1 bg-blue-500 hover:bg-blue-600 text-white rounded-xl">Served</Button>}
                            {order.status === 'served' && <Button onClick={() => handleStatusUpdate(order.id, 'paid')} size="sm" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">Mark Paid</Button>}
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

      {/* Cancel Modal */}
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
                <Button onClick={handleCancel} disabled={!selectedReason} variant="destructive" className="flex-1 rounded-xl">Confirm Cancel</Button>
                <Button onClick={() => setShowCancelModal(null)} variant="outline" className="flex-1 rounded-xl">Back</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
