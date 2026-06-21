import { useAuthStore } from '@/stores/auth.store';
import { clearSessionCache, clearAuthCookies } from './auth';
import { stopBackgroundValidation } from './session-manager';

const HEARTBEAT_INTERVAL_MS = 30_000;
const LEADER_KEY = 'heartbeat_leader_ts';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

function getToken(): string | null {
  const match = document.cookie.match(/(?:^|;\s*)access_token=([^;]*)/);
  return match ? match[1] : null;
}

function tryClaimLeadership(): boolean {
  const lastTs = parseInt(localStorage.getItem(LEADER_KEY) || '0', 10);
  if (Date.now() - lastTs > HEARTBEAT_INTERVAL_MS + 5000) {
    localStorage.setItem(LEADER_KEY, String(Date.now()));
    return true;
  }
  return false;
}

function releaseLeadership(): void {
  const ourTs = localStorage.getItem(LEADER_KEY);
  if (ourTs && Date.now() - parseInt(ourTs, 10) < HEARTBEAT_INTERVAL_MS) {
    localStorage.removeItem(LEADER_KEY);
  }
}

async function checkSession(): Promise<'valid' | 'invalid' | 'error'> {
  const token = getToken();
  if (!token) return 'invalid';
  try {
    const res = await fetch(`${API_URL}/auth/validate-session`, {
      headers: { Authorization: `Bearer ${token}` },
      credentials: 'include',
    });
    if (res.ok) return 'valid';
    return 'invalid';
  } catch {
    return 'error';
  }
}

function handleTakeover(): void {
  const store = useAuthStore.getState();
  store.setStatus('takeover');
  store.setError('Your session was taken over. You have been logged out on this device.');
  clearSessionCache();
  clearAuthCookies();
  stopBackgroundValidation();
  stopHeartbeat();
  try {
    const bc = new BroadcastChannel('mct-auth-channel');
    bc.postMessage({ type: 'auth:takeover' });
    bc.close();
  } catch {}
}

async function runHeartbeat(): Promise<void> {
  if (!tryClaimLeadership()) return;

  localStorage.setItem(LEADER_KEY, String(Date.now()));

  const store = useAuthStore.getState();
  if (store.status !== 'authenticated') {
    stopHeartbeat();
    return;
  }

  const result = await checkSession();
  if (result === 'invalid') {
    handleTakeover();
  }
}

export function startHeartbeat(): void {
  stopHeartbeat();
  runHeartbeat();
  heartbeatTimer = setInterval(runHeartbeat, HEARTBEAT_INTERVAL_MS);
}

export function stopHeartbeat(): void {
  if (heartbeatTimer !== null) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
  releaseLeadership();
}
