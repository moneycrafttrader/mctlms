import { ROLES } from '@/lib/constants';

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_ROUTES: Record<Role, string[]> = {
  [ROLES.ADMIN]: ['/admin'],
  [ROLES.STUDENT]: ['/student'],
  [ROLES.TEACHER]: ['/teacher'],
};

export const PUBLIC_ROUTES = [
  '/login',
  '/change-password',
  '/reset-password',
  '/_next/static',
  '/_next/image',
  '/favicon.ico',
  '/api',
];

export function getRoleForPath(pathname: string): Role | null {
  for (const [role, prefixes] of Object.entries(ROLE_ROUTES)) {
    if (prefixes.some((prefix) => pathname.startsWith(prefix))) {
      return role as Role;
    }
  }
  return null;
}

export function isProtectedRoute(pathname: string): boolean {
  return getRoleForPath(pathname) !== null;
}

export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
}

export function hasRequiredRole(userRole: string | undefined, pathname: string): boolean {
  const requiredRole = getRoleForPath(pathname);
  if (!requiredRole) return true;
  return userRole === requiredRole;
}
