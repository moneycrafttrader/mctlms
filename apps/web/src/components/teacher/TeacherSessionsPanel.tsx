'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar, Radio } from 'lucide-react';
import { getBatchSessions } from '@/lib/api/courses';
import { ROUTES } from '@/lib/constants';

type SessionRow = {
  id: string;
  topic?: string;
  start_time?: string;
  status?: string;
  duration_minutes?: number;
};

function formatWhen(iso?: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function statusTone(status?: string) {
  switch (status) {
    case 'scheduled':
      return 'text-blue-700 bg-blue-50';
    case 'live':
      return 'text-green-700 bg-green-50';
    case 'ended':
      return 'text-text-muted bg-surface-muted';
    case 'cancelled':
      return 'text-red-700 bg-red-50';
    default:
      return 'text-text-muted bg-surface-muted';
  }
}

export function TeacherSessionsPanel({ batchId }: { batchId: string }) {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const result = await getBatchSessions(batchId);
        if (!cancelled) setSessions((result ?? []) as SessionRow[]);
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load sessions');
          setSessions([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [batchId]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-surface-border border-t-brand-navy" />
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-status-error" role="alert">{error}</p>;
  }

  if (sessions.length === 0) {
    return (
      <div className="rounded-xl border border-surface-border bg-surface-card p-8 text-center">
        <Calendar className="mx-auto h-10 w-10 text-text-muted" />
        <p className="mt-3 text-sm font-medium text-text-primary">No sessions for this batch</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-surface-border rounded-xl border border-surface-border bg-surface-card">
      {sessions.map((s) => (
        <li key={s.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-text-primary">{s.topic ?? 'Live session'}</p>
            <p className="text-xs text-text-muted">{formatWhen(s.start_time)}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusTone(s.status)}`}>
              {s.status ?? 'unknown'}
            </span>
            <Link
              href={`${ROUTES.TEACHER.LIVE_SESSIONS}/${s.id}`}
              className="inline-flex min-h-[44px] items-center gap-1 rounded-lg px-3 text-sm font-medium text-brand-navy hover:bg-surface-muted"
            >
              <Radio className="h-4 w-4" />
              Details
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}