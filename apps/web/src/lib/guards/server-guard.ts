import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import { ROLES } from '@/lib/constants';
import type { Role } from './permissions';
import { getRoleForPath, hasRequiredRole } from './permissions';

interface AuthUser {
  id: string;
  email: string;
  role: string;
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split('.')[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

/**
 * Require the user to be authenticated.
 * Redirects to /login if no valid token is found.
 * Returns the decoded AuthUser on success.
 */
export async function requireAuth(): Promise<AuthUser> {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;

  if (!token) {
    redirect('/login');
  }

  const payload = decodeJwtPayload(token);
  if (!payload?.role) {
    redirect('/login');
  }

  return {
    id: (payload.sub ?? payload.id ?? '') as string,
    email: (payload.email ?? '') as string,
    role: payload.role as string,
  };
}

/**
 * Require the user to have a specific role.
 * Must be called on a page that is already behind that role's route prefix.
 * Throws notFound() if role doesn't match (handled by error.tsx).
 */
export async function requireRole(allowedRoles: Role[]): Promise<AuthUser> {
  const user = await requireAuth();

  if (!allowedRoles.includes(user.role as Role)) {
    notFound();
  }

  return user;
}

/**
 * Optional auth — returns user if logged in, null otherwise.
 * Never redirects.
 */
export async function getOptionalUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;
    if (!token) return null;

    const payload = decodeJwtPayload(token);
    if (!payload?.role) return null;

    return {
      id: (payload.sub ?? payload.id ?? '') as string,
      email: (payload.email ?? '') as string,
      role: payload.role as string,
    };
  } catch {
    return null;
  }
}
