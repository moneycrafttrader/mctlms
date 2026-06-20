import { fetchApi } from '@/lib/api-client';
import { API_ROUTES } from '@/lib/constants';

export interface CreateRecordingData {
  title: string;
  description?: string;
  videoUrl?: string;
  batchIds: string[];
}

export interface Recording {
  id: string;
  title: string;
  description?: string;
  mux_asset_id?: string;
  mux_playback_id?: string;
  duration_seconds?: number;
  status: string;
  created_at: string;
  batchNames: string[];
  batchIds: string[];
}

export interface CreateRecordingWithUploadResponse {
  recording: Recording;
  uploadUrl: string;
}

export async function createRecording(
  data: CreateRecordingData,
  token?: string,
) {
  return fetchApi<CreateRecordingWithUploadResponse>(API_ROUTES.ADMIN_RECORDINGS, {
    method: 'POST',
    body: JSON.stringify(data),
    token,
  });
}

export async function getRecordings(token?: string) {
  return fetchApi<Recording[]>(API_ROUTES.ADMIN_RECORDINGS, { token });
}
