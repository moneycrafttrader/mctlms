'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { getSessionCache } from '@/lib/auth';

const isDev = process.env.NODE_ENV === 'development';

export function AuthDebugPanel() {
  const { user, status, error, mustChangePassword, sessionCount } = useAuthStore();
  const [cookiePresent, setCookiePresent] = useState(false);
  const [cachePresent, setCachePresent] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setCookiePresent(
      document.cookie.includes('access_token=')
    );
    setCachePresent(getSessionCache() !== null);
  }, [status]);

  if (!isDev) return null;

  return (
    <>
      <button
        onClick={() => setVisible((v) => !v)}
        className="fixed bottom-4 right-4 z-[99999] flex h-8 w-8 items-center justify-center rounded-full bg-gray-900 text-xs font-bold text-white shadow-lg opacity-50 hover:opacity-100"
        title="Toggle Auth Debug"
      >
        A
      </button>

      {visible && (
        <div className="fixed bottom-14 right-4 z-[99999] w-72 rounded-card border border-surface-border bg-surface-card p-4 shadow-elevated text-xs font-mono">
          <h3 className="mb-2 text-sm font-bold text-text-primary">Auth Debug</h3>

          <div className="space-y-1.5">
            <Row label="Status" value={status} />
            <Row label="Error" value={error || 'null'} />
            <Row
              label="User"
              value={user ? `${user.email} (${user.role})` : 'null'}
            />
            <Row label="Session Count" value={String(sessionCount)} />
            <Row label="Must Change PW" value={String(mustChangePassword)} />
            <Row
              label="Cookie (access_token)"
              value={cookiePresent ? 'YES' : 'NO'}
              highlight={!cookiePresent}
            />
            <Row
              label="Cache (localStorage)"
              value={cachePresent ? 'YES' : 'NO'}
              highlight={!cachePresent}
            />
          </div>
        </div>
      )}
    </>
  );
}

function Row({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-text-muted">{label}</span>
      <span
        className={
          highlight
            ? 'font-bold text-status-error'
            : 'font-medium text-text-primary'
        }
      >
        {value}
      </span>
    </div>
  );
}
