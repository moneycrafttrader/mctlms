import { APIRequestContext } from '@playwright/test';

interface LoginResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    mustChangePassword: boolean;
  };
}

export async function loginAs(
  request: APIRequestContext,
  email: string,
  password: string,
): Promise<{ token: string; userId: string }> {
  const response = await request.post('/auth/login', {
    data: { email, password },
  });

  if (!response.ok()) {
    const body = await response.text();
    throw new Error(`Login failed for ${email}: ${response.status()} ${body}`);
  }

  const wrapper: { success: boolean; data: LoginResponse } = await response.json();
  return {
    token: wrapper.data.token,
    userId: wrapper.data.user.id,
  };
}

export function authHeader(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}
