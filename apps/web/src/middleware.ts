import { type NextRequest } from 'next/server';
import { middlewareGuard } from '@/lib/guards/middleware-guard';

export async function middleware(request: NextRequest) {
  return middlewareGuard(request) ?? undefined;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
