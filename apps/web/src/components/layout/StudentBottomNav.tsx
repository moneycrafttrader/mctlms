'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, BookOpen, Calendar, PlayCircle, User } from 'lucide-react';
import { ROUTES } from '@/lib/constants';

const tabs = [
  { href: ROUTES.STUDENT.HOME, icon: Home, label: 'Home', exact: true },
  { href: ROUTES.STUDENT.COURSES, icon: BookOpen, label: 'Courses' },
  { href: ROUTES.STUDENT.LIVE_SESSIONS, icon: Calendar, label: 'Sessions' },
  { href: ROUTES.STUDENT.VIDEOS, icon: PlayCircle, label: 'Videos' },
  { href: '/student/profile', icon: User, label: 'Profile' },
];

export function StudentBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white shadow-[0_-1px_8px_rgba(0,0,0,0.08)] md:hidden">
      <div className="flex items-center justify-around pb-safe" style={{ height: '56px' }}>
        {tabs.map((tab) => {
          const active = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-col items-center justify-center gap-0.5 px-2"
              style={{ minHeight: '44px', minWidth: '44px' }}
            >
              <tab.icon
                className={`h-5 w-5 ${active ? 'text-brand-navy' : 'text-gray-400'}`}
              />
              <span
                className={`text-[10px] leading-tight ${
                  active ? 'font-semibold text-brand-navy' : 'font-medium text-gray-400'
                }`}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
