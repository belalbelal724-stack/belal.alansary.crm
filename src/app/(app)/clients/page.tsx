'use client';
import { useEffect, useState } from 'react';
import { Plus, Search, MoreHorizontal, Edit, Trash2, Phone, Mail, Building2, Users as UsersIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { createClient } from '@/lib/supabase-client';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import type { Client, Branch, ClientStatus } from '@/types';
import { STATUS_LABELS } from '@/types';

const STATUS_VARIANT: Record<ClientStatus, string> = {
  active: 'success',
  inactive: 'secondary',
  lead: 'info',
  vip: 'vip',
};

export default function ClientsPage() {
  const supabase = createClient();
  const [clients, setClients] = useState<Client[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    company: '',
    branch_id: '',
    status: 'active' as ClientStatus,
    notes: '',
  });

  const loadData = async () => {
    setLoading(true);
    const [clientsRes, branchesRes] = await Promise.all([
      supabase.from('clients').select('*, branch:branches(*)').order('created_at', { ascending: false }),
      supabase.from('branches').select('*').eq('is_active', true).order('name'),
    ]);
    setClients((clientsRes.data || []) as Client[]);
    setBranches((branchesRes.data || []) as Branch[]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const channel = supabase
      .channel('clients-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, () => loadData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ full_name:'', email:'', phone:'', company:'', branch_id:'', status:'active', notes:'' });
    setDialogOpen(true);
  };

  const openEdit = (client: Client) => {
    setEditing(client);
    setForm({
      full_name: client.full_name,
      email: client.email || '',
      phone: client.phone || '',
      company: client.company || '',
      branch_id: client.branch_id || '',
      status: client.status,
      notes: client.notes || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.full_name.trim()) { toast.error('الاسم مطلوب'); return; }
    setSaving(true);
    const payload = {
      full_name: form.full_name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      company: form.company.trim() || null,
      branch_id: form.branch_id || null,
      status: form.status,
      notes: form.notes.trim() || null,
    };

    let result;
    if (editing) {
      result = await supabase.from('clients').update(payload).eq('id', editing.id);
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      result = await supabase.from('clients').insert({ ...payload, created_by: user?.id });
    }
    setSaving(false);
    if (result.error) { toast.error('فشل الحفظ: ' + result.error.message); return; }
    toast.success(editing ? '✅ تم التعديل' : '✅ تم إضافة العميل');
    setDialogOpen(false);
  };

  const handleDelete = async (client: Client) => {
    if (!confirm(`حذف "${client.full_name}"؟ سيتم حذف طلباته أيضاً.`)) return;
    const { error } = await supabase.from('clients').delete().eq('id', client.id);
    if (error) { toast.error('فشل الحذف: ' + error.message); return; }
    toast.success('🗑️ تم الحذف');
  };

  // Filter clients
  const filtered = clients.filter(c => {
    const matchSearch = !search || 
      c.full_name.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search) ||
      c.company?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchBranch = branchFilter === 'all' || c.branch_id === branchFilter;
    return matchSearch && matchStatus && matchBranch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">العملاء</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {filtered.length} من {clients.length} عميل
          </p>
        </div>
        <Button onClick={openCreate} size="lg" className="gap-2">
          <Plus className="h-4 w-4" /> إضافة عميل
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-wrap gap-3 p-4">
          <div className="relative min-w-60 flex-1">
            <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ابحث بالاسم، البريد، الهاتف، الشركة..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44"><SelectValue placeholder="الحالة" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحالات</SelectItem>
              {(Object.entries(STATUS_LABELS) as [ClientStatus, string][]).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={branchFilter} onValueChange={setBranchFilter}>
            <SelectTrigger className="w-44"><SelectValue placeholder="الفرع" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الفروع</SelectItem>
              {branches.map(b => (
                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded bg-muted" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <UsersIcon className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-lg font-medium">لا يوجد عملاء</p>
              <p className="text-sm text-muted-foreground">ابدأ بإضافة أول عميل</p>
              <Button onClick={openCreate} className="mt-4">
                <Plus className="h-4 w-4" /> إضافة عميل
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50">
                  <tr className="text-right">
                    <th className="px-4 py-3 font-medium">الاسم</th>
                    <th className="px-4 py-3 font-medium">جهة الاتصال</th>
                    <th className="px-4 py-3 font-medium">الشركة</th>
                    <th className="px-4 py-3 font-medium">الفرع</th>
                    <th className="px-4 py-3 font-medium">الحالة</th>
                    <th className="px-4 py-3 font-medium">التاريخ</th>
                    <th className="w-10 px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((client) => (
                    <tr key={client.id} className="border-b transition-colors hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{client.full_name}</td>
                      <td className="px-4 py-3">
                        <div className="space-y-1 text-xs text-muted-foreground">
                          {client.email && <div className="flex items-center gap-1"><Mail className="h-3 w-3" />{client.email}</div>}
                          {client.phone && <div className="flex items-center gap-1"><Phone className="h-3 w-3" />{client.phone}</div>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {client.company && (
                          <span className="inline-flex items-center gap-1 text-sm">
                            <Building2 className="h-3 w-3 text-muted-foreground" />{client.company}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">{client.branch?.name || '—'}</td>
                      <td className="px-4 py-3">
                        <Badge variant={STATUS_VARIANT[client.status] as any}>{STATUS_LABELS[client.status]}</Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(client.created_at)}</td>
                      <td className="px-4 py-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(client)}>
                              <Edit className="h-4 w-4" /> تعديل
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(client)} className="text-destructive">
                              <Trash2 className="h-4 w-4" /> حذف
                            </DropdownMenuItem>
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

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'تعديل عميل' : 'إضافة عميل جديد'}</DialogTitle>
            <DialogDescription>
              {editing ? 'حدّث بيانات العميل' : 'أدخل بيانات العميل الجديد'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label>الاسم الكامل *</Label>
              <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>البريد الإلكتروني</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>الهاتف</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>الشركة</Label>
              <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
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
              <Label>الحالة</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as ClientStatus })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(STATUS_LABELS) as [ClientStatus, string][]).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>ملاحظات</Label>
              <Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'جاري الحفظ...' : 'حفظ'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
