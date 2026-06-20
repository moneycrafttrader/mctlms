import { ReactNode } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  BookOpen,
  Video,
  LogOut,
} from 'lucide-react';
import { ROUTES } from '@/lib/constants';

const navItems = [
  { label: 'My Dashboard', href: ROUTES.STUDENT.HOME, icon: LayoutDashboard },
  { label: 'My Courses', href: ROUTES.STUDENT.COURSES, icon: BookOpen },
  { label: 'Live Sessions', href: ROUTES.STUDENT.LIVE_SESSIONS, icon: Video },
  { label: 'Video Library', href: ROUTES.STUDENT.VIDEOS, icon: Video },
];

export default function StudentLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="flex w-64 flex-col bg-sidebar-bg">
        <div className="flex h-16 items-center gap-2 border-b border-gray-700 px-6">
          <BookOpen className="h-6 w-6 text-brand-500" />
          <span className="text-lg font-bold text-white">LMS</span>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="sidebar-link"
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-gray-700 px-3 py-4">
          <Link href={ROUTES.LOGIN} className="sidebar-link">
            <LogOut className="h-5 w-5" />
            Logout
          </Link>
        </div>
      </aside>
      <main className="flex-1">
        <header className="flex h-16 items-center border-b bg-white px-8">
          <h2 className="text-lg font-semibold text-gray-900">Student Portal</h2>
        </header>
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
