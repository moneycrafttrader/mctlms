'use client';

import { useEffect, useRef } from 'react';
import {
  getSessionCache,
  clearSessionCache,
  clearAuthCookies,
} from '@/lib/auth';
import { useAuthStore } from '@/stores/auth.store';
import {
  startBackgroundValidation,
  stopBackgroundValidation,
  setupMultiTabSync,
  setupOfflineDetection,
  runSessionValidation,
  broadcastLogin,
} from '@/lib/session-manager';
import { startHeartbeat, stopHeartbeat } from '@/lib/session-heartbeat';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function validateTokenOnServer(token: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/auth/validate-session`, {
      headers: { Authorization: `Bearer ${token}` },
      credentials: 'include',
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const initialised = useRef(false);
  const cleanupRef = useRef<(() => void)[]>([]);

  useEffect(() => {
    if (initialised.current) return;
    initialised.current = true;

    const store = useAuthStore.getState();
    const cached = getSessionCache();

    async function hydrate() {
      // Phase 1: Try localStorage cache
      if (cached) {
        const timeLeft = cached.expiresAt - Date.now();

        if (timeLeft > 0) {
          // Cache is still valid — hydrate immediately
          store.hydrate(cached.user, cached.token, cached.mustChangePassword);
          store.setStatus('authenticated');

          // Start lifecycle
          cleanupRef.current.push(setupMultiTabSync());
          cleanupRef.current.push(setupOfflineDetection());
          startBackgroundValidation();
          startHeartbeat();
          return;
        }

        // Cache expired — validate token on server
        store.setStatus('loading');
        const valid = await validateTokenOnServer(cached.token);

        if (valid) {
          store.hydrate(cached.user, cached.token, cached.mustChangePassword);
          cleanupRef.current.push(setupMultiTabSync());
          cleanupRef.current.push(setupOfflineDetection());
          startBackgroundValidation();
          startHeartbeat();
          return;
        }

        // Token invalid — clear everything
        clearSessionCache();
        clearAuthCookies();
        store.setStatus('expired');
        store.setError('Session expired. Please login again.');
        return;
      }

      // Phase 2: No cache — check cookie (new tab after login)
      const cookieMatch = document.cookie.match(/(?:^|;\s*)access_token=([^;]*)/);
      if (!cookieMatch) {
        store.setStatus('idle');
        return;
      }

      const token = cookieMatch[1];
      store.setStatus('loading');

      const valid = await validateTokenOnServer(token);
      if (!valid) {
        clearAuthCookies();
        store.setStatus('idle');
        return;
      }

      // Fetch full profile from /auth/me
      try {
        const res = await fetch(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include',
        });
        if (!res.ok) throw new Error('Profile fetch failed');
        const body = await res.json();
        const data = body.data ?? body;
        const user = {
          id: data.id,
          name: data.name,
          email: data.email,
          role: data.role,
        };

        store.hydrate(user, token);
        broadcastLogin(user, token, false);
        cleanupRef.current.push(setupMultiTabSync());
        cleanupRef.current.push(setupOfflineDetection());
        startBackgroundValidation();
        startHeartbeat();
      } catch {
        clearAuthCookies();
        store.setStatus('idle');
      }
    }

    hydrate();

    return () => {
      stopBackgroundValidation();
      stopHeartbeat();
      cleanupRef.current.forEach((fn) => fn());
      cleanupRef.current = [];
    };
  }, []);

  return <>{children}</>;
}
