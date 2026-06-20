import { fetchApi } from '@/lib/api-client';
import { API_ROUTES } from '@/lib/constants';

export interface LiveSession {
  id: string;
  zoom_webinar_id?: string;
  zoom_join_url?: string;
  zoom_start_url?: string;
  topic: string;
  agenda?: string;
  start_time: string;
  duration_minutes: number;
  host_user_id: string;
  status: string;
  created_at: string;
}

export interface LiveSessionWithDetails extends LiveSession {
  batchIds: string[];
  hostTeacher?: { id: string; name: string; email: string } | null;
}

export interface StudentSessions {
  upcoming: LiveSession[];
  past: (LiveSession & { attendanceStatus?: string })[];
}

export async function getMySessions(token?: string) {
  return fetchApi<StudentSessions>(`${API_ROUTES.LIVE_SESSIONS}/my`, { token });
}

export async function getSessionById(id: string, token?: string) {
  return fetchApi<LiveSessionWithDetails>(`${API_ROUTES.LIVE_SESSIONS}/${id}`, { token });
}

export async function getSessionJoinUrl(id: string, token?: string) {
  return fetchApi<string>(`${API_ROUTES.LIVE_SESSIONS}/${id}/join`, { token });
}
