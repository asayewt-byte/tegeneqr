'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { ShoppingBag, Plus, Minus, X, Search, Clock, Star, ChevronDown, Check, Loader2, ChefHat, UtensilsCrossed, CircleDollarSign } from 'lucide-react';

function parseItems(items: any): any[] {
  if (!items) return [];
  if (Array.isArray(items)) return items;
  try { return JSON.parse(items); } catch { return []; }
}
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { getFoodImageSrcSet, getFoodImageSrc, getCategoryEmoji, getCategoryColor } from '@/lib/food-images';

interface MenuItem {
  id: number; name: string; price: number; category: string;
  description: string; image_url: string | null; is_available: number;
  is_recommended: number; preparation_time: number;
}

interface CartItem {
  menu_item_id: number; name: string; price: number;
  quantity: number; special_request: string; image_url?: string | null;
}

interface Order {
  id: number; order_number: string; status: string; total_amount: number;
  items: string; notes: string | null; created_at: string;
}

const STATUS_STEPS = [
  { key: 'pending', label: 'Order Placed', icon: Clock, color: 'amber' },
  { key: 'confirmed', label: 'Confirmed', icon: Check, color: 'emerald' },
  { key: 'preparing', label: 'Preparing', icon: ChefHat, color: 'orange' },
  { key: 'ready', label: 'Ready', icon: UtensilsCrossed, color: 'violet' },
  { key: 'served', label: 'Served', icon: CircleDollarSign, color: 'blue' },
];

function getStepIndex(status: string): number {
  if (status === 'cancelled') return -1;
  const idx = STATUS_STEPS.findIndex((s) => s.key === status);
  return idx >= 0 ? idx : 0;
}

