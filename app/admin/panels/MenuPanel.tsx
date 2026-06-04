'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { TableRowSkeleton } from '@/components/SkeletonCards';
import { getCached, setCache } from '@/lib/cache';
import { Edit, Trash2, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

const CACHE_KEY = 'menu';

export default function MenuPanel() {
  const [items, setItems] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadMenu = () => { fetch('/api/menu?all=true').then((r) => r.json()).then((d) => { setItems(d); setLoading(false); setCache(CACHE_KEY, d); }); };

  useEffect(() => {
    const cached = getCached<any[]>(CACHE_KEY);
    if (cached) { setItems(cached); setLoading(false); return; }
    loadMenu();
    const channel = supabase
      .channel('admin-menu')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, () => { loadMenu(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const save = async () => {
    if (!editing) return;
    const method = editing.id ? 'PUT' : 'POST';
    const url = editing.id ? `/api/menu/${editing.id}` : '/api/menu';
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editing) });
    setEditing(null); loadMenu(); toast.success(editing.id ? 'Item updated' : 'Item added');
  };

  const remove = async (id: number) => {
    if (!confirm('Delete this item?')) return;
    await fetch(`/api/menu/${id}`, { method: 'DELETE' });
    loadMenu(); toast.success('Item deleted');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Menu Items ({items.length})</h2>
        <Button onClick={() => setEditing({ name: '', price: 0, category: '', description: '', preparation_time: 10, is_available: 1, is_recommended: 0 })}
          className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl">
          <Plus className="h-4 w-4 mr-1" /> Add Item
        </Button>
      </div>
      {editing && (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="absolute inset-0 bg-black/50" onClick={() => setEditing(null)} />
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }}
            className="relative bg-white p-6 rounded-2xl max-w-lg w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">{editing.id ? 'Edit' : 'Add'} Menu Item</h3>
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Name" value={editing.name || ''} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="col-span-2" />
              <div className="col-span-2 flex items-center gap-3">
                <Input placeholder="Image URL" value={editing.image_url || ''} onChange={(e) => setEditing({ ...editing, image_url: e.target.value })} />
                {editing.image_url && <img src={editing.image_url} alt="" className="h-12 w-12 rounded-lg object-cover border" onError={(e) => (e.currentTarget.style.display = 'none')} />}
              </div>
              <div><label className="text-xs text-gray-500">Price (ETB)</label><Input type="number" value={editing.price || ''} onChange={(e) => setEditing({ ...editing, price: parseInt(e.target.value) })} /></div>
              <Input placeholder="Category" value={editing.category || ''} onChange={(e) => setEditing({ ...editing, category: e.target.value })} />
              <Input placeholder="Prep time (min)" type="number" value={editing.preparation_time || 10} onChange={(e) => setEditing({ ...editing, preparation_time: parseInt(e.target.value) })} />
              <textarea placeholder="Description" value={editing.description || ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className="col-span-2 p-3 border rounded-xl resize-none h-20 text-sm" />
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!editing.is_available} onChange={(e) => setEditing({ ...editing, is_available: e.target.checked ? 1 : 0 })} className="rounded" /> Available</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!editing.is_recommended} onChange={(e) => setEditing({ ...editing, is_recommended: e.target.checked ? 1 : 0 })} className="rounded" /> Recommended</label>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={save} className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl">Save</Button>
              <Button onClick={() => setEditing(null)} variant="outline" className="flex-1 rounded-xl">Cancel</Button>
            </div>
          </motion.div>
        </motion.div>
      )}
      <Card>
        <div className="overflow-x-auto">
              <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b"><tr>
              <th className="p-4 text-left font-semibold">Image</th><th className="p-4 text-left font-semibold">Name</th><th className="p-4 text-left font-semibold">Category</th><th className="p-4 text-right font-semibold">Price</th><th className="p-4 text-center font-semibold">Status</th><th className="p-4 text-left font-semibold">Actions</th>
            </tr></thead>
            <tbody>
              {loading ? [1,2,3,4,5].map((i) => <tr key={i}><td colSpan={6}><TableRowSkeleton /></td></tr>) :
              items.map((item) => {
                return (
                  <tr key={item.id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="p-3">{item.image_url ? <img src={item.image_url} alt="" className="h-10 w-10 rounded-lg object-cover" /> : <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center text-xs text-gray-400">N/A</div>}</td>
                    <td className="p-4 font-medium">{item.name}</td>
                    <td className="p-4 text-gray-500">{item.category}</td>
                    <td className="p-4 text-right font-medium">ETB {item.price.toLocaleString()}</td>
                    <td className="p-4 text-center"><Badge variant={item.is_available ? 'success' : 'secondary'}>{item.is_available ? 'Active' : 'Inactive'}</Badge></td>
                    <td className="p-4"><div className="flex gap-1"><Button variant="ghost" size="sm" onClick={() => setEditing(item)}><Edit className="h-3.5 w-3.5" /></Button><Button variant="ghost" size="sm" onClick={() => remove(item.id)} className="text-red-500 hover:text-red-700"><Trash2 className="h-3.5 w-3.5" /></Button></div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
