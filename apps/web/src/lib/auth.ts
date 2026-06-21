const TOKEN_KEY = 'auth-token';
const MUST_CHANGE_PASSWORD_KEY = 'must_change_password';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function getMustChangePassword(): boolean {
  return localStorage.getItem(MUST_CHANGE_PASSWORD_KEY) === 'true';
}

export function setMustChangePassword(value: boolean): void {
  localStorage.setItem(MUST_CHANGE_PASSWORD_KEY, String(value));
}

export function clearMustChangePassword(): void {
  localStorage.removeItem(MUST_CHANGE_PASSWORD_KEY);
}
