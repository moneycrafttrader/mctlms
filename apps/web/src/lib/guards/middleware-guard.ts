import { type NextRequest, NextResponse } from 'next/server';
import {
  isPublicRoute,
  isProtectedRoute,
  hasRequiredRole,
  PUBLIC_ROUTES,
} from './permissions';
import { logAuthDenied, logAccessDenied } from './audit';

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split('.')[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

function getRedirectUrl(request: NextRequest, pathname: string, path: string): NextResponse {
  const url = new URL(path, request.url);
  url.searchParams.set('redirect', pathname);
  return NextResponse.redirect(url);
}

export function middlewareGuard(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;

  // 1. Public routes — pass through
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // 2. Static assets — pass through
  if (pathname.startsWith('/_next')) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get('access_token')?.value;
  const payload = accessToken ? decodeJwtPayload(accessToken) : null;
  const role = payload?.role as string | undefined;

  // 3. AuthGuard — no token on protected route
  if (!role) {
    if (isProtectedRoute(pathname)) {
      logAuthDenied(pathname);
      return getRedirectUrl(request, pathname, '/login');
    }
    return NextResponse.next();
  }

  // 4. Must change password redirect
  const mustChangePassword =
    request.cookies.get('must_change_password')?.value === 'true';
  if (mustChangePassword && pathname !== '/change-password') {
    return NextResponse.redirect(new URL('/change-password', request.url));
  }

  // 5. RoleGuard — check role matches route prefix
  if (!hasRequiredRole(role, pathname)) {
    logAccessDenied(pathname, role, pathname.split('/')[1] ?? 'unknown');

    // Cross-role redirect: send user to their own home
    if (role === 'student') {
      return NextResponse.redirect(new URL('/student', request.url));
    }
    if (role === 'admin') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    if (role === 'teacher') {
      return NextResponse.redirect(new URL('/teacher', request.url));
    }

    // Unknown role — send to login
    return getRedirectUrl(request, pathname, '/login');
  }

  // 6. All checks passed
  return NextResponse.next();
}
