import { fetchApi } from '@/lib/api-client';
import { API_ROUTES } from '@/lib/constants';

export interface BatchRef {
  id: string;
  name: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  is_active: boolean;
  created_at: string;
  batches?: BatchRef[];
}

/**
 * Fetch users filtered by role (e.g. 'student'), with pagination.
 */
export async function getUsers(
  params: { role?: string; page?: number; limit?: number } = {},
  token?: string,
) {
  const query = new URLSearchParams();
  if (params.role) query.set('role', params.role);
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));

  const qs = query.toString();
  const endpoint = `${API_ROUTES.USERS}${qs ? `?${qs}` : ''}`;

  return fetchApi<{ items: User[]; total: number; page: number; limit: number }>(
    endpoint,
    { token },
  );
}

/**
 * Convenience wrapper to get only student users.
 */
export async function getStudents(token?: string) {
  return getUsers({ role: 'student', limit: 200 }, token);
}

/**
 * Create a single user (admin-only). Password is auto-generated client-side.
 * POST /users
 */
export async function createUser(
  data: { name: string; email: string; role: string; phone?: string },
  token?: string,
) {
  const password = crypto.randomUUID().replace(/-/g, '').slice(0, 10) + 'Aa1!';
  return fetchApi<User>(API_ROUTES.USERS, {
    method: 'POST',
    body: JSON.stringify({ ...data, password }),
    token,
  });
}
