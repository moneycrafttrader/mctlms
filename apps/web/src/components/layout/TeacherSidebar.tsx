'use client';

import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  LogOut,
  Radio,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';
import { useSession } from '@/hooks/useSession';
import { useAuthStore } from '@/stores/auth.store';
import { NavigationLink } from '@/components/shared/NavigationLink';
import { Button } from '@/components/ui/Button';

const navItems = [
  { label: 'Dashboard', href: ROUTES.TEACHER.HOME, icon: LayoutDashboard, exact: true },
  { label: 'My Batches', href: ROUTES.TEACHER.BATCHES, icon: Users },
  { label: 'Live Sessions', href: ROUTES.TEACHER.LIVE_SESSIONS, icon: Radio },
  { label: 'Review Queue', href: ROUTES.TEACHER.REVIEW_QUEUE, icon: ClipboardCheck },
];

function isActive(href: string, exact: boolean | undefined, pathname: string) {
  if (exact) return pathname === href;
  return pathname.startsWith(href);
}

export function TeacherSidebar() {
  const pathname = usePathname();
  const { logout, isLoggingOut } = useSession();
  const user = useAuthStore((s) => s.user);
  const displayName = user?.name?.trim() || user?.email?.split('@')[0] || 'Teacher';
  const initial = displayName.trim()[0]?.toUpperCase() || 'T';

  return (
    <>
      <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-divider px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white p-1">
          <Image
            src="/mct-logo.png"
            alt=""
            width={32}
            height={32}
            className="h-full w-full object-contain"
            aria-hidden="true"
          />
        </div>
        <div>
          <span className="text-base font-bold tracking-tight text-white">MCT Learn</span>
          <p className="text-2xs font-medium text-brand-200">Teacher Portal</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const active = isActive(item.href, item.exact, pathname);
          return (
            <NavigationLink
              key={item.href}
              href={item.href}
              className={cn('sidebar-link', active && 'active')}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <span>{item.label}</span>
            </NavigationLink>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-divider p-4">
        <div className="mb-3 flex items-center gap-3 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500 text-sm font-bold text-white">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{displayName}</p>
            <p className="text-2xs text-brand-200">Teacher</p>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          onClick={logout}
          loading={isLoggingOut}
          className="w-full justify-start gap-2 text-sidebar-text hover:bg-sidebar-hover hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </>
  );
}