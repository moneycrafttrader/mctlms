import { ReactNode } from 'react';
import { TeacherSidebar } from '@/components/layout/TeacherSidebar';
import { TeacherBottomNav } from '@/components/layout/TeacherBottomNav';
import { SessionExpiredOverlay } from '@/components/shared/SessionExpiredOverlay';
import { GuardRoute } from '@/lib/guards/client-guard';
import { NavigationProvider } from '@/components/providers/NavigationProvider';
import { NavigationProgress } from '@/components/providers/NavigationProgress';

export default function TeacherLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SessionExpiredOverlay />
      <GuardRoute>
        <NavigationProvider>
          <NavigationProgress />
          <div className="min-h-screen bg-surface-page">
            <aside className="fixed left-0 top-0 z-40 hidden h-screen w-60 flex flex-col bg-sidebar-bg md:flex">
              <TeacherSidebar />
            </aside>
            <main className="ml-0 min-h-screen flex-1 md:ml-60">
              <header className="hidden h-14 items-center border-b border-surface-border bg-white px-8 md:flex">
                <span className="text-sm font-medium text-text-secondary">Teacher workspace</span>
              </header>
              <div className="mx-auto max-w-5xl px-4 py-6 pb-24 md:px-8 md:py-8 md:pb-8">{children}</div>
            </main>
            <TeacherBottomNav />
          </div>
        </NavigationProvider>
      </GuardRoute>
    </>
  );
}