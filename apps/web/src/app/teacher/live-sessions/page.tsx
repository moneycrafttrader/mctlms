'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Calendar, Radio } from 'lucide-react';
import { listLiveSessions, type LiveSession } from '@/lib/api/live-sessions';
import { ROUTES } from '@/lib/constants';

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function TeacherLiveSessionsPage() {
  const [items, setItems] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await listLiveSessions({ limit: 50 });
        if (!cancelled) setItems(res.items ?? []);
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load sessions');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const { upcoming, past } = useMemo(() => {
    const now = Date.now();
    const up: LiveSession[] = [];
    const done: LiveSession[] = [];
    for (const s of items) {
      const ended = s.status === 'ended' || s.status === 'cancelled';
      const start = new Date(s.start_time).getTime();
      if (ended || start < now - s.duration_minutes * 60_000) done.push(s);
      else up.push(s);
    }
    up.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
    done.sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());
    return { upcoming: up, past: done };
  }, [items]);

  return (
    <div className="space-y-8 pb-20 md:pb-0">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Live sessions</h1>
        <p className="mt-1 text-sm text-text-muted">Sessions for your assigned batches only.</p>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-surface-border border-t-brand-navy" />
        </div>
      )}
      {error && <p className="text-sm text-status-error" role="alert">{error}</p>}

      {!loading && !error && (
        <>
          <Section title="Upcoming" empty="No upcoming sessions" sessions={upcoming} />
          <Section title="History" empty="No past sessions" sessions={past} />
        </>
      )}
    </div>
  );
}

function Section({
  title,
  empty,
  sessions,
}: {
  title: string;
  empty: string;
  sessions: LiveSession[];
}) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">{title}</h2>
      {sessions.length === 0 ? (
        <div className="rounded-xl border border-surface-border bg-surface-card p-8 text-center">
          <Calendar className="mx-auto h-8 w-8 text-text-muted" />
          <p className="mt-2 text-sm text-text-muted">{empty}</p>
        </div>
      ) : (
        <ul className="divide-y divide-surface-border rounded-xl border border-surface-border bg-surface-card">
          {sessions.map((s) => (
            <li key={s.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-text-primary">{s.topic}</p>
                <p className="text-xs text-text-muted">{formatWhen(s.start_time)}</p>
                {s.matchingBatches?.length ? (
                  <p className="mt-1 text-xs text-text-muted">
                    Batches: {s.matchingBatches.map((b) => b.name).join(', ')}
                  </p>
                ) : null}
              </div>
              <Link
                href={`${ROUTES.TEACHER.LIVE_SESSIONS}/${s.id}`}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-lg px-3 text-sm font-medium text-brand-navy hover:bg-surface-muted"
              >
                <Radio className="h-4 w-4" />
                View details
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}