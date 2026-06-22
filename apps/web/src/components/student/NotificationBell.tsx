'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';
import { getUnreadCount } from '@/lib/api/notifications';

export function NotificationBell() {
  const router = useRouter();
  const [count, setCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchCount = async () => {
      try {
        const result = await getUnreadCount();
        if (mounted && result?.unreadCount !== undefined) {
          setCount(result.unreadCount);
        }
      } catch {
        // Silently ignore fetch errors
      }
    };

    fetchCount();

    intervalRef.current = setInterval(fetchCount, 60000);

    return () => {
      mounted = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  return (
    <div className="relative">
      <button
        onClick={() => router.push('/student/notifications')}
        className="rounded-lg p-2 transition-colors hover:bg-surface-muted"
        aria-label={`Notifications${count > 0 ? ` (${count} unread)` : ''}`}
      >
        <Bell className="h-5 w-5 text-text-secondary" />
      </button>
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </div>
  );
}
