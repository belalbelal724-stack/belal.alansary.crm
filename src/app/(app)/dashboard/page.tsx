'use client';
import { useEffect, useState } from 'react';
import { Users, Store, ShoppingCart, DollarSign, TrendingUp, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase-client';
import { formatCurrency, timeAgo } from '@/lib/utils';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { Client, Order } from '@/types';

type Stats = {
  totalClients: number;
  totalBranches: number;
  totalOrders: number;
  totalRevenue: number;
  newClientsThisMonth: number;
  recentOrders: Order[];
  recentClients: Client[];
  ordersByStatus: Array<{ name: string; count: number; revenue: number }>;
  ordersByMonth: Array<{ month: string; orders: number; revenue: number }>;
};

const STATUS_COLORS: Record<string, string> = {
  active: 'success',
  inactive: 'secondary',
  lead: 'info',
  vip: 'vip',
};

const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: 'warning',
  processing: 'info',
  completed: 'success',
  cancelled: 'destructive',
};

export default function DashboardPage() {
  const supabase = createClient();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    try {
      const [clientsRes, branchesRes, ordersRes, recentOrdersRes, recentClientsRes] = await Promise.all([
        supabase.from('clients').select('*', { count: 'exact' }),
        supabase.from('branches').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact' }),
        supabase.from('orders').select('*, client:clients(full_name), branch:branches(name)').order('created_at', { ascending: false }).limit(5),
        supabase.from('clients').select('*, branch:branches(name)').order('created_at', { ascending: false }).limit(5),
      ]);

      const allOrders = (ordersRes.data || []) as Order[];
      const totalRevenue = allOrders.filter(o => o.status === 'completed').reduce((sum, o) => sum + Number(o.amount), 0);

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      const newClientsThisMonth = (clientsRes.data || []).filter(
        (c: Client) => new Date(c.created_at) >= startOfMonth
      ).length;

      // Orders by status
      const statusGroups = ['pending', 'processing', 'completed', 'cancelled'];
      const statusLabels: Record<string, string> = {
        pending: 'قيد الانتظار',
        processing: 'قيد المعالجة',
        completed: 'مكتمل',
        cancelled: 'ملغي',
      };
      const ordersByStatus = statusGroups.map(s => ({
        name: statusLabels[s],
        count: allOrders.filter(o => o.status === s).length,
        revenue: allOrders.filter(o => o.status === s).reduce((sum, o) => sum + Number(o.amount), 0),
      }));

      // Last 6 months trends
      const monthNames = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
      const ordersByMonth: Array<{ month: string; orders: number; revenue: number }> = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
        const monthOrders = allOrders.filter(o => {
          const d = new Date(o.created_at);
          return d >= monthStart && d <= monthEnd;
        });
        ordersByMonth.push({
          month: monthNames[date.getMonth()],
          orders: monthOrders.length,
          revenue: monthOrders.reduce((sum, o) => sum + Number(o.amount), 0),
        });
      }

      setStats({
        totalClients: clientsRes.count || 0,
        totalBranches: branchesRes.count || 0,
        totalOrders: ordersRes.count || 0,
        totalRevenue,
        newClientsThisMonth,
        recentOrders: (recentOrdersRes.data || []) as Order[],
        recentClients: (recentClientsRes.data || []) as Client[],
        ordersByStatus,
        ordersByMonth,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();

    // Realtime subscriptions
    const channel = supabase
      .channel('dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, () => loadStats())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => loadStats())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'branches' }, () => loadStats())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-9 w-48 animate-pulse rounded bg-muted" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">لوحة التحكم</h1>
          <p className="mt-1 text-sm text-muted-foreground">نظرة شاملة على أداء نظامك</p>
        </div>
        <Badge variant="success" className="gap-1 px-3 py-1">
          <Activity className="h-3 w-3" /> مباشر
        </Badge>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="إجمالي العملاء"
          value={stats?.totalClients.toLocaleString('ar') || '0'}
          icon={Users}
          gradient="from-indigo-500 to-purple-500"
          trend={stats?.newClientsThisMonth ? `+${stats.newClientsThisMonth} هذا الشهر` : 'لا جديد'}
        />
        <KpiCard
          title="الفروع"
          value={stats?.totalBranches.toLocaleString('ar') || '0'}
          icon={Store}
          gradient="from-emerald-500 to-teal-500"
          trend="نشطة"
        />
        <KpiCard
          title="الطلبات"
          value={stats?.totalOrders.toLocaleString('ar') || '0'}
          icon={ShoppingCart}
          gradient="from-amber-500 to-orange-500"
          trend="جميع الحالات"
        />
        <KpiCard
          title="الإيرادات"
          value={formatCurrency(stats?.totalRevenue || 0)}
          icon={DollarSign}
          gradient="from-pink-500 to-rose-500"
          trend="من الطلبات المكتملة"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>الإيرادات (آخر 6 أشهر)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={stats?.ordersByMonth || []}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip
                  contentStyle={{ direction: 'rtl', fontSize: 12, borderRadius: 8 }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>الطلبات حسب الحالة</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={stats?.ordersByStatus || []}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip contentStyle={{ direction: 'rtl', fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="count" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent activity */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" /> أحدث الطلبات
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats?.recentOrders.length === 0 && (
              <p className="text-sm text-muted-foreground">لا توجد طلبات بعد</p>
            )}
            {stats?.recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                <div className="space-y-1">
                  <p className="text-sm font-medium">{order.order_number}</p>
                  <p className="text-xs text-muted-foreground">{order.client?.full_name || '—'}</p>
                </div>
                <div className="flex flex-col items-start gap-1">
                  <span className="text-sm font-semibold">{formatCurrency(Number(order.amount))}</span>
                  <Badge variant={ORDER_STATUS_COLORS[order.status] as any}>
                    {{ pending:'قيد الانتظار', processing:'قيد المعالجة', completed:'مكتمل', cancelled:'ملغي' }[order.status]}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> العملاء الجدد
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats?.recentClients.length === 0 && (
              <p className="text-sm text-muted-foreground">لا يوجد عملاء بعد</p>
            )}
            {stats?.recentClients.map((client) => (
              <div key={client.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                <div className="space-y-1">
                  <p className="text-sm font-medium">{client.full_name}</p>
                  <p className="text-xs text-muted-foreground">{client.email || client.phone || '—'}</p>
                </div>
                <div className="flex flex-col items-start gap-1">
                  <Badge variant={STATUS_COLORS[client.status] as any}>
                    {{ active:'نشط', inactive:'غير نشط', lead:'محتمل', vip:'VIP' }[client.status]}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{timeAgo(client.created_at)}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KpiCard({ title, value, icon: Icon, gradient, trend }: any) {
  return (
    <Card className="relative overflow-hidden">
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${gradient}`} />
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white shadow-lg`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">{title}</p>
        <p className="mt-1 text-2xl font-bold">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{trend}</p>
      </CardContent>
    </Card>
  );
}
