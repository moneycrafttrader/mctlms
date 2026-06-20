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
  video_batch_access?: { batch_id: string }[];
}

export interface Topic {
  id: string;
  name: string;
  description?: string;
  sort_order: number;
  videos?: { count: number }[];
}

export interface AdminVideosResponse {
  items: AdminVideo[];
  total: number;
  page: number;
  limit: number;
}

export interface UploadUrlResponse {
  uploadUrl: string;
  video: { id: string; title: string; status: string; created_at: string };
}

export interface PlaybackResponse {
  url: string;
  thumbnail: string;
}

/**
 * Fetch all videos for the admin recordings view.
 * Supports optional topicId filtering and pagination.
 */
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
    `${API_ROUTES.VIDEOS}/admin${query ? `?${query}` : ''}`,
    { token },
  );
}

/**
 * Fetch all video topics with video counts.
 */
export async function getVideoTopics(token?: string) {
  return fetchApi<Topic[]>(`${API_ROUTES.VIDEOS}/topics`, { token });
}

/**
 * Request a Mux direct upload URL and create a pending video record.
 */
export async function getMuxUploadUrl(title: string, token?: string) {
  return fetchApi<UploadUrlResponse>(`${API_ROUTES.VIDEOS}/upload-url`, {
    method: 'POST',
    body: JSON.stringify({ title }),
    token,
  });
}

/**
 * Update video metadata (title, description, topic assignment).
 */
export async function updateVideoMetadata(
  videoId: string,
  data: { title?: string; description?: string; topicId?: string | null },
  token?: string,
) {
  return fetchApi<AdminVideo>(`${API_ROUTES.VIDEOS}/${videoId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
    token,
  });
}

/**
 * Delete a video permanently.
 * The caller should confirm before calling this.
 */
export async function deleteVideo(videoId: string, token?: string) {
  return fetchApi<{ deleted: boolean }>(`${API_ROUTES.VIDEOS}/${videoId}`, {
    method: 'DELETE',
    token,
  });
}

/**
 * Fetch videos accessible by the current student.
 */
export async function getMyVideos(topicId?: string, token?: string) {
  const params = topicId ? `?topicId=${topicId}` : '';
  return fetchApi<StudentVideo[]>(`${API_ROUTES.VIDEOS}/my${params}`, { token });
}

/**
 * Get a signed Mux playback URL for a video.
 */
export async function getVideoPlaybackUrl(videoId: string, token?: string) {
  return fetchApi<PlaybackResponse>(`${API_ROUTES.VIDEOS}/${videoId}/play`, { token });
}

/**
 * Update the watch progress on a video (called by the player every ~30s).
 */
export async function updateVideoProgress(
  videoId: string,
  watchedSeconds: number,
  completed?: boolean,
  token?: string,
) {
  return fetchApi(`${API_ROUTES.VIDEOS}/${videoId}/progress`, {
    method: 'POST',
    body: JSON.stringify({ watchedSeconds, completed }),
    token,
  });
}

// ── Student Course Classroom ─────────────────────────────────

export interface BatchVideo {
  id: string;
  title: string;
  description?: string;
  muxPlaybackId?: string;
  duration?: number;
  status: string;
  createdAt: string;
}

/**
 * Fetch all ready videos assigned to a specific batch.
 * Used by the student course classroom page.
 */
export async function getBatchVideos(batchId: string, token?: string) {
  return fetchApi<BatchVideo[]>(`${API_ROUTES.VIDEOS}/batch/${batchId}`, { token });
}
