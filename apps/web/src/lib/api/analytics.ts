import { fetchApi } from '@/lib/api-client';

export interface AdminOverview {
  studentCount: number;
  totalRevenue: number;
  activeCourses: number;
  upcomingSessions: {
    id: string;
    topic: string;
    startTime: string;
    durationMinutes: number;
  }[];
}

/**
 * Fetch aggregate dashboard data for the admin overview.
 */
export async function getAdminOverview(token?: string) {
  return fetchApi<AdminOverview>('/analytics/admin-overview', { token });
}