export default function GuestMenu() {
  const params = useParams();
  const token = params.token as string;
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [showCart, setShowCart] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [trackingOrder, setTrackingOrder] = useState(false);
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);
  const [trackedOrders, setTrackedOrders] = useState<Order[]>([]);
  const [activeOrderIndex, setActiveOrderIndex] = useState(0);
  const [orderNumber, setOrderNumber] = useState('');
  const [orderAmount, setOrderAmount] = useState(0);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [ordering, setOrdering] = useState(false);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [tableInfo, setTableInfo] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [addedItemId, setAddedItemId] = useState<number | null>(null);
  const categoryNavRef = useRef<HTMLDivElement>(null);
  const categorySectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=250&fit=crop&q=75&auto=format';
    link.imageSrcset = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=250&fit=crop&q=75&auto=format 400w, https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&h=375&fit=crop&q=75&auto=format 600w, https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=500&fit=crop&q=75&auto=format 800w';
    link.imageSizes = '(max-width: 640px) 100vw, 800px';
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

  useEffect(() => {
    Promise.all([
      fetch('/api/menu').then((r) => r.json()),
      fetch('/api/tables').then((r) => r.json()),
    ]).then(([menu, tables]) => {
      setMenuItems(menu);
      setTableInfo(tables.find((t: any) => t.qr_token === token) || null);
      setLoading(false);
    });
  }, [token]);

  const categories = ['All', ...new Set(menuItems.map((i) => i.category))];

  const filtered = menuItems.filter((i) => {
    const matchCategory = activeCategory === 'All' || i.category === activeCategory;
    const matchSearch = !searchQuery || i.name.toLowerCase().includes(searchQuery.toLowerCase()) || i.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const addToCart = useCallback((item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.menu_item_id === item.id);
      if (existing) return prev.map((c) => c.menu_item_id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { menu_item_id: item.id, name: item.name, price: item.price, quantity: 1, special_request: '', image_url: item.image_url }];
    });
    setAddedItemId(item.id);
    setTimeout(() => setAddedItemId(null), 600);
  }, []);

  const updateQuantity = (menuItemId: number, delta: number) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.menu_item_id === menuItemId);
      if (!existing) return prev;
      const newQty = existing.quantity + delta;
      if (newQty <= 0) return prev.filter((c) => c.menu_item_id !== menuItemId);
      return prev.map((c) => c.menu_item_id === menuItemId ? { ...c, quantity: newQty } : c);
    });
  };

  const totalAmount = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const totalItems = cart.reduce((s, i) => s + i.quantity, 0);

  const scrollToCategory = (cat: string) => {
    setActiveCategory(cat);
    if (cat !== 'All' && categorySectionRefs.current[cat]) {
      const navHeight = categoryNavRef.current?.offsetHeight || 0;
      const elementTop = categorySectionRefs.current[cat]?.offsetTop || 0;
      window.scrollTo({ top: elementTop - navHeight - 16, behavior: 'smooth' });
    }
  };

  const placeOrder = async () => {
    if (ordering || cart.length === 0) return;
    setOrdering(true);
    const items = cart.map(({ menu_item_id, quantity, special_request, price }) => ({
      menu_item_id, quantity, special_request, unit_price: price,
    }));
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table_id: tableInfo?.id, items, notes: notes || null }),
    });
    const order = await res.json();
    const prevId = orderId;
    const prevNumber = orderNumber;
    const prevAmount = orderAmount;
    setOrderNumber(order.order_number);
    setOrderAmount(order.total_amount);
    if (prevId) {
      setTrackedOrders(prev => {
        const updated = prev.some(o => o.id === prevId) ? prev : [...prev, { id: prevId, order_number: prevNumber, status: 'pending', total_amount: prevAmount, items: '[]', notes: null, created_at: new Date().toISOString() }];
        saveTrackedOrders(updated);
        return updated;
      });
    }
    setOrderId(order.id);
    setOrderPlaced(true);
    setCart([]);
    setNotes('');
    setShowCart(false);
    setOrdering(false);
  };

  const saveTrackedOrders = (orders: Order[]) => {
    localStorage.setItem('qrtrack', JSON.stringify({ token, orders: orders.map(o => ({ id: o.id, order_number: o.order_number, total_amount: o.total_amount })) }));
  };

  const startTracking = () => {
    if (!orderId) return;
    setOrderPlaced(false);
    setTrackingOrder(true);
    const newOrder: Order = { id: orderId, order_number: orderNumber, status: 'pending', total_amount: orderAmount, items: '[]', notes: null, created_at: new Date().toISOString() };
    setTrackedOrder(newOrder);
    setTrackedOrders(prev => {
      const exists = prev.some(o => o.id === orderId);
      const updated = exists ? prev : [...prev, newOrder];
      saveTrackedOrders(updated);
      setActiveOrderIndex(updated.length - 1);
      return updated;
    });
  };

  const stopTracking = () => {
    localStorage.removeItem('qrtrack');
    setTrackingOrder(false);
    setTrackedOrder(null);
    setTrackedOrders([]);
    setOrderId(null);
    setActiveOrderIndex(0);
  };

  const switchToOrder = (idx: number) => {
    setActiveOrderIndex(idx);
    const order = trackedOrders[idx];
    if (order) {
      setTrackedOrder(order);
      setOrderId(order.id);
      setOrderNumber(order.order_number);
      setOrderAmount(order.total_amount);
    }
  };

  const refreshTrackedOrder = useCallback(async (oid: number) => {
    const res = await fetch(`/api/orders/${oid}`);
    if (res.ok) {
      const data = await res.json();
      setTrackedOrders(prev => {
        const updated = prev.map(o => o.id === oid ? data : o);
        saveTrackedOrders(updated);
        const allDone = updated.every(o => o.status === 'paid' || o.status === 'cancelled');
        if (allDone) setTimeout(() => stopTracking(), 3000);
        return updated;
      });
      setTrackedOrder(prev => prev?.id === oid ? data : prev);
    }
  }, []);

  useEffect(() => {
    if (trackedOrders.length === 0) return;
    const channels = trackedOrders.map(o =>
      supabase
        .channel(`order-${o.id}`)
        .on('postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${o.id}` },
          () => { refreshTrackedOrder(o.id); }
        )
        .subscribe()
    );
    return () => { channels.forEach(c => supabase.removeChannel(c)); };
  }, [trackedOrders.length, refreshTrackedOrder]);

  useEffect(() => {
    const saved = localStorage.getItem('qrtrack');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.token === token && data.orders?.length > 0) {
          const restored = data.orders.map((o: any) => ({ ...o, items: '[]', notes: null, created_at: new Date().toISOString(), status: 'pending' }));
          setTrackedOrders(restored);
          setActiveOrderIndex(restored.length - 1);
          setOrderId(restored[restored.length - 1].id);
          setOrderNumber(restored[restored.length - 1].order_number);
          setOrderAmount(restored[restored.length - 1].total_amount);
          setTrackingOrder(true);
          setTrackedOrder(restored[restored.length - 1]);
          restored.forEach((o: any) => refreshTrackedOrder(o.id));
        } else {
          localStorage.removeItem('qrtrack');
        }
      } catch { localStorage.removeItem('qrtrack'); }
    }
  }, [token, refreshTrackedOrder]);

  if (loading) return (
    <div className="min-h-screen bg-stone-50">
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-xl border-b border-stone-100">
        <div className="max-w-lg mx-auto px-5 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-2"><Skeleton className="h-6 w-24" /><Skeleton className="h-3 w-16" /></div>
            <Skeleton className="h-10 w-10 rounded-xl" />
          </div>
          <Skeleton className="h-10 w-full rounded-xl" />
          <div className="flex gap-2 mt-4">
            {[1,2,3,4,5].map((i) => <Skeleton key={i} className="h-9 w-20 rounded-full" />)}
          </div>
        </div>
      </div>
      <div className="max-w-lg mx-auto px-5 pt-6 space-y-6">
        {[1,2,3].map((i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-6 w-32" />
            {[1,2].map((j) => (
              <div key={j} className="bg-white rounded-2xl overflow-hidden shadow-sm">
                <Skeleton className="h-44 w-full" />
                <div className="p-4 space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-full" /><Skeleton className="h-8 w-24 rounded-lg" /></div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );

  if (trackingOrder && trackedOrder) {
    const stepIdx = getStepIndex(trackedOrder.status);
    const isCancelled = trackedOrder.status === 'cancelled';
    const isPaid = trackedOrder.status === 'paid';
    const items = parseItems(trackedOrder.items);

    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 p-5">
        <div className="max-w-sm mx-auto pt-8">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
            <div className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center shadow-xl ${
              isCancelled ? 'bg-red-500 shadow-red-500/30' : isPaid ? 'bg-emerald-500 shadow-emerald-500/30' : 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-amber-500/30'
            }`}>
              {isCancelled ? <X className="h-10 w-10 text-white" strokeWidth={3} /> :
               isPaid ? <Check className="h-10 w-10 text-white" strokeWidth={3} /> :
               <Loader2 className="h-10 w-10 text-white animate-spin" />}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              {isCancelled ? 'Order Cancelled' : isPaid ? 'Payment Complete' : 'Tracking Order'}
            </h1>
            <p className="font-mono text-amber-600 font-bold">{trackedOrder.order_number}</p>
            <p className="text-gray-500 text-sm">Table {tableInfo?.table_number}</p>
          </motion.div>
          {!isCancelled && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="bg-white rounded-3xl shadow-xl p-6 mb-4">
              <div className="space-y-0">
                {STATUS_STEPS.map((step, idx) => {
                  const isActive = idx === stepIdx;
                  const isComplete = idx < stepIdx || isPaid;
                  const Icon = step.icon;
                  return (
                    <div key={step.key} className="flex items-start gap-4">
                      <div className="flex flex-col items-center">
                        <motion.div initial={false} animate={{
                          scale: isActive ? 1.1 : 1,
                          backgroundColor: isComplete || isPaid ? '#f59e0b' : isActive ? '#f59e0b' : '#e5e7eb',
                        }} className={`w-10 h-10 rounded-full flex items-center justify-center z-10 ${
                          isActive ? 'ring-4 ring-amber-200' : ''
                        }`}>
                          {isComplete || isPaid ? (
                            <Check className="h-5 w-5 text-white" strokeWidth={3} />
                          ) : (
                            <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                          )}
                        </motion.div>
                        {idx < STATUS_STEPS.length - 1 && (
                          <div className={`w-0.5 h-8 ${isComplete ? 'bg-amber-400' : 'bg-gray-200'}`} />
                        )}
                      </div>
                      <div className="pt-2">
                        <p className={`text-sm font-semibold ${isActive ? 'text-amber-600' : isComplete ? 'text-gray-900' : 'text-gray-400'}`}>
                          {step.label}
                        </p>
                        {isActive && !isPaid && (
                          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="text-xs text-amber-500 mt-0.5">
                            {step.key === 'pending' && 'Waiting for staff to confirm...'}
                            {step.key === 'confirmed' && 'Your order is being prepared...'}
                            {step.key === 'preparing' && 'Kitchen is working on your order...'}
                            {step.key === 'ready' && 'Your food is ready!'}
                            {step.key === 'served' && 'Please pay at the table'}
                          </motion.p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="bg-white rounded-3xl shadow-xl p-6 mb-4">
            <h3 className="font-bold text-gray-900 mb-3">Order Details</h3>
            <div className="space-y-2">
              {items.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="text-gray-600">{item.quantity}x {item.name}</span>
                  <span className="font-medium">ETB {(item.subtotal || item.unit_price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
              <div className="flex justify-between pt-2 border-t font-bold">
                <span>Total</span>
                <span className="text-amber-600">ETB {trackedOrder.total_amount.toLocaleString()}</span>
              </div>
            </div>
          </motion.div>
          {trackedOrders.length > 1 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl shadow-xl p-4 mb-4 flex items-center gap-2 overflow-x-auto">
              <span className="text-xs text-gray-400 font-medium whitespace-nowrap">Your orders:</span>
              {trackedOrders.map((o, idx) => (
                <button key={o.id} onClick={() => switchToOrder(idx)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                    trackedOrder.id === o.id
                      ? 'bg-amber-500 text-white shadow'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}>
                  #{o.order_number?.slice(-4)}
                </button>
              ))}
            </motion.div>
          )}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="space-y-3">
            {!isPaid && !isCancelled && (
              <Button onClick={() => setTrackingOrder(false)}
                size="lg" className="w-full bg-white border-2 border-amber-400 text-amber-600 hover:bg-amber-50 font-bold rounded-2xl h-14 shadow-lg">
                + Add More Items
              </Button>
            )}
            {(isPaid || isCancelled) && (
              <Button onClick={() => { stopTracking(); }}
                size="lg" className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-2xl h-14 shadow-lg shadow-amber-500/30">
                Order Again
              </Button>
            )}
            <p className="text-xs text-gray-400 text-center">Updates are live — this screen refreshes automatically</p>
          </motion.div>
        </div>
      </div>
    );
  }

  if (orderPlaced) return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 flex items-center justify-center p-5">
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', damping: 15 }}
        className="bg-white rounded-[2rem] shadow-2xl p-10 max-w-sm w-full text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400" />
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
          className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-xl shadow-amber-500/30">
          <Check className="h-12 w-12 text-white" strokeWidth={3} />
        </motion.div>
        <motion.h2 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}
          className="text-3xl font-bold text-gray-900 mb-2">Order Placed!</motion.h2>
        <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}
          className="font-mono text-amber-600 font-bold text-lg mb-1">{orderNumber}</motion.p>
        <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.55 }}
          className="text-gray-500 mb-6">Table {tableInfo?.table_number} · ETB {orderAmount.toLocaleString()}</motion.p>
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }}
          className="bg-amber-50 border border-amber-200/60 rounded-2xl p-5 mb-6">
          <p className="text-amber-800 font-medium">A waiter will confirm your order shortly.</p>
          <p className="text-amber-600/80 text-sm mt-1">Track your order status in real-time</p>
        </motion.div>
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.7 }}
          className="space-y-3">
          <Button onClick={startTracking} size="lg" className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-2xl h-14 text-base shadow-lg shadow-amber-500/30">
            Track Order
          </Button>
          <Button onClick={() => { setOrderPlaced(false); setOrderId(null); }} size="lg" variant="ghost" className="w-full h-12 text-gray-500 font-medium">
            Order Again
          </Button>
          <p className="text-xs text-gray-400">Cash payment at table</p>
        </motion.div>
      </motion.div>
    </div>
  );

  const firstVisibleCat = categories.filter(c => c !== 'All')[0];
  const firstItemByCategory = filtered.filter(i => i.category === firstVisibleCat);

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="relative h-56 bg-gradient-to-br from-amber-600 via-orange-500 to-amber-700 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=250&fit=crop&q=75&auto=format"
          srcSet="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=250&fit=crop&q=75&auto=format 400w, https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&h=375&fit=crop&q=75&auto=format 600w, https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=500&fit=crop&q=75&auto=format 800w"
          sizes="(max-width: 640px) 100vw, 800px"
          fetchPriority="high"
          alt="Restaurant interior"
          className="absolute inset-0 w-full h-full object-cover opacity-20"
          loading="lazy"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-5 pb-4">
          <div className="max-w-lg mx-auto">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
              <p className="text-amber-200 text-sm font-medium mb-1">Welcome to</p>
              <h1 className="text-3xl font-bold text-white mb-1">Buna BeNet</h1>
              <p className="text-white/70 text-sm">Table {tableInfo?.table_number} · Traditional Ethiopian Cuisine</p>
            </motion.div>
          </div>
        </div>
      </div>
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-xl border-b border-stone-100 shadow-sm" ref={categoryNavRef}>
        <div className="max-w-lg mx-auto px-5 pt-3 pb-2">
          <div className={`relative mb-3 transition-all duration-200 ${searchFocused ? 'scale-[1.02]' : ''}`}>
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <input type="text" placeholder="Search our menu..."
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)}
              className="w-full pl-10 pr-4 py-3 bg-stone-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:bg-white focus:shadow-md transition-all placeholder:text-stone-400" />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 bg-stone-200 rounded-full hover:bg-stone-300 transition">
                <X className="h-3 w-3 text-stone-500" />
              </button>
            )}
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-5 px-5 pb-2">
            {categories.map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <button key={cat} onClick={() => scrollToCategory(cat)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30 scale-105'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200 active:scale-95'
                  }`}>
                  <span className="text-base">{getCategoryEmoji(cat)}</span>
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div className="max-w-lg mx-auto px-5 pt-4 pb-32">
        {searchQuery && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-sm text-stone-400 mb-4">{filtered.length} result{filtered.length !== 1 ? 's' : ''} for &quot;{searchQuery}&quot;</motion.p>
        )}
        {categories.filter(c => c !== 'All').map((cat) => {
          const catItems = filtered.filter((i) => i.category === cat);
          if (catItems.length === 0) return null;
          return (
            <div key={cat} ref={(el) => { categorySectionRefs.current[cat] = el; }} className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getCategoryColor(cat)} flex items-center justify-center shadow-lg`}>
                  <span className="text-xl">{getCategoryEmoji(cat)}</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{cat}</h2>
                  <p className="text-xs text-stone-400">{catItems.length} item{catItems.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <div className="space-y-4">
                {catItems.map((item, idx) => {
                  const cartItem = cart.find((c) => c.menu_item_id === item.id);
                  const justAdded = addedItemId === item.id;
                  const isFirstVisibleItem = cat === firstVisibleCat && idx === 0;
                  return (
                    <motion.div key={item.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05, duration: 0.3 }}
                      className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-stone-100 group">
                      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-amber-100 to-orange-200">
                        <img
                          src={item.image_url || getFoodImageSrc(item.name, 'w600')}
                          srcSet={item.image_url ? undefined : getFoodImageSrcSet(item.name)}
                          sizes="(max-width: 640px) 100vw, 600px"
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                          fetchPriority={isFirstVisibleItem ? 'high' : 'auto'}
                          loading={isFirstVisibleItem ? 'eager' : 'lazy'}
                          decoding="async"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                        <div className="absolute top-3 left-3 flex gap-2">
                          {item.is_recommended === 1 && (
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}>
                              <Badge className="bg-amber-500 text-white border-0 shadow-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">
                                <Star className="h-3 w-3 mr-0.5 fill-white" /> Popular
                              </Badge>
                            </motion.div>
                          )}
                        </div>
                        <div className="absolute bottom-3 right-3">
                          <div className="bg-white/95 backdrop-blur-sm rounded-xl px-3 py-1.5 shadow-lg">
                            <span className="text-lg font-bold text-amber-600">ETB {item.price.toLocaleString()}</span>
                          </div>
                        </div>
                        {item.preparation_time > 0 && (
                          <div className="absolute bottom-3 left-3">
                            <div className="bg-black/60 backdrop-blur-sm rounded-lg px-2.5 py-1 flex items-center gap-1">
                              <Clock className="h-3 w-3 text-white/80" />
                              <span className="text-xs text-white/90 font-medium">~{item.preparation_time}m</span>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-900 text-base mb-1 truncate">{item.name}</h3>
                            <p className="text-sm text-stone-500 line-clamp-2 leading-relaxed">{item.description}</p>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            {[1,2,3,4,5].map((s) => (
                              <Star key={s} className="h-3 w-3 fill-amber-400 text-amber-400" />
                            ))}
                            <span className="text-xs text-stone-400 ml-1">4.{8 - (item.id % 3)}</span>
                          </div>
                          {cartItem ? (
                            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }}
                              className="flex items-center gap-0 bg-stone-900 rounded-xl overflow-hidden shadow-lg">
                              <button onClick={() => updateQuantity(item.id, -1)}
                                className="w-10 h-10 flex items-center justify-center text-white hover:bg-stone-800 transition active:scale-90">
                                <Minus className="h-4 w-4" />
                              </button>
                              <motion.span key={cartItem.quantity}
                                initial={{ scale: 1.3 }} animate={{ scale: 1 }}
                                className="font-bold text-white w-8 text-center text-sm">{cartItem.quantity}</motion.span>
                              <button onClick={() => addToCart(item)}
                                className="w-10 h-10 flex items-center justify-center text-white hover:bg-stone-800 transition active:scale-90">
                                <Plus className="h-4 w-4" />
                              </button>
                            </motion.div>
                          ) : (
                            <motion.button whileTap={{ scale: 0.92 }}
                              onClick={() => addToCart(item)}
                              className={`flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-300 ${
                                justAdded
                                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                                  : 'bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40'
                              }`}>
                              {justAdded ? (
                                <><Check className="h-4 w-4" /> Added</>
                              ) : (
                                <><Plus className="h-4 w-4" /> Add</>
                              )}
                            </motion.button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-4 bg-stone-100 rounded-full flex items-center justify-center">
              <Search className="h-8 w-8 text-stone-300" />
            </div>
            <p className="text-stone-400 font-medium text-lg">No items found</p>
            <p className="text-stone-300 text-sm mt-1">Try a different search or category</p>
          </div>
        )}
      </div>
      <AnimatePresence>
        {totalItems > 0 && !showCart && (
          <motion.div
            initial={{ y: 120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 120, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
            className="fixed bottom-6 left-4 right-4 z-30 max-w-lg mx-auto"
          >
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowCart(true)}
              className="w-full bg-stone-900 text-white rounded-2xl px-5 py-4 shadow-2xl shadow-black/20 flex items-center justify-between hover:bg-stone-800 transition-colors">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <ShoppingBag className="h-5 w-5" />
                  <motion.span key={totalItems} initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 bg-amber-500 text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center">
                    {totalItems}
                  </motion.span>
                </div>
                <span className="font-bold">View Cart</span>
              </div>
              <div className="flex items-center gap-2">
                <motion.span key={totalAmount} initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                  className="font-bold text-amber-400">ETB {totalAmount.toLocaleString()}</motion.span>
                <ChevronDown className="h-4 w-4 text-stone-400 rotate-[-90deg]" />
              </div>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showCart && (
          <motion.div className="fixed inset-0 z-50">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowCart(false)} />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 250 }}
              className="absolute bottom-0 left-0 right-0 max-h-[85vh] bg-white rounded-t-[2rem] shadow-2xl flex flex-col overflow-hidden">
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 bg-stone-200 rounded-full" />
              </div>
              <div className="flex items-center justify-between px-6 py-3 border-b border-stone-100">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Your Order</h2>
                  <p className="text-sm text-stone-400">Table {tableInfo?.table_number}</p>
                </div>
                <button onClick={() => setShowCart(false)} className="p-2.5 hover:bg-stone-100 rounded-xl transition">
                  <X className="h-5 w-5 text-stone-500" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {cart.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 mx-auto mb-4 bg-stone-100 rounded-full flex items-center justify-center">
                      <ShoppingBag className="h-8 w-8 text-stone-300" />
                    </div>
                    <p className="text-stone-400 font-medium">Your cart is empty</p>
                    <p className="text-stone-300 text-sm mt-1">Add some delicious items</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cart.map((item) => (
                      <motion.div key={item.menu_item_id} layout
                        className="flex items-center gap-4 p-3 bg-stone-50 rounded-2xl">
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-amber-100 to-orange-200 shrink-0">
                          <img
                            src={item.image_url || getFoodImageSrc(item.name, 'w400')}
                            alt={item.name}
                            className="w-full h-full object-cover shadow-sm"
                            loading="lazy"
                            decoding="async"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 text-sm truncate">{item.name}</h3>
                          <p className="text-xs text-stone-400">ETB {item.price.toLocaleString()}</p>
                        </div>
                        <div className="flex items-center gap-2 bg-white rounded-xl border border-stone-200 shadow-sm">
                          <button onClick={() => updateQuantity(item.menu_item_id, -1)}
                            className="w-8 h-8 flex items-center justify-center hover:bg-stone-50 rounded-l-xl transition active:scale-90">
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="font-bold text-sm w-5 text-center">{item.quantity}</span>
                          <button onClick={() => addToCart({ id: item.menu_item_id } as MenuItem)}
                            className="w-8 h-8 flex items-center justify-center hover:bg-stone-50 rounded-r-xl transition active:scale-90">
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <span className="font-bold text-sm text-stone-900 w-16 text-right">ETB {(item.price * item.quantity).toLocaleString()}</span>
                      </motion.div>
                    ))}
                    <div className="pt-2">
                      <textarea placeholder="Any special requests?" value={notes} onChange={(e) => setNotes(e.target.value)}
                        className="w-full p-3.5 bg-stone-50 rounded-2xl text-sm resize-none border-0 focus:ring-2 focus:ring-amber-500/20 outline-none placeholder:text-stone-400" rows={2} />
                    </div>
                  </div>
                )}
              </div>
              {cart.length > 0 && (
                <div className="border-t border-stone-100 px-6 py-5 space-y-4 bg-white">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-stone-500">Subtotal</span>
                      <span className="font-medium">ETB {totalAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-stone-500 text-sm">Tax</span>
                      <span className="text-stone-400 text-sm">Calculated at table</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                      <span className="text-lg font-bold text-gray-900">Total</span>
                      <span className="text-xl font-bold text-amber-600">ETB {totalAmount.toLocaleString()}</span>
                    </div>
                  </div>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={placeOrder} disabled={ordering}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-2xl py-4 text-base shadow-xl shadow-amber-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                    {ordering ? 'Placing order...' : `Place Order — ETB ${totalAmount.toLocaleString()}`}
                  </motion.button>
                  <p className="text-xs text-stone-400 text-center">Cash payment at table</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
