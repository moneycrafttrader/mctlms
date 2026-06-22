import { ReactNode } from 'react';
import { StudentSidebar } from '@/components/layout/StudentSidebar';
import { StudentBottomNav } from '@/components/layout/StudentBottomNav';
import { SessionExpiredOverlay } from '@/components/shared/SessionExpiredOverlay';
import { GuardRoute } from '@/lib/guards/client-guard';
import { NotificationBell } from '@/components/student/NotificationBell';

export default function StudentLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SessionExpiredOverlay />
      <GuardRoute>
      <div className="min-h-screen bg-surface-page">

      {/* Desktop layout */}
      <div className="hidden md:flex">
        <aside className="fixed left-0 top-0 z-40 flex h-screen w-60 flex-col bg-sidebar-bg">
          <StudentSidebar />
        </aside>
        <main className="ml-60 min-h-screen flex-1">
          <header className="flex h-14 items-center border-b border-surface-border bg-white px-8">
            <div className="flex flex-1 items-center gap-2">
              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-500" />
              <span className="text-sm font-medium text-text-secondary">Student Dashboard</span>
            </div>
            <div className="flex items-center gap-3">
              <NotificationBell />
              <span className="text-xs text-text-muted">MCT Learn v2.0</span>
            </div>
          </header>
          <div className="mx-auto max-w-5xl px-6 py-8">{children}</div>
        </main>
      </div>

      {/* Mobile layout */}
      <div className="md:hidden">
        <main className="pb-20">{children}</main>
        <StudentBottomNav />
      </div>
    </div>
      </GuardRoute>
    </>
  );
}
