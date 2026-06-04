'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { getCached, setCache } from '@/lib/cache';
import { Download, Trash2, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

const CACHE_KEY = 'tables';

export default function TablesPanel() {
  const [tables, setTables] = useState<any[]>([]);
  const [newNum, setNewNum] = useState('');
  const [loading, setLoading] = useState(true);

  const loadTables = () => { fetch('/api/tables').then((r) => r.json()).then((d) => { setTables(d); setLoading(false); setCache(CACHE_KEY, d); }); };

  useEffect(() => {
    const cached = getCached<any[]>(CACHE_KEY);
    if (cached) { setTables(cached); setLoading(false); return; }
    loadTables();
    const channel = supabase
      .channel('admin-tables')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tables' }, () => { loadTables(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const addTable = async () => {
    if (!newNum) return;
    await fetch('/api/tables', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ table_number: parseInt(newNum) }) });
    setNewNum(''); loadTables(); toast.success('Table added');
  };

  const remove = async (id: number) => {
    if (!confirm('Delete this table?')) return;
    await fetch(`/api/tables?id=${id}`, { method: 'DELETE' }); loadTables(); toast.success('Table deleted');
  };

  const downloadQR = async (table: any) => {
    const QRCode = (await import('qrcode')).default;
    const url = `${window.location.origin}/a/${table.qr_token}`;
    const canvas = document.createElement('canvas');
    await QRCode.toCanvas(canvas, url, { width: 300, margin: 2 });
    const link = document.createElement('a');
    link.download = `table-${table.table_number}-qr.png`;
    link.href = canvas.toDataURL(); link.click();
    toast.success(`QR downloaded for Table ${table.table_number}`);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Tables & QR Codes</h2>
        <div className="flex gap-2">
          <Input placeholder="Table number" type="number" value={newNum} onChange={(e) => setNewNum(e.target.value)} className="w-32" />
          <Button onClick={addTable} className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl">
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {tables.map((table, i) => (
          <motion.div key={table.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
            <Card className="card-hover">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-bold">Table {table.table_number}</h3>
                  {table.active_orders > 0 && <Badge variant="info">{table.active_orders} orders</Badge>}
                </div>
                <div className="bg-gray-50 rounded-xl p-2 mb-3">
                  <p className="text-[10px] text-gray-400 break-all font-mono">{typeof window !== 'undefined' ? `${window.location.origin}/a/${table.qr_token}` : ''}</p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => downloadQR(table)} size="sm" className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl">
                    <Download className="h-3.5 w-3.5 mr-1" /> QR
                  </Button>
                  <Button onClick={() => remove(table.id)} size="sm" variant="outline" className="rounded-xl text-red-600 border-red-200 hover:bg-red-50">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
