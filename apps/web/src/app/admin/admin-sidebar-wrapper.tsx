'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  IndianRupee,
  Settings,
  Video,
  Calendar,
  ShieldAlert,
  FileText,
  HelpCircle,
  ClipboardCheck,
  BarChart3,
  LogOut,
  Trophy,
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: ROUTES.ADMIN.HOME, icon: LayoutDashboard },
  { label: 'Students', href: ROUTES.ADMIN.STUDENTS, icon: Users },
  { label: 'Courses & Batches', href: ROUTES.ADMIN.COURSES, icon: BookOpen },
  { label: 'Live Sessions', href: ROUTES.ADMIN.SESSIONS, icon: Calendar },
  { label: 'Recordings', href: ROUTES.ADMIN.RECORDINGS, icon: Video },
  { label: 'Payments & Invoices', href: ROUTES.ADMIN.PAYMENTS, icon: IndianRupee },
  { label: 'Business Config', href: ROUTES.ADMIN.BUSINESS_CONFIG, icon: Settings },
  { label: 'Violations', href: ROUTES.ADMIN.VIOLATIONS, icon: ShieldAlert },
  { label: 'Tests', href: ROUTES.ADMIN.TESTS, icon: FileText },
  { label: 'Questions', href: ROUTES.ADMIN.QUESTIONS, icon: HelpCircle },
  { label: 'Review Queue', href: ROUTES.ADMIN.REVIEW_QUEUE, icon: ClipboardCheck },
  { label: 'Analytics', href: ROUTES.ADMIN.ANALYTICS, icon: BarChart3 },
];

export function AdminSidebarWrapper() {
  const pathname = usePathname();

  return (
    <>
      <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-divider px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500/20">
          <Trophy className="h-4 w-4 text-brand-300" />
        </div>
        <div>
          <span className="text-base font-bold tracking-tight text-white">MCT Learn</span>
          <p className="text-2xs font-medium text-brand-200">Admin Panel</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4 scrollbar-thin">
        {navItems.map((item) => {
          const active = pathname === item.href || (item.href !== ROUTES.ADMIN.HOME && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn('sidebar-link', active && 'active')}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-divider px-3 py-4">
        <Link href={ROUTES.LOGIN} className="sidebar-link">
          <LogOut className="h-5 w-5" />
          Logout
        </Link>
      </div>
    </>
  );
}
