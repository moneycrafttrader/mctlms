export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function fetchApi<T = any>(
  endpoint: string,
  options?: RequestInit & { token?: string },
): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  let token = options?.token;

  // Token resolution strategy:
  //   1. If the caller explicitly passed a token, use it.
  //   2. On the SERVER (SSR), read the access_token cookie from the
  //      incoming request via next/headers so that Server Components
  //      can authenticate fetches to the NestJS backend.  This is
  //      needed because the Vercel-domain cookie is never sent to
  //      Render automatically.
  //   3. On the CLIENT, fall back to parsing document.cookie (set by
  //      the login page on the Vercel domain).
  if (!token) {
    if (typeof window === 'undefined') {
      try {
        const { cookies } = await import('next/headers');
        const cookieStore = cookies();
        token = cookieStore.get('access_token')?.value;
      } catch {
        // Not in a request context (build step, test runner, etc.)
      }
    } else {
      const match = document.cookie.match(/(?:^|;\s*)access_token=([^;]*)/);
      token = match ? match[1] : undefined;
    }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const { token: _token, ...fetchOptions } = options ?? {};
  const response = await fetch(url, {
    ...fetchOptions,
    headers,
    credentials: 'include',
    cache: 'no-store',
  });

  if (!response.ok) {
    let errorData: any;
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: response.statusText };
    }

    throw new ApiError(
      errorData.message || `Request failed with status ${response.status}`,
      response.status,
      errorData,
    );
  }

  const data = await response.json();

  if (data && typeof data === 'object' && 'success' in data && 'data' in data) {
    return data.data as T;
  }

  return data as T;
}
