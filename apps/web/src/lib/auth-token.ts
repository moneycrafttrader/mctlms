export async function getAccessToken(): Promise<string | undefined> {
  if (typeof window === 'undefined') {
    try {
      const { cookies } = await import('next/headers');
      const cookieStore = cookies();
      return cookieStore.get('access_token')?.value;
    } catch {
      return undefined;
    }
  }
  const match = document.cookie.match(/(?:^|;\s*)access_token=([^;]*)/);
  return match ? match[1] : undefined;
}

export function getAccessTokenSync(): string | null {
  if (typeof window === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)access_token=([^;]*)/);
  return match ? match[1] : null;
}
