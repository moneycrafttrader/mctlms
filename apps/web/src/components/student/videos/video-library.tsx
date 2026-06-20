'use client';

import { useState, useEffect } from 'react';
import {
  Film,
  PlayCircle,
  CheckCircle,
  Clock,
  Loader2,
} from 'lucide-react';
import { type StudentVideo, getMyVideos, getVideoPlaybackUrl } from '@/lib/api/videos';

interface VideoLibraryProps {
  token?: string;
}

interface VideoWithTopic extends StudentVideo {
  topicName?: string;
}

function secondsToMinutes(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function VideoLibrary({ token }: VideoLibraryProps) {
  const [videos, setVideos] = useState<VideoWithTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState<string | null>(null);
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);

  useEffect(() => {
    getMyVideos(undefined, token)
      .then((data) => {
        const withTopics = (data as any[]).map((v) => ({
          ...v,
          topicName: v.topics?.name || 'Uncategorized',
        }));
        setVideos(withTopics);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const handlePlay = async (videoId: string) => {
    setPlaying(videoId);
    try {
      const result = await getVideoPlaybackUrl(videoId, token);
      setPlaybackUrl(result.url);
    } catch {
      setPlaying(null);
    }
  };

  const groupedVideos = videos.reduce<Record<string, VideoWithTopic[]>>(
    (acc, video) => {
      const topic = video.topicName || 'Uncategorized';
      if (!acc[topic]) acc[topic] = [];
      acc[topic].push(video);
      return acc;
    },
    {},
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-500">
        Loading video library...
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 py-16 text-gray-500">
        <Film className="mb-3 h-10 w-10 text-gray-300" />
        <p className="text-lg font-medium">No videos available</p>
        <p className="text-sm mt-1">
          Videos will appear here once your batches are assigned content.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      {Object.entries(groupedVideos).map(([topicName, topicVideos]) => (
        <section key={topicName}>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{topicName}</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {topicVideos.map((video) => (
              <div
                key={video.id}
                className="rounded-xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-3 flex items-start justify-between">
                  <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 flex-1">
                    {video.title}
                  </h3>
                  {video.progress?.completed && (
                    <CheckCircle className="h-4 w-4 text-green-500 shrink-0 ml-2" />
                  )}
                </div>

                {video.description && (
                  <p className="mb-3 text-xs text-gray-500 line-clamp-2">
                    {video.description}
                  </p>
                )}

                <div className="mb-3 flex items-center gap-3 text-xs text-gray-400">
                  {video.progress && video.progress.watched_seconds > 0 && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {secondsToMinutes(video.progress.watched_seconds)}
                    </span>
                  )}
                </div>

                {video.progress && video.progress.watched_seconds > 0 && (
                  <div className="mb-3 h-1.5 w-full rounded-full bg-gray-200">
                    <div
                      className="h-1.5 rounded-full bg-brand-500"
                      style={{
                        width: `${Math.min(
                          (video.progress.watched_seconds / 300) * 100,
                          100,
                        )}%`,
                      }}
                    />
                  </div>
                )}

                <button
                  onClick={() => handlePlay(video.id)}
                  disabled={playing === video.id}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
                >
                  {playing === video.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <PlayCircle className="h-3.5 w-3.5" />
                  )}
                  {playing === video.id ? 'Loading...' : 'Play'}
                </button>
              </div>
            ))}
          </div>
        </section>
      ))}

      {playbackUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="relative w-full max-w-4xl rounded-xl bg-black overflow-hidden">
            <button
              onClick={() => {
                setPlaybackUrl(null);
                setPlaying(null);
              }}
              className="absolute top-3 right-3 z-10 rounded-full bg-white/20 p-1.5 text-white hover:bg-white/30"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <video
              controls
              autoPlay
              className="w-full aspect-video"
              src={playbackUrl}
            >
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      )}
    </div>
  );
}
