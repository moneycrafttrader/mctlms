import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getMyVideos, getVideoPlaybackUrl } from '@/lib/api/videos';
import { PageHeader } from '@/components/shared/PageHeader';
import { VideoPlayerClient } from './video-player-client';

export const dynamic = 'force-dynamic';

interface Props {
  params: { recordingId: string };
}

export default async function StudentVideoPlayerPage({ params }: Props) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;

  if (!token) {
    redirect('/login');
  }

  let playbackUrl = '';
  let thumbnail = '';
  let videoTitle = '';
  let videoDate = '';

  try {
    const [playback, recordings] = await Promise.all([
      getVideoPlaybackUrl(params.recordingId, token),
      getMyVideos(undefined, token).catch(() => []),
    ]);

    playbackUrl = playback.url;
    thumbnail = playback.thumbnail;

    const video = recordings.find((r) => r.id === params.recordingId);
    if (video) {
      videoTitle = video.title;
      videoDate = new Date(video.created_at).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    }
  } catch {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-lg font-bold text-text-primary">
            Failed to load video
          </h2>
          <p className="mt-2 text-sm text-text-secondary">
            The recording may not be ready or you may not have access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title={videoTitle || 'Recording'} showBack />
      <div className="md:px-0">
        <VideoPlayerClient
          playbackUrl={playbackUrl}
          thumbnail={thumbnail}
          title={videoTitle}
          date={videoDate}
        />
      </div>
    </div>
  );
}
