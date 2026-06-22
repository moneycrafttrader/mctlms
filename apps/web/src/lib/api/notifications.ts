import { fetchApi } from '@/lib/api-client';
import { API_ROUTES } from '@/lib/constants';

export interface Announcement {
  id: string;
  title: string;
  message: string;
  target_type: string;
  target_id?: string;
  is_published: boolean;
  published_at?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  announcement_id?: string;
  data?: Record<string, any>;
  isRead: boolean;
  readAt?: string;
  created_at: string;
}

export async function getAnnouncements() {
  return fetchApi<Announcement[]>(API_ROUTES.ADMIN_ANNOUNCEMENTS);
}

export async function createAnnouncement(data: {
  title: string;
  message: string;
  targetType: string;
  targetId?: string;
  isPublished?: boolean;
}) {
  return fetchApi<Announcement>(API_ROUTES.ADMIN_ANNOUNCEMENTS, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateAnnouncement(
  id: string,
  data: {
    title?: string;
    message?: string;
    targetType?: string;
    targetId?: string;
    isPublished?: boolean;
  },
) {
  return fetchApi<Announcement>(`${API_ROUTES.ADMIN_ANNOUNCEMENTS}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function getMyNotifications() {
  return fetchApi<Notification[]>(API_ROUTES.STUDENT_NOTIFICATIONS);
}

export async function getUnreadCount() {
  return fetchApi<{ unreadCount: number }>(API_ROUTES.STUDENT_NOTIFICATIONS_UNREAD);
}

export async function markAsRead(notificationId: string) {
  return fetchApi<{ success: boolean }>(
    `${API_ROUTES.STUDENT_NOTIFICATIONS_READ}/${notificationId}/read`,
    { method: 'POST' },
  );
}

export async function markAllAsRead() {
  return fetchApi<{ success: boolean; markedCount: number }>(
    `${API_ROUTES.STUDENT_NOTIFICATIONS_READ}/read-all`,
    { method: 'POST' },
  );
}
