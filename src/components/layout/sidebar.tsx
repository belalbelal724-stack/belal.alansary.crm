'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Store, ShoppingCart, Bell, Settings, X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
  { href: '/clients', label: 'العملاء', icon: Users },
  { href: '/orders', label: 'الطلبات', icon: ShoppingCart },
  { href: '/branches', label: 'الفروع', icon: Store },
  { href: '/notifications', label: 'الإشعارات', icon: Bell },
  { href: '/settings', label: 'الإعدادات', icon: Settings },
];

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div onClick={onClose} className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 right-0 z-50 flex w-72 flex-col border-l bg-card transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0',
          open ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between border-b px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-none">CRM Pro</h1>
              <p className="mt-1 text-xs text-muted-foreground">نظام إدارة العملاء</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="lg:hidden">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                  isActive
                    ? 'bg-gradient-to-l from-indigo-500/10 to-purple-500/10 text-indigo-600 dark:text-indigo-400'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                <Icon className={cn('h-5 w-5 transition-transform group-hover:scale-110', isActive && 'text-indigo-600 dark:text-indigo-400')} />
                <span>{item.label}</span>
                {isActive && <span className="mr-auto h-2 w-2 rounded-full bg-indigo-500" />}
              </Link>
            );
          })}
        </nav>

        {/* Bottom card */}
        <div className="border-t p-4">
          <div className="rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4 text-white shadow-lg">
            <div className="mb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <p className="text-sm font-semibold">نظام CRM احترافي</p>
            </div>
            <p className="text-xs text-white/80">إدارة عملائك وفروعك بكفاءة عالية</p>
          </div>
        </div>
      </aside>
    </>
  );
}
