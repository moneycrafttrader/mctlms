import { fetchApi } from '@/lib/api-client';
import { API_ROUTES } from '@/lib/constants';

export interface StudentVideo {
  id: string;
  title: string;
  description?: string;
  topic_id?: string;
  sort_order: number;
  status: string;
  created_at: string;
  topics?: { name: string } | null;
  progress: {
    watched_seconds: number;
    completed: boolean;
    last_watched_at: string | null;
  };
}

export interface AdminVideo {
  id: string;
  title: string;
  description?: string;
  topic_id?: string;
  mux_playback_id?: string;
  mux_asset_id?: string;
  sort_order: number;
  status: string;
  duration_seconds?: number;
  created_at: string;
  topics?: { name: string } | null;
  recording_batches?: { batch_id: string }[];
}

export interface Topic {
  id: string;
  name: string;
  description?: string;
  sort_order: number;
  recordings?: { count: number }[];
}

export interface AdminVideosResponse {
  items: AdminVideo[];
  total: number;
  page: number;
  limit: number;
}

export interface UploadUrlResponse {
  uploadUrl: string;
  recording: { id: string; title: string; status: string; created_at: string };
}

export interface PlaybackResponse {
  url: string;
  thumbnail: string;
}

export async function getAdminVideos(
  params?: { topicId?: string; page?: number; limit?: number },
  token?: string,
) {
  const searchParams = new URLSearchParams();
  if (params?.topicId) searchParams.set('topicId', params.topicId);
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.limit) searchParams.set('limit', String(params.limit));
  const query = searchParams.toString();
  return fetchApi<AdminVideosResponse>(
    `${API_ROUTES.ADMIN_RECORDINGS}/all${query ? `?${query}` : ''}`,
    { token },
  );
}

export async function getVideoTopics(token?: string) {
  return fetchApi<Topic[]>(`${API_ROUTES.ADMIN_TOPICS}`, { token });
}

export async function getMuxUploadUrl(title: string, token?: string) {
  return fetchApi<UploadUrlResponse>(`${API_ROUTES.ADMIN_UPLOAD_URL}`, {
    method: 'POST',
    body: JSON.stringify({ title }),
    token,
  });
}

export async function updateVideoMetadata(
  videoId: string,
  data: { title?: string; description?: string; topicId?: string | null },
  token?: string,
) {
  return fetchApi<AdminVideo>(`${API_ROUTES.ADMIN_RECORDINGS}/${videoId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
    token,
  });
}

export async function deleteVideo(videoId: string, token?: string) {
  return fetchApi<{ deleted: boolean }>(`${API_ROUTES.ADMIN_RECORDINGS}/${videoId}`, {
    method: 'DELETE',
    token,
  });
}

export async function getMyVideos(topicId?: string, token?: string) {
  const params = topicId ? `?topicId=${topicId}` : '';
  return fetchApi<StudentVideo[]>(`${API_ROUTES.RECORDINGS}/my${params}`, { token });
}

export async function getVideoPlaybackUrl(videoId: string, token?: string) {
  return fetchApi<PlaybackResponse>(`${API_ROUTES.RECORDINGS}/${videoId}/play`, { token });
}

export async function updateVideoProgress(
  videoId: string,
  watchedSeconds: number,
  completed?: boolean,
  token?: string,
) {
  return fetchApi(`${API_ROUTES.RECORDINGS}/${videoId}/progress`, {
    method: 'POST',
    body: JSON.stringify({ watchedSeconds, completed }),
    token,
  });
}

export interface BatchVideo {
  id: string;
  title: string;
  description?: string;
  muxPlaybackId?: string;
  duration?: number;
  status: string;
  createdAt: string;
}

export async function getBatchVideos(batchId: string, token?: string) {
  return fetchApi<BatchVideo[]>(`${API_ROUTES.RECORDINGS}/batch/${batchId}`, { token });
}
