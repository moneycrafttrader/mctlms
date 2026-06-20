import { ReactNode } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  IndianRupee,
  Settings,
  Video,
  Calendar,
  LogOut,
} from 'lucide-react';
import { ROUTES } from '@/lib/constants';

const navItems = [
  { label: 'Dashboard', href: ROUTES.ADMIN.HOME, icon: LayoutDashboard },
  { label: 'Students', href: ROUTES.ADMIN.STUDENTS, icon: Users },
  { label: 'Courses & Batches', href: ROUTES.ADMIN.COURSES, icon: BookOpen },
  { label: 'Live Sessions', href: ROUTES.ADMIN.SESSIONS, icon: Calendar },
  { label: 'Recordings', href: ROUTES.ADMIN.RECORDINGS, icon: Video },
  { label: 'Payments & Invoices', href: ROUTES.ADMIN.PAYMENTS, icon: IndianRupee },
  { label: 'Business Config', href: ROUTES.ADMIN.BUSINESS_CONFIG, icon: Settings },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="flex w-64 flex-col bg-sidebar-bg">
        <div className="flex h-16 items-center gap-2 border-b border-gray-700 px-6">
          <BookOpen className="h-6 w-6 text-brand-500" />
          <span className="text-lg font-bold text-white">LMS Admin</span>
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
          <h2 className="text-lg font-semibold text-gray-900">Admin Panel</h2>
        </header>
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
