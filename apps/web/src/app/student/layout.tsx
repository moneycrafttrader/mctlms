import { ReactNode } from 'react';
import { StudentSidebar } from '@/components/layout/StudentSidebar';
import { StudentBottomNav } from '@/components/layout/StudentBottomNav';

export default function StudentLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-surface-page">
      {/* Desktop: sidebar + content */}
      <div className="hidden md:flex">
        <aside className="fixed left-0 top-0 flex h-screen w-60 flex-col bg-sidebar-bg">
          <StudentSidebar />
        </aside>
        <main className="ml-60 min-h-screen flex-1">
          <div className="mx-auto max-w-5xl px-6 py-8">{children}</div>
        </main>
      </div>

      {/* Mobile: full-width content + bottom nav */}
      <div className="md:hidden">
        <main className="pb-20">{children}</main>
        <StudentBottomNav />
      </div>
    </div>
  );
}
