'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { getRoleForPath, hasRequiredRole } from './permissions';
import { logAuthDenied, logAccessDenied } from './audit';

interface GuardResult {
  allowed: boolean;
  isLoading: boolean;
  reason: 'authenticating' | 'wrong-role' | 'unauthenticated' | null;
}

/**
 * Hook that checks whether the current user is allowed on the current page.
 * Used by GuardRoute and can be used directly in pages.
 */
export function useGuard(): GuardResult {
  const { user, status } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated' && user) {
      if (!hasRequiredRole(user.role, pathname)) {
        logAccessDenied(pathname, user.role, pathname.split('/')[1] ?? 'unknown');

        // Redirect to the user's own home
        if (user.role === 'student') {
          router.replace('/student');
        } else if (user.role === 'admin') {
          router.replace('/admin');
        } else if (user.role === 'teacher') {
          router.replace('/teacher');
        } else {
          router.replace('/login');
        }
      }
    }
  }, [status, user, pathname, router]);

  if (status === 'loading' || status === 'idle') {
    return { allowed: false, isLoading: true, reason: 'authenticating' };
  }

  if (status === 'expired' || status === 'offline') {
    return { allowed: false, isLoading: false, reason: 'unauthenticated' };
  }

  if (status === 'authenticated' && user && !hasRequiredRole(user.role, pathname)) {
    return { allowed: false, isLoading: false, reason: 'wrong-role' };
  }

  return { allowed: true, isLoading: false, reason: null };
}

/**
 * Wrapper component that blocks rendering until auth is confirmed.
 * Shows nothing while loading to avoid flash of wrong content.
 */
export function GuardRoute({ children }: { children: React.ReactNode }) {
  const { allowed, isLoading } = useGuard();

  if (isLoading) {
    return null;
  }

  if (!allowed) {
    return null;
  }

  return <>{children}</>;
}
