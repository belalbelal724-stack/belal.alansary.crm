'use client';
import { useEffect, useState } from 'react';
import { Bell, CheckCheck, Info, AlertTriangle, CheckCircle2, XCircle, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase-client';
import { timeAgo } from '@/lib/utils';
import { toast } from 'sonner';
import type { Notification } from '@/types';

const ICONS = { info: Info, success: CheckCircle2, warning: AlertTriangle, error: XCircle };
const COLORS = {
  info: 'text-sky-500 bg-sky-500/10',
  success: 'text-emerald-500 bg-emerald-500/10',
  warning: 'text-amber-500 bg-amber-500/10',
  error: 'text-red-500 bg-red-500/10',
};

export default function NotificationsPage() {
  const supabase = createClient();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setItems((data || []) as Notification[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel('notifications-page')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markAllRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
    if (error) { toast.error('فشلت العملية'); return; }
    toast.success('✅ تم تعليم الكل كمقروء');
  };

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  };

  const del = async (id: string) => {
    await supabase.from('notifications').delete().eq('id', id);
    toast.success('🗑️ تم الحذف');
  };

  const unreadCount = items.filter(i => !i.is_read).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">الإشعارات</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} إشعار غير مقروء` : 'كل الإشعارات مقروءة'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button onClick={markAllRead} variant="outline" className="gap-2">
            <CheckCheck className="h-4 w-4" /> تعليم الكل كمقروء
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-6">{[...Array(4)].map((_, i) => <div key={i} className="h-20 animate-pulse rounded bg-muted" />)}</div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Bell className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-lg font-medium">لا توجد إشعارات</p>
              <p className="text-sm text-muted-foreground">ستظهر هنا تنبيهاتك ورسائلك</p>
            </div>
          ) : (
            <div className="divide-y">
              {items.map((n) => {
                const Icon = ICONS[n.type];
                return (
                  <div
                    key={n.id}
                    onClick={() => !n.is_read && markRead(n.id)}
                    className={`flex items-start gap-4 p-4 transition-colors hover:bg-muted/30 ${!n.is_read ? 'bg-primary/5' : ''}`}
                  >
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${COLORS[n.type]}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{n.title}</p>
                        {!n.is_read && <span className="h-2 w-2 rounded-full bg-primary" />}
                      </div>
                      {n.message && <p className="text-sm text-muted-foreground">{n.message}</p>}
                      <p className="text-xs text-muted-foreground">{timeAgo(n.created_at)}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => { e.stopPropagation(); del(n.id); }}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
