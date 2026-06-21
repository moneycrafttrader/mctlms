'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, BookOpen, Video, FileText, BarChart3, LogOut } from 'lucide-react';
import { ROUTES } from '@/lib/constants';

const navItems = [
  { label: 'My Dashboard', href: ROUTES.STUDENT.HOME, icon: LayoutDashboard },
  { label: 'My Courses', href: ROUTES.STUDENT.COURSES, icon: BookOpen },
  { label: 'Live Sessions', href: ROUTES.STUDENT.LIVE_SESSIONS, icon: Video },
  { label: 'Video Library', href: ROUTES.STUDENT.VIDEOS, icon: Video },
  { label: 'Tests', href: ROUTES.STUDENT.TESTS, icon: FileText },
  { label: 'Results', href: ROUTES.STUDENT.RESULTS, icon: BarChart3 },
];

function isActive(href: string, pathname: string) {
  if (href === ROUTES.STUDENT.HOME) {
    return pathname === href;
  }
  return pathname.startsWith(href);
}

export function StudentSidebar() {
  const pathname = usePathname();

  return (
    <>
      <div className="flex h-16 items-center gap-2 border-b border-gray-700 px-6">
        <BookOpen className="h-6 w-6 text-brand-500" />
        <span className="text-lg font-bold text-white">LMS</span>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`sidebar-link${isActive(item.href, pathname) ? ' active' : ''}`}
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
    </>
  );
}
