import { getSessionCache, extendSessionCache, clearSessionCache, clearAuthCookies } from './auth';
import { useAuthStore } from '@/stores/auth.store';
import { stopHeartbeat } from './session-heartbeat';

const VALIDATION_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes
const EXPIRY_GRACE_MS = 2 * 60 * 1000; // 2-minute grace before showing overlay
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const CHANNEL_NAME = 'mct-auth-channel';

let validatorTimer: ReturnType<typeof setInterval> | null = null;
let channel: BroadcastChannel | null = null;
let isOffline = false;

function getToken(): string | null {
  const cache = getSessionCache();
  return cache?.token ?? null;
}

async function validateTokenOnServer(): Promise<boolean> {
  const token = getToken();
  if (!token) return false;
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

export async function runSessionValidation(): Promise<void> {
  if (isOffline) return;

  const store = useAuthStore.getState();
  if (store.status !== 'authenticated') return;

  const cache = getSessionCache();
  if (!cache) {
    handleExpiredSession();
    return;
  }

  const timeUntilExpiry = cache.expiresAt - Date.now();

  // If cache is still fresh, just extend and return
  if (timeUntilExpiry > EXPIRY_GRACE_MS) {
    extendSessionCache();
    return;
  }

  // Cache is near/at expiry — validate against server
  const valid = await validateTokenOnServer();
  if (valid) {
    extendSessionCache();
    store.setStatus('authenticated');
    store.setError(null);
  } else {
    handleExpiredSession();
  }
}

function handleExpiredSession(): void {
  const store = useAuthStore.getState();
  store.setStatus('expired');
  store.setError('Session expired. Please login again.');
  clearSessionCache();
  clearAuthCookies();
  stopBackgroundValidation();
  stopHeartbeat();
}

function handleTakeover(): void {
  const store = useAuthStore.getState();
  store.setStatus('takeover');
  store.setError('Your session was taken over. You have been logged out on this device.');
  clearSessionCache();
  clearAuthCookies();
  stopBackgroundValidation();
  stopHeartbeat();
}

export function startBackgroundValidation(): void {
  stopBackgroundValidation();
  // Run immediately
  runSessionValidation();
  validatorTimer = setInterval(runSessionValidation, VALIDATION_INTERVAL_MS);
}

export function stopBackgroundValidation(): void {
  if (validatorTimer !== null) {
    clearInterval(validatorTimer);
    validatorTimer = null;
  }
}

// --- Multi-tab sync ---

export function setupMultiTabSync(): () => void {
  try {
    channel = new BroadcastChannel(CHANNEL_NAME);
  } catch {
    return () => {};
  }

  const store = useAuthStore.getState();

  const handleMessage = (event: MessageEvent) => {
    const msg = event.data;
    if (!msg || !msg.type) return;

    switch (msg.type) {
      case 'auth:login': {
        const currentStore = useAuthStore.getState();
        if (msg.sessionCount > currentStore.sessionCount) {
          useAuthStore.getState().hydrate(msg.user, msg.token, msg.mustChangePassword);
          startBackgroundValidation();
        }
        break;
      }
      case 'auth:logout': {
        useAuthStore.getState().logout();
        clearSessionCache();
        clearAuthCookies();
        stopBackgroundValidation();
        stopHeartbeat();
        break;
      }
      case 'auth:takeover': {
        handleTakeover();
        break;
      }
    }
  };

  channel.addEventListener('message', handleMessage);
  return () => {
    channel?.removeEventListener('message', handleMessage);
    channel?.close();
    channel = null;
  };
}

export function broadcastLogin(user: { id: string; email: string; role: string }, token: string, mustChangePassword: boolean): void {
  const sessionCount = useAuthStore.getState().sessionCount;
  channel?.postMessage({ type: 'auth:login', user, token, mustChangePassword, sessionCount });
}

export function broadcastLogout(): void {
  channel?.postMessage({ type: 'auth:logout' });
}

// --- Offline handling ---

export function setupOfflineDetection(): () => void {
  const handleOnline = () => {
    isOffline = false;
    const store = useAuthStore.getState();
    if (store.status === 'offline') {
      store.setStatus('idle');
    }
    runSessionValidation();
  };

  const handleOffline = () => {
    isOffline = true;
    const store = useAuthStore.getState();
    if (store.status === 'authenticated') {
      store.setStatus('offline');
    }
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  if (!navigator.onLine) {
    isOffline = true;
    const store = useAuthStore.getState();
    if (store.status === 'authenticated') {
      store.setStatus('offline');
    }
  }

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}
