import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const ADMIN_ROUTES = ['/admin'];
const STUDENT_ROUTES = ['/student'];
const PUBLIC_ROUTES = ['/login', '/_next/static', '/_next/image', '/favicon.ico', '/api'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Create Supabase client for middleware
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Refresh session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAdminRoute = ADMIN_ROUTES.some((route) => pathname.startsWith(route));
  const isStudentRoute = STUDENT_ROUTES.some((route) => pathname.startsWith(route));

  // Not authenticated
  if (!user) {
    if (isAdminRoute || isStudentRoute) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    return supabaseResponse;
  }

  // Fetch user profile to get role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const role = (profile as any)?.role;

  // Route protection by role
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

  return supabaseResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
