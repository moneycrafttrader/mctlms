'use client';

import { useState, useCallback } from 'react';
import { type AdminVideo, type Topic, getAdminVideos } from '@/lib/api/videos';
import { RecordingsTable } from './recordings-table';
import { ManualUploadButton } from './manual-upload-button';

interface RecordingsPageClientProps {
  initialVideos: AdminVideo[];
  total: number;
  topics: Topic[];
  token?: string;
}

export function RecordingsPageClient({
  initialVideos,
  total,
  topics,
  token,
}: RecordingsPageClientProps) {
  const [videos, setVideos] = useState<AdminVideo[]>(initialVideos);
  const [videoCount, setVideoCount] = useState(total);

  const refreshVideos = useCallback(async () => {
    try {
      const result = await getAdminVideos({ page: 1, limit: 50 }, token);
      setVideos(result.items);
      setVideoCount(result.total);
    } catch {
      // stay with last-known state
    }
  }, [token]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recordings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage auto-imported Zoom recordings and manually uploaded videos.
          </p>
        </div>
        <ManualUploadButton onUploadComplete={refreshVideos} token={token} />
      </div>

      <RecordingsTable
        initialVideos={videos}
        total={videoCount}
        topics={topics}
        token={token}
      />
    </div>
  );
}
