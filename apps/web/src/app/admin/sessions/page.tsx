'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Plus, Loader2, ExternalLink, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { ScheduleSessionModal } from '@/components/admin/sessions/schedule-session-modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
  getSessions,
  deleteSession,
  type ScheduledSession,
} from '@/lib/api/sessions';

export default function AdminSessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<ScheduledSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [deletingSession, setDeletingSession] = useState<ScheduledSession | null>(null);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getSessions();
      setSessions(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleDelete = async () => {
    if (!deletingSession) return;
    try {
      await deleteSession(deletingSession.id);
      setDeletingSession(null);
      toast.success('Session cancelled');
      fetchSessions();
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel session');
    }
  };

  const formatDateTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const upcoming = sessions.filter(
    (s) => new Date(s.start_time) > new Date(),
  );
  const past = sessions.filter(
    (s) => new Date(s.start_time) <= new Date(),
  );

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Live Trading Sessions</h1>
          <p className="text-sm text-gray-500">
            Schedule and manage Zoom webinars for your batches
          </p>
        </div>
        <button
          onClick={() => setShowScheduleModal(true)}
          className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" />
          Schedule New Class
        </button>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 py-20 text-gray-500">
          <Calendar className="mb-3 h-10 w-10 text-gray-300" />
          <p className="text-lg font-medium">No sessions scheduled</p>
          <p className="text-sm">Schedule your first live class to get started.</p>
        </div>
      ) : (
        <>
          {/* Upcoming */}
          {upcoming.length > 0 && (
            <section className="mb-8">
              <h2 className="mb-3 text-lg font-semibold text-gray-900">
                Upcoming Sessions
              </h2>
              <SessionTable
                sessions={upcoming}
                onDelete={setDeletingSession}
                formatDateTime={formatDateTime}
              />
            </section>
          )}

          {/* Past */}
          {past.length > 0 && (
            <section>
              <h2 className="mb-3 text-lg font-semibold text-gray-900">
                Past Sessions
              </h2>
              <SessionTable
                sessions={past}
                onDelete={setDeletingSession}
                formatDateTime={formatDateTime}
              />
            </section>
          )}
        </>
      )}

      <ScheduleSessionModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
      />

      <ConfirmDialog
        isOpen={!!deletingSession}
        title="Cancel Session"
        message={`Are you sure you want to cancel "${deletingSession?.title}"?`}
        confirmLabel="Cancel Session"
        onConfirm={handleDelete}
        onCancel={() => setDeletingSession(null)}
      />
    </div>
  );
}

function SessionTable({
  sessions,
  onDelete,
  formatDateTime,
}: {
  sessions: ScheduledSession[];
  onDelete: (s: ScheduledSession) => void;
  formatDateTime: (iso: string) => string;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-gray-200 bg-gray-50">
          <tr>
            <th className="px-5 py-3 font-medium text-gray-600">Title</th>
            <th className="px-5 py-3 font-medium text-gray-600">Batch</th>
            <th className="px-5 py-3 font-medium text-gray-600">Date &amp; Time</th>
            <th className="px-5 py-3 font-medium text-gray-600">Status</th>
            <th className="px-5 py-3 font-medium text-gray-600">Zoom</th>
            <th className="px-5 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {sessions.map((session) => (
            <tr key={session.id} className="hover:bg-gray-50">
              <td className="px-5 py-4 font-medium text-gray-900">
                {session.title}
              </td>
              <td className="px-5 py-4 text-gray-600">
                {(session as any).batchName || '—'}
              </td>
              <td className="px-5 py-4 text-gray-600">
                {formatDateTime(session.start_time)}
              </td>
              <td className="px-5 py-4">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    session.is_live
                      ? 'bg-green-100 text-green-700'
                      : new Date(session.start_time) > new Date()
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      session.is_live
                        ? 'bg-green-500'
                        : new Date(session.start_time) > new Date()
                          ? 'bg-blue-500'
                          : 'bg-gray-400'
                    }`}
                  />
                  {session.is_live
                    ? 'Live'
                    : new Date(session.start_time) > new Date()
                      ? 'Scheduled'
                      : 'Ended'}
                </span>
              </td>
              <td className="px-5 py-4">
                {(session as any).joinUrl ? (
                  <a
                    href={(session as any).joinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-brand-600 hover:text-brand-700"
                  >
                    Open
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </td>
              <td className="px-5 py-4 text-right">
                <button
                  onClick={() => onDelete(session)}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                  title="Cancel session"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
