import { ReactNode } from 'react';
import { SessionExpiredOverlay } from '@/components/shared/SessionExpiredOverlay';
import { GuardRoute } from '@/lib/guards/client-guard';
import { AdminSidebarWrapper } from './admin-sidebar-wrapper';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SessionExpiredOverlay />
      <GuardRoute>
    <div className="flex min-h-screen bg-surface-page">
      <aside className="flex w-64 flex-col bg-sidebar-bg">
        <AdminSidebarWrapper />
      </aside>
      <main className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-surface-border bg-white px-8 shadow-nav">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-brand-500" />
            <h2 className="text-base font-semibold text-text-primary">Admin Command Center</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-text-muted">MCT Learn v2.0</span>
          </div>
        </header>
        <div className="flex-1 p-6 md:p-8">{children}</div>
      </main>
    </div>
      </GuardRoute>
    </>
  );
}
