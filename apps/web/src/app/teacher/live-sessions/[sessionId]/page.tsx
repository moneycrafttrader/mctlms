'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getSessionById, type LiveSessionWithDetails } from '@/lib/api/live-sessions';
import { ROUTES } from '@/lib/constants';

export default function TeacherSessionDetailPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const [session, setSession] = useState<LiveSessionWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getSessionById(sessionId);
        if (!cancelled) setSession(data);
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load session');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-surface-border border-t-brand-navy" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="space-y-4">
        <Link href={ROUTES.TEACHER.LIVE_SESSIONS} className="text-sm text-brand-navy hover:underline">
          ← Live sessions
        </Link>
        <p className="text-sm text-status-error" role="alert">{error || 'Session not found'}</p>
      </div>
    );
  }

  const when = new Date(session.start_time).toLocaleString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <Link href={ROUTES.TEACHER.LIVE_SESSIONS} className="text-sm text-brand-navy hover:underline">
        ← Live sessions
      </Link>
      <div>
        <h1 className="text-2xl font-bold text-text-primary">{session.topic}</h1>
        <p className="mt-1 text-sm text-text-muted">{when}</p>
        <p className="mt-2 inline-flex rounded-full bg-surface-muted px-2 py-0.5 text-xs font-medium capitalize text-text-secondary">
          {session.status}
        </p>
      </div>
      {session.agenda && (
        <section className="rounded-xl border border-surface-border bg-surface-card p-4">
          <h2 className="text-sm font-semibold text-text-primary">Agenda</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm text-text-secondary">{session.agenda}</p>
        </section>
      )}
      {session.matchingBatches && session.matchingBatches.length > 0 && (
        <section className="rounded-xl border border-surface-border bg-surface-card p-4">
          <h2 className="text-sm font-semibold text-text-primary">Batches</h2>
          <ul className="mt-2 list-inside list-disc text-sm text-text-secondary">
            {session.matchingBatches.map((b) => (
              <li key={b.id}>{b.name}</li>
            ))}
          </ul>
        </section>
      )}
      <p className="text-xs text-text-muted">
        Student join uses the existing token-based flow. Host credentials are not shown here for security.
      </p>
    </div>
  );
}