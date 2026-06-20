'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  Film,
  Pencil,
  Trash2,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import {
  type AdminVideo,
  type Topic,
  getAdminVideos,
  deleteVideo,
} from '@/lib/api/videos';
import { EditVideoModal } from './edit-video-modal';

interface RecordingsTableProps {
  initialVideos: AdminVideo[];
  total: number;
  topics: Topic[];
  token?: string;
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  ready: { label: 'Ready', className: 'bg-green-100 text-green-700' },
  processing: { label: 'Processing', className: 'bg-yellow-100 text-yellow-700' },
  uploading: { label: 'Uploading', className: 'bg-blue-100 text-blue-700' },
  error: { label: 'Error', className: 'bg-red-100 text-red-700' },
};

function formatDuration(seconds?: number): string {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function RecordingsTable({
  initialVideos,
  total,
  topics,
  token,
}: RecordingsTableProps) {
  const [videos, setVideos] = useState<AdminVideo[]>(initialVideos);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingVideo, setEditingVideo] = useState<AdminVideo | null>(null);

  // Sync local state when parent refreshes (e.g. after a new upload)
  useEffect(() => {
    setVideos(initialVideos);
  }, [initialVideos]);

  const refreshVideos = useCallback(async () => {
    try {
      const result = await getAdminVideos({ page: 1, limit: 50 }, token);
      setVideos(result.items);
    } catch {
      // stay with last-known state
    }
  }, [token]);

  const handleDelete = async (video: AdminVideo) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${video.title}"?\n\nThis action cannot be undone. The Mux asset will remain in your Mux account but the video will be removed from the LMS.`,
    );

    if (!confirmed) return;

    setDeletingId(video.id);
    try {
      await deleteVideo(video.id, token);
      setVideos((prev) => prev.filter((v) => v.id !== video.id));
    } catch {
      alert('Failed to delete video. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSaved = (updated: AdminVideo) => {
    setVideos((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
  };

  if (videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 py-16 text-gray-500">
        <Film className="mb-3 h-10 w-10 text-gray-300" />
        <p className="text-lg font-medium">No recordings yet</p>
        <p className="text-sm mt-1">
          Recordings from Zoom webinars will appear here automatically.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Video
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Duration
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Topic
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Date
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {videos.map((video) => {
              const cfg = STATUS_CONFIG[video.status] ?? {
                label: video.status,
                className: 'bg-gray-100 text-gray-600',
              };

              return (
                <tr key={video.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50">
                        <Film className="h-5 w-5 text-brand-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-900 max-w-xs">
                          {video.title}
                        </p>
                        {video.description && (
                          <p className="truncate text-xs text-gray-500 max-w-xs">
                            {video.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {formatDuration(video.duration_seconds)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                    {video.topics?.name ?? '—'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.className}`}
                    >
                      {video.status === 'ready' ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : video.status === 'error' ? (
                        <AlertCircle className="h-3 w-3" />
                      ) : (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      )}
                      {cfg.label}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                    {formatDate(video.created_at)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setEditingVideo(video)}
                        className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(video)}
                        disabled={deletingId === video.id}
                        className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                        title="Delete"
                      >
                        {deletingId === video.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-sm text-gray-400">
        Showing {videos.length} of {total} total
      </p>

      {editingVideo && (
        <EditVideoModal
          video={editingVideo}
          topics={topics}
          isOpen={true}
          onClose={() => setEditingVideo(null)}
          onSaved={handleSaved}
          token={token}
        />
      )}
    </>
  );
}
