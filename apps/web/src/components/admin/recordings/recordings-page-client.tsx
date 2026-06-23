'use client';

import { useState, useCallback } from 'react';
import { Video, BarChart3 } from 'lucide-react';
import { type AdminVideo, type Topic, getAdminVideos } from '@/lib/api/videos';
import { AdminPageHeader } from '@/components/shared/AdminPageHeader';
import { AdminSection } from '@/components/shared/AdminSection';
import { AdminStatCard } from '@/components/shared/AdminStatCard';
import { RecordingsTable } from './recordings-table';
import { ManualUploadButton } from './manual-upload-button';

interface RecordingsPageClientProps {
  initialVideos: AdminVideo[];
  total: number;
  topics: Topic[];
}

export function RecordingsPageClient({ initialVideos, total, topics }: RecordingsPageClientProps) {
  const [videos, setVideos] = useState<AdminVideo[]>(initialVideos);
  const [videoCount, setVideoCount] = useState(total);

  const refreshVideos = useCallback(async () => {
    try { const r = await getAdminVideos({ page: 1, limit: 50 }); setVideos(r.items); setVideoCount(r.total); } catch { /* silent */ }
  }, []);

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Recordings" description="Manage auto-imported Zoom recordings and manually uploaded videos." actions={<ManualUploadButton onUploadComplete={refreshVideos} />} />

      <AdminSection title="Overview">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <AdminStatCard label="Total Recordings" value={videoCount} icon={Video} iconColor="bg-brand-50 text-brand-600" />
          <AdminStatCard label="Topics" value={topics.length} icon={BarChart3} iconColor="bg-blue-50 text-blue-600" />
        </div>
      </AdminSection>

      <RecordingsTable initialVideos={videos} total={videoCount} topics={topics} />
    </div>
  );
}
