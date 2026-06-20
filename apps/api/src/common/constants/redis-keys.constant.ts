/*
 * All Redis key patterns in one place — change keys here, everything updates
 *
 * Why this file exists:
 *   - Prevents scattered string concatenation across services.
 *   - Every key follows a predictable `namespace:identifier` pattern for Redis CLI debugging.
 *
 * A junior should know:
 *   - Call a function like `REDIS_KEYS.userSession(userId)` to get the full key string.
 *   - TTL values are in seconds (Redis convention).
 */
export const REDIS_KEYS = {
  /** Stores the active session for a logged-in user → used to force-logout on multi-device */
  userSession: (userId: string) => `user_session:${userId}`,
  /** Caches live-session metadata so we don't hit Supabase on every Zoom webhook */
  session: (sessionId: string) => `session:${sessionId}`,
  /** Rate-limit key per IP address for the login endpoint */
  loginRateLimit: (ip: string) => `ratelimit:login:${ip}`,
} as const;

export const REDIS_TTL = {
  /** 24 hours in seconds — matches JWT expiry */
  SESSION: 60 * 60 * 24,
  /** 15 minutes in seconds — lockout window for login attempts */
  RATE_LIMIT: 60 * 15,
} as const;
