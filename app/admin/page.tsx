'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LogOut, LayoutDashboard, UtensilsCrossed, Users, BarChart3, Menu, X, ChevronRight, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

type Tab = 'dashboard' | 'menu' | 'tables' | 'staff' | 'reports';

const DashboardPanel = dynamic(() => import('./panels/DashboardPanel'), { loading: () => <PanelSkeleton /> });
const MenuPanel = dynamic(() => import('./panels/MenuPanel'), { loading: () => <PanelSkeleton /> });
const TablesPanel = dynamic(() => import('./panels/TablesPanel'), { loading: () => <PanelSkeleton /> });
const StaffPanel = dynamic(() => import('./panels/StaffPanel'), { loading: () => <PanelSkeleton /> });
const ReportsPanel = dynamic(() => import('./panels/ReportsPanel'), { loading: () => <PanelSkeleton /> });

function PanelSkeleton() {
  return (
    <div className="animate-pulse space-y-5" role="status" aria-label="Loading">
      <div className="flex items-center justify-between mb-4">
        <div className="h-7 bg-stone-700/70 rounded-lg w-48" />
        <div className="h-10 bg-stone-700/70 rounded-xl w-28" />
      </div>
      <div className="bg-stone-100/50 rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="p-5 space-y-4">
          <div className="h-4 bg-stone-700/60 rounded w-3/4" />
          <div className="h-4 bg-stone-700/60 rounded w-1/2" />
          <div className="border-t border-stone-200 pt-4 space-y-3">
            {[1,2,3,4,5].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-10 bg-stone-600/50 rounded-full w-10" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-stone-700/60 rounded w-full" />
                  <div className="h-3 bg-stone-600/50 rounded w-2/3" />
                </div>
                <div className="h-3 bg-stone-700/60 rounded w-16" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const tabs: { key: Tab; label: string; icon: any }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'menu', label: 'Menu', icon: UtensilsCrossed },
  { key: 'tables', label: 'Tables', icon: UtensilsCrossed },
  { key: 'staff', label: 'Staff', icon: Users },
  { key: 'reports', label: 'Reports', icon: BarChart3 },
];

export default function AdminPage() {
  const [pin, setPin] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [admin, setAdmin] = useState<any>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('admin_session');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setAdmin(data);
        setLoggedIn(true);
      } catch { localStorage.removeItem('admin_session'); }
    }
    setHydrated(true);
  }, []);
  const [tab, setTab] = useState<Tab>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showChangePin, setShowChangePin] = useState(false);
  const [pinForm, setPinForm] = useState({ current_pin: '', new_pin: '', confirm_pin: '' });
  const [changingPin, setChangingPin] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);

  const handleLogin = async () => {
    if (loggingIn) return;
    setLoggingIn(true);
    const res = await fetch('/api/staff/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pin_code: pin, role: 'admin' }) });
    setLoggingIn(false);
    if (res.ok) { const data = await res.json(); setAdmin(data); setLoggedIn(true); localStorage.setItem('admin_session', JSON.stringify(data)); toast.success(`Welcome, ${data.name}!`); }
    else toast.error('Invalid admin PIN');
  };

  const switchTab = (t: Tab) => { setTab(t); setMobileMenuOpen(false); };

  if (!hydrated) return null;
  if (!loggedIn) return (
    <div className="relative min-h-screen flex overflow-hidden bg-gray-950">
      {/* Photo — left half on desktop, full on mobile */}
      <div className="absolute inset-0 lg:inset-y-0 lg:left-0 lg:w-1/2">
        <div className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=1200&q=85')" }}>
          <div className="absolute inset-0 bg-gradient-to-r from-gray-950/80 via-gray-950/60 to-transparent lg:bg-gradient-to-r lg:from-gray-950 lg:via-gray-950/50 lg:to-transparent" />
        </div>
      </div>

      {/* Brand panel — visible on desktop */}
      <div className="hidden lg:flex absolute left-0 top-0 bottom-0 w-1/2 flex-col justify-between p-12 z-10">
        <div>
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <span className="text-white/90 text-sm font-semibold tracking-widest uppercase">Buna BeNet</span>
          </div>
          <h1 className="text-4xl font-bold text-white leading-tight">Executive<br/>Dashboard</h1>
          <p className="text-white/50 text-sm mt-3 max-w-xs leading-relaxed">Full control over menu, staff, tables, and business reports.</p>
        </div>
        <div>
          <div className="flex items-center gap-3 text-white/30 text-xs">
            <div className="h-px w-8 bg-white/20" />
            <span>Secure Administrative Access</span>
          </div>
        </div>
      </div>

      {/* Login card — right side on desktop, centered on mobile */}
      <div className="relative flex-1 flex items-center justify-center min-h-screen px-4 py-12 lg:ml-[50%]">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm">
          {/* Mobile brand bar */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-10">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <span className="text-white/90 text-sm font-semibold tracking-widest uppercase">Buna BeNet</span>
          </div>

          <div className="bg-white/[0.04] backdrop-blur-2xl rounded-3xl p-8 border border-white/[0.06] shadow-2xl">
            {/* Icon */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-indigo-500 to-violet-700 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-500/20 ring-1 ring-white/10">
                <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white">Admin Access</h2>
              <p className="text-white/40 text-sm mt-1">Enter your PIN to continue</p>
            </div>

            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                </div>
                <input type="password" placeholder="PIN Code" value={pin} onChange={(e) => setPin(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 text-white placeholder:text-white/25 rounded-2xl text-base font-mono tracking-widest outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/15 transition-all" maxLength={4} autoFocus />
              </div>
              <Button type="submit" disabled={loggingIn}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white font-semibold rounded-2xl shadow-xl shadow-indigo-500/25 text-base transition-all hover:shadow-2xl hover:shadow-indigo-500/30 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-xl">
                {loggingIn ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    Verifying...
                  </span>
                ) : 'Sign In'}
              </Button>
            </form>

            <p className="text-white/20 text-xs text-center mt-6 tracking-wide">Authorized personnel only</p>
          </div>
        </motion.div>
      </div>
    </div>
  );

  const activeTab = tabs.find((t) => t.key === tab);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Left: hamburger + title */}
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 hover:bg-white/10 rounded-xl transition">
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div>
              <h1 className="text-sm sm:text-lg font-bold">Admin: {admin?.name}</h1>
              <p className="text-xs text-gray-400 sm:hidden">{activeTab?.label}</p>
            </div>
          </div>

          {/* Right: desktop tabs + logout */}
          <div className="hidden lg:flex items-center gap-2">
            {tabs.map((t) => (
              <Button key={t.key} onClick={() => setTab(t.key)} variant="ghost" size="sm"
                className={cn('text-gray-400 hover:text-white hover:bg-white/10', tab === t.key && 'bg-white/15 text-white')}>
                <t.icon className="h-4 w-4 mr-1.5" />{t.label}
              </Button>
            ))}
            <Button variant="ghost" size="sm" onClick={() => setShowChangePin(true)}
              className="text-gray-400 hover:text-white hover:bg-white/10">
              <KeyRound className="h-4 w-4 mr-1" /> PIN
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { setLoggedIn(false); setAdmin(null); setPin(''); localStorage.removeItem('admin_session'); }}
              className="text-gray-400 hover:text-white hover:bg-white/10 ml-2">
              <LogOut className="h-4 w-4 mr-1" /> Logout
            </Button>
          </div>

          {/* Right: mobile logout */}
          <button onClick={() => { setLoggedIn(false); setAdmin(null); setPin(''); localStorage.removeItem('admin_session'); }}
            className="lg:hidden p-2 hover:bg-white/10 rounded-xl transition text-gray-400 hover:text-white">
            <LogOut className="h-5 w-5" />
          </button>
        </div>

        {/* Mobile slide-down menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="lg:hidden overflow-hidden border-t border-white/10">
              <div className="p-2 space-y-1">
                {tabs.map((t) => {
                  const isActive = tab === t.key;
                  return (
                    <button key={t.key} onClick={() => switchTab(t.key)}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
                        isActive ? 'bg-white/15 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                      )}>
                      <t.icon className="h-5 w-5" />
                      <span>{t.label}</span>
                      {isActive && <ChevronRight className="h-4 w-4 ml-auto" />}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-4">
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
            {tab === 'dashboard' && <DashboardPanel />}
            {tab === 'menu' && <MenuPanel />}
            {tab === 'tables' && <TablesPanel />}
            {tab === 'staff' && <StaffPanel />}
            {tab === 'reports' && <ReportsPanel />}
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showChangePin && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/50" onClick={() => { setShowChangePin(false); setPinForm({ current_pin: '', new_pin: '', confirm_pin: '' }); }} />
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="relative bg-white p-6 rounded-2xl max-w-sm w-full mx-4 shadow-2xl">
              <h3 className="text-xl font-bold mb-4">Change PIN</h3>
              <div className="space-y-3">
                <Input type="password" placeholder="Current PIN" value={pinForm.current_pin} maxLength={10}
                  onChange={(e) => setPinForm({ ...pinForm, current_pin: e.target.value })} />
                <Input type="password" placeholder="New PIN" value={pinForm.new_pin} maxLength={10}
                  onChange={(e) => setPinForm({ ...pinForm, new_pin: e.target.value })} />
                <Input type="password" placeholder="Confirm new PIN" value={pinForm.confirm_pin} maxLength={10}
                  onChange={(e) => setPinForm({ ...pinForm, confirm_pin: e.target.value })} />
              </div>
              <div className="flex gap-2 mt-4">
                <Button onClick={async () => {
                  if (pinForm.new_pin !== pinForm.confirm_pin) { toast.error('PINs do not match'); return; }
                  if (pinForm.new_pin.length < 4) { toast.error('PIN must be at least 4 characters'); return; }
                  setChangingPin(true);
                  const res = await fetch('/api/staff/change-pin', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: admin?.id, current_pin: pinForm.current_pin, new_pin: pinForm.new_pin }),
                  });
                  setChangingPin(false);
                  if (res.ok) {
                    toast.success('PIN changed successfully');
                    setShowChangePin(false);
                    setPinForm({ current_pin: '', new_pin: '', confirm_pin: '' });
                  } else {
                    const err = await res.json();
                    toast.error(err.error || 'Failed to change PIN');
                  }
                }} disabled={changingPin} className="flex-1 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white rounded-xl">
                  {changingPin ? 'Saving...' : 'Save'}
                </Button>
                <Button onClick={() => { setShowChangePin(false); setPinForm({ current_pin: '', new_pin: '', confirm_pin: '' }); }} variant="outline" className="flex-1 rounded-xl">Cancel</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
