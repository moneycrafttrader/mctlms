'use client';

import { useState, useEffect } from 'react';
import {
  Video,
  Calendar,
  Clock,
  ExternalLink,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react';
import {
  type LiveSession,
  getMySessions,
  getSessionJoinUrl,
  requestJoinToken,
} from '@/lib/api/live-sessions';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface SessionListProps {
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function SessionCard({
  session,
  token,
}: {
  session: LiveSession & { attendanceStatus?: string };
  token?: string;
}) {
  const [joining, setJoining] = useState(false);
  const [joinUrl, setJoinUrl] = useState<string | null>(null);

  const isUpcoming = session.status === 'scheduled' || session.status === 'live';

  const handleJoin = async () => {
    setJoining(true);
    try {
      const { token } = await requestJoinToken(session.id);
      const { joinUrl } = await getSessionJoinUrl(session.id, token);
      window.open(joinUrl, '_blank');
    } catch {
      setJoinUrl(null);
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-gray-900 truncate">
            {session.topic}
          </h3>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(session.start_time)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {formatTime(session.start_time)}
            </span>
            <span>{session.duration_minutes} min</span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          {isUpcoming ? (
            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
              {session.status === 'live' ? 'Live Now' : 'Scheduled'}
            </span>
          ) : (
            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
              {session.attendanceStatus === 'present' ? 'Attended' : 'Ended'}
            </span>
          )}

          {isUpcoming && (
            <button
              onClick={handleJoin}
              disabled={joining}
              className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {joining ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ExternalLink className="h-3.5 w-3.5" />
              )}
              {joining ? 'Joining...' : 'Join'}
            </button>
          )}

          {!isUpcoming && session.attendanceStatus && (
            <span
              className={`flex items-center gap-1 text-xs ${
                session.attendanceStatus === 'present'
                  ? 'text-green-600'
                  : 'text-red-500'
              }`}
            >
              {session.attendanceStatus === 'present' ? (
                <CheckCircle className="h-3.5 w-3.5" />
              ) : (
                <XCircle className="h-3.5 w-3.5" />
              )}
              {session.attendanceStatus === 'present' ? 'Present' : 'Absent'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function SessionList(_props: SessionListProps) {
  const [upcoming, setUpcoming] = useState<LiveSession[]>([]);
  const [past, setPast] = useState<(LiveSession & { attendanceStatus?: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMySessions()
      .then((result) => {
        setUpcoming(result.upcoming);
        setPast(result.past);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-500">
        Loading sessions...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Sessions</h2>
        {upcoming.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 py-12 text-gray-500">
            <Video className="mb-3 h-10 w-10 text-gray-300" />
            <p className="text-lg font-medium">No upcoming sessions</p>
            <p className="text-sm mt-1">New sessions will appear here once scheduled.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>
        )}
      </section>

      {past.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Past Sessions</h2>
          <div className="space-y-3">
            {past.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
