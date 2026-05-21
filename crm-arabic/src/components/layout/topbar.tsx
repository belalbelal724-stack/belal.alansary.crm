'use client';
import { Menu, Moon, Sun, Bell, LogOut, User as UserIcon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { createClient } from '@/lib/supabase-client';
import { toast } from 'sonner';

export function Topbar({ onMenuClick, userEmail }: { onMenuClick: () => void; userEmail?: string }) {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const supabase = createClient();
  const [unreadCount, setUnreadCount] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    let mountedFlag = true;
    
    const fetchCount = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !mountedFlag) return;
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
      if (mountedFlag) setUnreadCount(count || 0);
    };

    fetchCount();

    // Realtime subscription
    const channel = supabase
      .channel('notifications-count')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
        fetchCount();
      })
      .subscribe();

    return () => {
      mountedFlag = false;
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('تم تسجيل الخروج بنجاح');
    router.push('/login');
    router.refresh();
  };

  const userInitial = userEmail?.[0]?.toUpperCase() || 'U';

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:px-8">
      <Button variant="ghost" size="icon" onClick={onMenuClick} className="lg:hidden">
        <Menu className="h-5 w-5" />
      </Button>

      <div className="ml-auto flex items-center gap-2">
        {/* Theme toggle */}
        {mounted && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title="تبديل الوضع"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        )}

        {/* Notifications */}
        <Button variant="ghost" size="icon" asChild className="relative">
          <Link href="/notifications">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge variant="destructive" className="absolute -top-1 -left-1 h-5 min-w-5 px-1 text-[10px] leading-none">
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            )}
          </Link>
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white">{userInitial}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <p className="text-sm font-medium">حسابي</p>
              <p className="mt-1 text-xs text-muted-foreground truncate">{userEmail}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings"><UserIcon className="h-4 w-4" /> الإعدادات</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
              <LogOut className="h-4 w-4" /> تسجيل الخروج
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
