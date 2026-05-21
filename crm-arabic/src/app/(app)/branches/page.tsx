'use client';
import { useEffect, useState } from 'react';
import { Plus, Store, MapPin, Phone, User as UserIcon, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { createClient } from '@/lib/supabase-client';
import { toast } from 'sonner';
import type { Branch } from '@/types';

export default function BranchesPage() {
  const supabase = createClient();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [form, setForm] = useState({ name: '', address: '', phone: '', manager_name: '', is_active: true });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('branches').select('*').order('created_at', { ascending: false });
    setBranches((data || []) as Branch[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel('branches-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'branches' }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', address: '', phone: '', manager_name: '', is_active: true });
    setDialogOpen(true);
  };

  const openEdit = (b: Branch) => {
    setEditing(b);
    setForm({
      name: b.name,
      address: b.address || '',
      phone: b.phone || '',
      manager_name: b.manager_name || '',
      is_active: b.is_active,
    });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) { toast.error('اسم الفرع مطلوب'); return; }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      address: form.address.trim() || null,
      phone: form.phone.trim() || null,
      manager_name: form.manager_name.trim() || null,
      is_active: form.is_active,
    };
    const result = editing
      ? await supabase.from('branches').update(payload).eq('id', editing.id)
      : await supabase.from('branches').insert(payload);
    setSaving(false);
    if (result.error) { toast.error('فشل الحفظ: ' + result.error.message); return; }
    toast.success(editing ? '✅ تم التعديل' : '✅ تم إضافة الفرع');
    setDialogOpen(false);
  };

  const del = async (b: Branch) => {
    if (!confirm(`حذف "${b.name}"؟`)) return;
    const { error } = await supabase.from('branches').delete().eq('id', b.id);
    if (error) { toast.error('فشل الحذف: ' + error.message); return; }
    toast.success('🗑️ تم الحذف');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">الفروع</h1>
          <p className="mt-1 text-sm text-muted-foreground">{branches.length} فرع</p>
        </div>
        <Button onClick={openCreate} size="lg" className="gap-2">
          <Plus className="h-4 w-4" /> إضافة فرع
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-48 animate-pulse rounded-xl bg-muted" />)}
        </div>
      ) : branches.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Store className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium">لا توجد فروع</p>
            <Button onClick={openCreate} className="mt-4">
              <Plus className="h-4 w-4" /> إضافة فرع
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {branches.map((b) => (
            <Card key={b.id} className="overflow-hidden transition-shadow hover:shadow-lg">
              <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg">
                      <Store className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-bold">{b.name}</h3>
                      <Badge variant={b.is_active ? 'success' : 'secondary'} className="mt-1 text-[10px]">
                        {b.is_active ? 'نشط' : 'متوقف'}
                      </Badge>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(b)}><Edit className="h-4 w-4" /> تعديل</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => del(b)} className="text-destructive"><Trash2 className="h-4 w-4" /> حذف</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                  {b.address && (<div className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0" /><span>{b.address}</span></div>)}
                  {b.phone && (<div className="flex items-center gap-2"><Phone className="h-4 w-4 shrink-0" /><span dir="ltr">{b.phone}</span></div>)}
                  {b.manager_name && (<div className="flex items-center gap-2"><UserIcon className="h-4 w-4 shrink-0" /><span>{b.manager_name}</span></div>)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'تعديل فرع' : 'إضافة فرع جديد'}</DialogTitle>
            <DialogDescription>{editing ? 'حدّث بيانات الفرع' : 'أدخل بيانات الفرع'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>اسم الفرع *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="مثلاً: الفرع الرئيسي" />
            </div>
            <div className="space-y-2">
              <Label>العنوان</Label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>الهاتف</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>اسم المدير</Label>
                <Input value={form.manager_name} onChange={(e) => setForm({ ...form, manager_name: e.target.value })} />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                className="h-4 w-4"
              />
              الفرع نشط
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button>
            <Button onClick={save} disabled={saving}>{saving ? 'جاري الحفظ...' : 'حفظ'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
