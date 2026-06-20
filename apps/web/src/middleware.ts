import { type NextRequest, NextResponse } from 'next/server';

const ADMIN_ROUTES = ['/admin'];
const STUDENT_ROUTES = ['/student'];
const PUBLIC_ROUTES = ['/login', '/_next/static', '/_next/image', '/favicon.ico', '/api'];

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split('.')[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get('access_token')?.value;
  const payload = accessToken ? decodeJwtPayload(accessToken) : null;
  const role = payload?.role as string | undefined;

  const isAdminRoute = ADMIN_ROUTES.some((route) => pathname.startsWith(route));
  const isStudentRoute = STUDENT_ROUTES.some((route) => pathname.startsWith(route));

  if (!role) {
    if (isAdminRoute || isStudentRoute) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  if (isAdminRoute && role !== 'admin') {
    if (role === 'student') {
      return NextResponse.redirect(new URL('/student', request.url));
    }
    const forbiddenUrl = new URL('/login', request.url);
    forbiddenUrl.searchParams.set('error', 'forbidden');
    return NextResponse.redirect(forbiddenUrl);
  }

  if (isStudentRoute && role !== 'student') {
    if (role === 'admin') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    const forbiddenUrl = new URL('/login', request.url);
    forbiddenUrl.searchParams.set('error', 'forbidden');
    return NextResponse.redirect(forbiddenUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
