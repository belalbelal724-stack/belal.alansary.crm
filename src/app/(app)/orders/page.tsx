'use client';
import { useEffect, useState } from 'react';
import { Plus, Search, MoreHorizontal, Edit, Trash2, ShoppingCart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { createClient } from '@/lib/supabase-client';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import type { Order, OrderStatus, PaymentStatus, Client, Branch } from '@/types';
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from '@/types';

const ORDER_STATUS_VARIANT: Record<OrderStatus, string> = {
  pending: 'warning',
  processing: 'info',
  completed: 'success',
  cancelled: 'destructive',
};
const PAY_VARIANT: Record<PaymentStatus, string> = {
  unpaid: 'destructive',
  partial: 'warning',
  paid: 'success',
};

export default function OrdersPage() {
  const supabase = createClient();
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Order | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    client_id: '',
    branch_id: '',
    amount: '',
    status: 'pending' as OrderStatus,
    payment_status: 'unpaid' as PaymentStatus,
    description: '',
  });

  const load = async () => {
    setLoading(true);
    const [oRes, cRes, bRes] = await Promise.all([
      supabase.from('orders').select('*, client:clients(*), branch:branches(*)').order('created_at', { ascending: false }),
      supabase.from('clients').select('id, full_name').order('full_name'),
      supabase.from('branches').select('*').eq('is_active', true).order('name'),
    ]);
    setOrders((oRes.data || []) as Order[]);
    setClients((cRes.data || []) as Client[]);
    setBranches((bRes.data || []) as Branch[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel('orders-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ client_id:'', branch_id:'', amount:'', status:'pending', payment_status:'unpaid', description:'' });
    setDialogOpen(true);
  };

  const openEdit = (o: Order) => {
    setEditing(o);
    setForm({
      client_id: o.client_id,
      branch_id: o.branch_id || '',
      amount: String(o.amount),
      status: o.status,
      payment_status: o.payment_status,
      description: o.description || '',
    });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.client_id) { toast.error('اختر عميلاً'); return; }
    if (!form.amount || Number(form.amount) < 0) { toast.error('أدخل مبلغاً صحيحاً'); return; }
    setSaving(true);
    const payload = {
      client_id: form.client_id,
      branch_id: form.branch_id || null,
      amount: Number(form.amount),
      status: form.status,
      payment_status: form.payment_status,
      description: form.description.trim() || null,
    };
    const result = editing
      ? await supabase.from('orders').update(payload).eq('id', editing.id)
      : await supabase.from('orders').insert({ ...payload, created_by: (await supabase.auth.getUser()).data.user?.id });
    setSaving(false);
    if (result.error) { toast.error('فشل الحفظ: ' + result.error.message); return; }
    toast.success(editing ? '✅ تم التعديل' : '✅ تم إضافة الطلب');
    setDialogOpen(false);
  };

  const del = async (o: Order) => {
    if (!confirm(`حذف الطلب ${o.order_number}؟`)) return;
    const { error } = await supabase.from('orders').delete().eq('id', o.id);
    if (error) { toast.error('فشل الحذف: ' + error.message); return; }
    toast.success('🗑️ تم الحذف');
  };

  const filtered = orders.filter(o => {
    const matchSearch = !search || 
      o.order_number.toLowerCase().includes(search.toLowerCase()) ||
      o.client?.full_name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">الطلبات</h1>
          <p className="mt-1 text-sm text-muted-foreground">{filtered.length} من {orders.length} طلب</p>
        </div>
        <Button onClick={openCreate} size="lg" className="gap-2">
          <Plus className="h-4 w-4" /> طلب جديد
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-wrap gap-3 p-4">
          <div className="relative min-w-60 flex-1">
            <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input placeholder="ابحث برقم الطلب أو اسم العميل..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-10" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحالات</SelectItem>
              {(Object.entries(ORDER_STATUS_LABELS) as [OrderStatus, string][]).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-6">{[...Array(5)].map((_, i) => <div key={i} className="h-16 animate-pulse rounded bg-muted" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <ShoppingCart className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-lg font-medium">لا توجد طلبات</p>
              <Button onClick={openCreate} className="mt-4"><Plus className="h-4 w-4" /> طلب جديد</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50">
                  <tr className="text-right">
                    <th className="px-4 py-3 font-medium">رقم الطلب</th>
                    <th className="px-4 py-3 font-medium">العميل</th>
                    <th className="px-4 py-3 font-medium">الفرع</th>
                    <th className="px-4 py-3 font-medium">المبلغ</th>
                    <th className="px-4 py-3 font-medium">الحالة</th>
                    <th className="px-4 py-3 font-medium">الدفع</th>
                    <th className="px-4 py-3 font-medium">التاريخ</th>
                    <th className="w-10 px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((o) => (
                    <tr key={o.id} className="border-b transition-colors hover:bg-muted/30">
                      <td className="px-4 py-3 font-mono text-xs">{o.order_number}</td>
                      <td className="px-4 py-3">{o.client?.full_name || '—'}</td>
                      <td className="px-4 py-3 text-sm">{o.branch?.name || '—'}</td>
                      <td className="px-4 py-3 font-semibold">{formatCurrency(Number(o.amount))}</td>
                      <td className="px-4 py-3"><Badge variant={ORDER_STATUS_VARIANT[o.status] as any}>{ORDER_STATUS_LABELS[o.status]}</Badge></td>
                      <td className="px-4 py-3"><Badge variant={PAY_VARIANT[o.payment_status] as any}>{PAYMENT_STATUS_LABELS[o.payment_status]}</Badge></td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(o.created_at)}</td>
                      <td className="px-4 py-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(o)}><Edit className="h-4 w-4" /> تعديل</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => del(o)} className="text-destructive"><Trash2 className="h-4 w-4" /> حذف</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'تعديل طلب' : 'طلب جديد'}</DialogTitle>
            <DialogDescription>{editing ? 'حدّث بيانات الطلب' : 'أنشئ طلباً جديداً'}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>العميل *</Label>
              <Select value={form.client_id} onValueChange={(v) => setForm({ ...form, client_id: v })}>
                <SelectTrigger><SelectValue placeholder="اختر عميل" /></SelectTrigger>
                <SelectContent>
                  {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>الفرع</Label>
              <Select value={form.branch_id} onValueChange={(v) => setForm({ ...form, branch_id: v })}>
                <SelectTrigger><SelectValue placeholder="اختر فرع" /></SelectTrigger>
                <SelectContent>
                  {branches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>المبلغ (QAR) *</Label>
              <Input type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>حالة الطلب</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as OrderStatus })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(ORDER_STATUS_LABELS) as [OrderStatus, string][]).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>حالة الدفع</Label>
              <Select value={form.payment_status} onValueChange={(v) => setForm({ ...form, payment_status: v as PaymentStatus })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(PAYMENT_STATUS_LABELS) as [PaymentStatus, string][]).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>الوصف</Label>
              <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
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
