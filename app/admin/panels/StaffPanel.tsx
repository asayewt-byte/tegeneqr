'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { TableRowSkeleton } from '@/components/SkeletonCards';
import { getCached, setCache } from '@/lib/cache';
import { Trash2, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

const CACHE_KEY = 'staff';

export default function StaffPanel() {
  const [staff, setStaff] = useState<any[]>([]);
  const [newStaff, setNewStaff] = useState({ name: '', role: 'waiter', pin_code: '' });
  const [loading, setLoading] = useState(true);

  const loadStaff = () => { fetch('/api/staff?all=true').then((r) => r.json()).then((d) => { setStaff(d); setLoading(false); setCache(CACHE_KEY, d); }); };

  useEffect(() => {
    const cached = getCached<any[]>(CACHE_KEY);
    if (cached) { setStaff(cached); setLoading(false); return; }
    loadStaff();
    const channel = supabase
      .channel('admin-staff')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'staff' }, () => { loadStaff(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const add = async () => {
    if (!newStaff.name || !newStaff.pin_code) return;
    await fetch('/api/staff', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newStaff) });
    setNewStaff({ name: '', role: 'waiter', pin_code: '' }); loadStaff(); toast.success('Staff added');
  };

  const remove = async (id: number) => {
    if (!confirm('Delete this staff member?')) return;
    await fetch(`/api/staff?id=${id}`, { method: 'DELETE' }); loadStaff(); toast.success('Staff deleted');
  };

  const roleColors: Record<string, string> = { admin: 'bg-purple-100 text-purple-800', cashier: 'bg-blue-100 text-blue-800', waiter: 'bg-green-100 text-green-800' };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Staff Management</h2>
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex gap-2 flex-wrap">
            <Input placeholder="Name" value={newStaff.name} onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })} className="flex-1 min-w-[150px]" />
            <select value={newStaff.role} onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })} className="h-10 px-3 border rounded-xl text-sm">
              <option value="waiter">Waiter</option><option value="cashier">Cashier</option><option value="admin">Admin</option>
            </select>
            <Input placeholder="PIN" type="password" maxLength={4} value={newStaff.pin_code} onChange={(e) => setNewStaff({ ...newStaff, pin_code: e.target.value })} className="w-20 text-center" />
            <Button onClick={add} className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl">
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b"><tr><th className="p-4 text-left font-semibold">Name</th><th className="p-4 text-left font-semibold">Role</th><th className="p-4 text-left font-semibold">Status</th><th className="p-4 text-left font-semibold">Actions</th></tr></thead>
            <tbody>
              {loading ? [1,2,3].map((i) => <tr key={i}><td colSpan={4}><TableRowSkeleton /></td></tr>) :
              staff.map((s) => (
                <tr key={s.id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-medium">{s.name}</td>
                  <td className="p-4"><Badge className={cn(roleColors[s.role], 'border-0')}>{s.role}</Badge></td>
                  <td className="p-4"><Badge variant={s.is_active ? 'success' : 'secondary'}>{s.is_active ? 'Active' : 'Inactive'}</Badge></td>
                  <td className="p-4"><Button variant="ghost" size="sm" onClick={() => remove(s.id)} className="text-red-500 hover:text-red-700"><Trash2 className="h-3.5 w-3.5" /></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
