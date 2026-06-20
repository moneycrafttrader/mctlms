'use client';

import { Calendar, Clock, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { type AdminOverview } from '@/lib/api/analytics';

interface UpcomingSessionsWidgetProps {
  sessions: AdminOverview['upcomingSessions'];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function UpcomingSessionsWidget({ sessions }: UpcomingSessionsWidgetProps) {
  if (sessions.length === 0) {
    return (
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900 mb-4">
          Upcoming Live Sessions
        </h2>
        <p className="text-sm text-gray-400">No upcoming sessions scheduled.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">
          Upcoming Live Sessions
        </h2>
        <Link
          href="/admin/live-sessions"
          className="text-xs font-medium text-brand-600 hover:text-brand-700"
        >
          View all
        </Link>
      </div>

      <div className="space-y-3">
        {sessions.map((session) => (
          <div
            key={session.id}
            className="flex items-center gap-4 rounded-lg border border-gray-100 p-3 transition-colors hover:bg-gray-50"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50">
              <Calendar className="h-5 w-5 text-brand-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900">
                {session.topic}
              </p>
              <div className="mt-0.5 flex items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(session.startTime)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatTime(session.startTime)}
                </span>
                <span>{session.durationMinutes} min</span>
              </div>
            </div>
            <ExternalLink className="h-4 w-4 shrink-0 text-gray-300" />
          </div>
        ))}
      </div>
    </div>
  );
}
