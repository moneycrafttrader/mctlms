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

const API_URL = 'http://localhost:3001';

export async function fetchApi<T = any>(
  endpoint: string,
  options?: RequestInit & { token?: string },
): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  const token = options?.token;

  console.log('[API Client] Executing fetch to:', url);

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

  // Unwrap NestJS ResponseTransformInterceptor wrapper if present
  if (data && typeof data === 'object' && 'success' in data && 'data' in data) {
    return data.data as T;
  }

  return data as T;
}
