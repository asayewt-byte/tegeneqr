'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { LogOut, LayoutDashboard, UtensilsCrossed, Users, BarChart3, Menu, X, ChevronRight } from 'lucide-react';
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
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[1,2,3,4,5,6,7,8].map((i) => (
        <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
      ))}
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
  const [tab, setTab] = useState<Tab>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogin = async () => {
    const res = await fetch('/api/staff/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pin_code: pin, role: 'admin' }) });
    if (res.ok) { const data = await res.json(); setAdmin(data); setLoggedIn(true); toast.success(`Welcome, ${data.name}!`); }
    else toast.error('Invalid admin PIN');
  };

  const switchTab = (t: Tab) => { setTab(t); setMobileMenuOpen(false); };

  if (!loggedIn) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-lg p-8 rounded-3xl shadow-2xl max-w-sm w-full border border-white/60">
        <div className="text-center mb-8">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.1 }}
            className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/30">
            <BarChart3 className="h-8 w-8 text-white" />
          </motion.div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-400 text-sm mt-1">Management dashboard</p>
        </div>
        <input type="password" placeholder="• • • •" value={pin} onChange={(e) => setPin(e.target.value)}
          className="w-full text-center text-2xl tracking-[0.5em] h-14 mb-4 rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" maxLength={4} autoFocus />
        <Button onClick={handleLogin} className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl shadow-lg shadow-amber-500/30">
          Access Dashboard
        </Button>
      </motion.div>
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
            <Button variant="ghost" size="sm" onClick={() => { setLoggedIn(false); setAdmin(null); setPin(''); }}
              className="text-gray-400 hover:text-white hover:bg-white/10 ml-2">
              <LogOut className="h-4 w-4 mr-1" /> Logout
            </Button>
          </div>

          {/* Right: mobile logout */}
          <button onClick={() => { setLoggedIn(false); setAdmin(null); setPin(''); }}
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
    </div>
  );
}
