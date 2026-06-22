const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function validateTokenOnServer(token: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/auth/validate-session`, {
      headers: { Authorization: `Bearer ${token}` },
      credentials: 'include',
    });
    return res.ok;
  } catch {
    return false;
  }
}
