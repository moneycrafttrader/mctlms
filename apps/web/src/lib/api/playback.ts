import { fetchApi } from '@/lib/api-client';

export interface AuthorizeResponse {
  playbackToken: string;
  sessionId: string;
  expiresInSeconds: number;
}

export interface PlaybackUrlResponse {
  url: string;
  thumbnail: string;
  sessionId: string;
  expiresAt: string;
}

export async function authorizePlayback(
  recordingId: string,
  deviceId?: string,
) {
  return fetchApi<AuthorizeResponse>(
    `/recordings/${recordingId}/authorize`,
    {
      method: 'POST',
      body: JSON.stringify({ deviceId }),
    },
  );
}

export async function getPlaybackUrl(
  recordingId: string,
  token: string,
  deviceId?: string,
) {
  const params = new URLSearchParams({ token });
  if (deviceId) params.set('deviceId', deviceId);
  return fetchApi<PlaybackUrlResponse>(
    `/recordings/${recordingId}/play?${params.toString()}`,
  );
}

export async function reportPlaybackEvent(
  recordingId: string,
  eventType: 'play' | 'pause' | 'seek' | 'ended' | 'heartbeat',
  positionSeconds?: number,
  playbackSessionId?: string,
) {
  return fetchApi(
    `/playback/event`,
    {
      method: 'POST',
      body: JSON.stringify({
        recordingId,
        eventType,
        positionSeconds,
        playbackSessionId,
      }),
    },
  );
}
