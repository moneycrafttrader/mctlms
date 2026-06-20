/*
 * VideoTheater — split-view layout: player on the left, playlist sidebar on the right
 *
 * Manages which video is currently active. Defaults to the first video in the list.
 * The sidebar shows all available videos for the student's batch.
 */
'use client';

import { useState } from 'react';
import { PlayCircle, Clock } from 'lucide-react';
import { MuxVideoPlayer } from './mux-video-player';
import type { BatchVideo } from '@/lib/api/videos';

interface VideoTheaterProps {
  videos: BatchVideo[];
}

function formatDuration(seconds?: number): string {
  if (!seconds) return 'Recording';
  const m = Math.floor(seconds / 60);
  return `${m} mins`;
}

export function VideoTheater({ videos }: VideoTheaterProps) {
  const [activeVideo, setActiveVideo] = useState<BatchVideo | null>(
    videos.length > 0 ? videos[0] : null,
  );

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <MuxVideoPlayer
          playbackId={activeVideo?.muxPlaybackId}
          title={activeVideo?.title}
        />
        {activeVideo && (
          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900">{activeVideo.title}</h2>
            {activeVideo.description && (
              <p className="mt-2 text-gray-600">{activeVideo.description}</p>
            )}
          </div>
        )}
      </div>

      <div className="flex h-[calc(100vh-16rem)] min-h-[500px] flex-col rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="rounded-t-xl border-b border-gray-100 bg-gray-50 p-4">
          <h3 className="flex items-center gap-2 font-bold text-gray-900">
            <PlayCircle className="h-5 w-5 text-brand-600" />
            Video Library
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {videos.length} recording{videos.length !== 1 ? 's' : ''} available
          </p>
        </div>

        <div className="flex-1 space-y-1 overflow-y-auto p-2">
          {videos.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">
              No recordings have been posted for this batch yet.
            </div>
          ) : (
            videos.map((video) => {
              const isActive = activeVideo?.id === video.id;
              return (
                <button
                  key={video.id}
                  onClick={() => setActiveVideo(video)}
                  className={`flex w-full flex-col gap-2 rounded-lg p-4 text-left transition-all duration-200 ${
                    isActive
                      ? 'border border-brand-200 bg-brand-50 shadow-sm'
                      : 'border border-transparent hover:bg-gray-50'
                  }`}
                >
                  <span
                    className={`line-clamp-2 font-medium ${
                      isActive ? 'text-brand-700' : 'text-gray-700'
                    }`}
                  >
                    {video.title}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    {formatDuration(video.duration)}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
