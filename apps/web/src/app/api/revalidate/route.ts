/*
 * Revalidation Route Handler — purges Next.js Data Cache / Full Route Cache for a given path
 *
 * Called by client components after mutations (e.g. course creation, batch creation)
 * to ensure the server-side cache is invalidated so the next hard refresh fetches fresh data.
 *
 * This handler is only reachable from authenticated pages (admins must be logged in
 * to create courses), so no additional auth is needed here.
 */
import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { path } = body as { path?: string };

    if (!path) {
      return NextResponse.json({ revalidated: false, error: 'path is required' }, { status: 400 });
    }

    revalidatePath(path);

    return NextResponse.json({ revalidated: true, path });
  } catch {
    return NextResponse.json({ revalidated: false, error: 'invalid request body' }, { status: 400 });
  }
}
