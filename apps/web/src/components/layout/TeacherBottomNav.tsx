'use client';

import { usePathname } from 'next/navigation';
import { ClipboardCheck, LayoutDashboard, Radio, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';
import { NavigationLink } from '@/components/shared/NavigationLink';

const tabs = [
  { href: ROUTES.TEACHER.HOME, icon: LayoutDashboard, label: 'Home', exact: true },
  { href: ROUTES.TEACHER.BATCHES, icon: Users, label: 'Batches' },
  { href: ROUTES.TEACHER.LIVE_SESSIONS, icon: Radio, label: 'Live' },
  { href: ROUTES.TEACHER.REVIEW_QUEUE, icon: ClipboardCheck, label: 'Review' },
];

export function TeacherBottomNav() {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-surface-border bg-white shadow-nav md:hidden"
      aria-label="Teacher navigation"
    >
      <div className="flex items-center justify-around pb-safe" style={{ minHeight: '56px' }}>
        {tabs.map((tab) => {
          const active = isActive(tab.href, tab.exact);
          return (
            <NavigationLink
              key={tab.href}
              href={tab.href}
              aria-label={tab.label}
              aria-current={active ? 'page' : undefined}
              className="bottom-nav-link"
              style={{ minHeight: '44px', minWidth: '44px' }}
            >
              <tab.icon className={cn('h-5 w-5', active ? 'text-brand-600' : 'text-text-muted')} />
              <span
                className={cn(
                  'text-[10px] leading-tight',
                  active ? 'font-semibold text-brand-600' : 'font-medium text-text-muted',
                )}
              >
                {tab.label}
              </span>
            </NavigationLink>
          );
        })}
      </div>
    </nav>
  );
}