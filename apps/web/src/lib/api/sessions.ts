import { fetchApi } from '@/lib/api-client';
import { API_ROUTES } from '@/lib/constants';

export interface ScheduleSessionData {
  title: string;
  startTime: string;
  batchId: string;
}

export interface ScheduledSession {
  id: string;
  batch_id: string;
  zoom_meeting_id: string;
  start_time: string;
  title: string;
  is_live: boolean;
  created_at: string;
  updated_at: string;
  joinUrl: string;
  startUrl: string;
}

export async function scheduleSession(
  data: ScheduleSessionData,
  token?: string,
) {
  return fetchApi<ScheduledSession>(API_ROUTES.ADMIN_SESSIONS, {
    method: 'POST',
    body: JSON.stringify(data),
    token,
  });
}

export async function getSessions(token?: string) {
  return fetchApi<ScheduledSession[]>(API_ROUTES.ADMIN_SESSIONS, { token });
}

export async function deleteSession(id: string, token?: string) {
  return fetchApi<{ deleted: boolean }>(`${API_ROUTES.ADMIN_SESSIONS}/${id}`, {
    method: 'DELETE',
    token,
  });
}
