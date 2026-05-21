'use client';
import { useState } from 'react';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';

export function AppShell({ children, userEmail }: { children: React.ReactNode; userEmail?: string }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-muted/30">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col">
        <Topbar onMenuClick={() => setSidebarOpen(true)} userEmail={userEmail} />
        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
