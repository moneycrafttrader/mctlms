/*
 * Auth service — handles login, logout, session validation, and forced logout
 *
 * Why this service exists:
 *   - All authentication business logic lives here, NOT in the controller.
 *   - Single-device enforcement (one user = one active session) is implemented here
 *     via Redis key management.
 *   - Rate limiting prevents brute-force password guessing.
 *
 * A junior should know:
 *   - Never log passwords or tokens — security risk.
 *   - The `forceLogoutUser` method is exported so UsersModule can call it when
 *     suspending an account.
 *   - Every method is async — Redis and Supabase calls are non-blocking.
 */
import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '@liaoliaots/nestjs-redis';
import Redis from 'ioredis';
import * as crypto from 'crypto';

import { LoginDto } from './dto/login.dto';
import { SupabaseService } from '../../common/services/supabase.service';
import { REDIS_KEYS, REDIS_TTL } from '../../common/constants/redis-keys.constant';
import { TABLES } from '../../common/constants/tables.constant';

/** Maximum failed login attempts before rate-lock kicks in */
const MAX_LOGIN_ATTEMPTS = 5;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    redisService: RedisService,
  ) {
    this.redis = redisService.getOrThrow();
  }

  private readonly redis: Redis;

  // ────────────────────────────────────────────────────────────────
  //  login
  // ────────────────────────────────────────────────────────────────

  /**
   * Authenticate a user with email + password.
   *
   * Steps:
   *   1. Check Redis rate-limit for this IP address
   *   2. Verify credentials against Supabase Auth
   *   3. Fetch user profile from the `users` table
   *   4. Reject if the account is suspended
   *   5. Invalidate any existing session (single-device enforcement)
   *   6. Generate a new session ID and sign a JWT
   *   7. Store the session in Redis
   *   8. Store the user → session mapping in Redis
   *   9. Clear the rate-limit counter on success
   *  10. Return token + user info
   */
  async login(dto: LoginDto, ip: string, userAgent: string) {
    // ── Step 1: Rate limit check ──────────────────────────────
    // Count failed attempts for this IP; block at 5 within 15 minutes
    const rateLimitKey = REDIS_KEYS.loginRateLimit(ip);
    const attempts = await this.redis.get(rateLimitKey);
    const attemptCount = attempts ? parseInt(attempts, 10) : 0;

    if (attemptCount >= MAX_LOGIN_ATTEMPTS) {
      this.logger.warn(`Rate-limit hit for IP ${ip}`);
      throw new ForbiddenException(
        'Too many login attempts. Please wait 15 minutes.',
      );
    }

    // ── Step 2: Verify credentials with Supabase Auth ─────────
    // Use the anon-key client — auth.signInWithPassword() requires the
    // public anon key, not the service-role key.
    const { data: authData, error: authError } =
      await this.supabaseService.authClient.auth.signInWithPassword({
        email: dto.email,
        password: dto.password,
      });

    if (authError || !authData.user) {
      // Increment the failed-attempt counter (will create key if it doesn't exist)
      await this.redis.incr(rateLimitKey);
      await this.redis.expire(rateLimitKey, REDIS_TTL.RATE_LIMIT);

      this.logger.warn(`Failed login attempt for ${dto.email} from IP ${ip}`);
      throw new UnauthorizedException('Invalid email or password');
    }

    const userId = authData.user.id;

    // ── Step 3: Fetch user profile from the database ──────────
    // Use the service-role client to bypass RLS — the profile may not
    // be visible to the user's own anon-key JWT at this point.
    const { data: profile, error: profileError } = await this.supabaseService
      .client
      .from(TABLES.PROFILES)
      .select('id, name, role, is_active')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      this.logger.error(`User ${userId} authenticated but no profile found`);
      throw new UnauthorizedException('Invalid email or password');
    }

    // ── Step 4: Check if account is active ────────────────────
    if (!profile.is_active) {
      this.logger.warn(`Suspended user ${userId} attempted login`);
      throw new ForbiddenException(
        'Your account has been suspended. Contact admin.',
      );
    }

    // ── Step 5: Single-device enforcement ─────────────────────
    // If the user already has a session somewhere, nuke it
    const existingSessionId = await this.redis.get(
      REDIS_KEYS.userSession(userId),
    );
    if (existingSessionId) {
      await this.redis.del(REDIS_KEYS.session(existingSessionId));
      this.logger.log(
        `Invalidated old session ${existingSessionId} for user ${userId}`,
      );
    }

    // ── Step 6: Generate new session and sign JWT ─────────────
    const sessionId = crypto.randomUUID();
    const token = await this.jwtService.signAsync({
      sub: userId,
      sessionId,
      role: profile.role,
    });

    // ── Step 7: Store session metadata in Redis ───────────────
    await this.redis.setex(
      REDIS_KEYS.session(sessionId),
      REDIS_TTL.SESSION,
      JSON.stringify({
        userId,
        role: profile.role,
        ip,
        userAgent,
        createdAt: Date.now(),
      }),
    );

    // ── Step 8: Store user → session mapping in Redis ─────────
    await this.redis.setex(
      REDIS_KEYS.userSession(userId),
      REDIS_TTL.SESSION,
      sessionId,
    );

    // ── Step 9: Clear rate-limit on success ───────────────────
    await this.redis.del(rateLimitKey);

    // ── Step 10: Return token + user info ─────────────────────
    return {
      token,
      user: {
        id: profile.id,
        name: profile.name,
        role: profile.role,
      },
    };
  }

  // ────────────────────────────────────────────────────────────────
  //  logout
  // ────────────────────────────────────────────────────────────────

  /**
   * End the current session by removing both Redis keys.
   *
   * Steps:
   *   1. Delete the session metadata key (`session:{sessionId}`)
   *   2. Delete the user → session mapping (`user_session:{userId}`)
   *   3. Return a success message
   */
  async logout(userId: string, sessionId: string) {
    await Promise.all([
      this.redis.del(REDIS_KEYS.session(sessionId)),
      this.redis.del(REDIS_KEYS.userSession(userId)),
    ]);

    this.logger.log(`User ${userId} logged out (session ${sessionId})`);

    return { message: 'Logged out successfully' };
  }

  // ────────────────────────────────────────────────────────────────
  //  validateSession
  // ────────────────────────────────────────────────────────────────

  /**
   * Check whether a session is still valid (used by JwtAuthGuard).
   *
   * Steps:
   *   1. Look up the active session ID for the user from Redis
   *   2. If nothing stored → session has expired or never existed → return false
   *   3. If the stored session ID doesn't match → user logged in elsewhere → return false
   *   4. If valid → refresh TTL on both keys (sliding expiry) → return true
   */
  async validateSession(
    userId: string,
    sessionId: string,
  ): Promise<boolean> {
    const storedSessionId = await this.redis.get(
      REDIS_KEYS.userSession(userId),
    );

    if (!storedSessionId || storedSessionId !== sessionId) {
      return false;
    }

    // Refresh TTL on both keys — the user made a valid request
    await Promise.all([
      this.redis.expire(REDIS_KEYS.session(sessionId), REDIS_TTL.SESSION),
      this.redis.expire(REDIS_KEYS.userSession(userId), REDIS_TTL.SESSION),
    ]);

    return true;
  }

  // ────────────────────────────────────────────────────────────────
  //  forceLogoutUser
  // ────────────────────────────────────────────────────────────────

  /**
   * Force-invalidate a user's session (admin action).
   *
   * Use case: when an admin suspends a user, call this to kick them out immediately.
   *
   * Steps:
   *   1. Look up the active session ID for the user
   *   2. Delete the session metadata key if it exists
   *   3. Delete the user → session mapping key
   */
  async forceLogoutUser(userId: string) {
    const sessionId = await this.redis.get(REDIS_KEYS.userSession(userId));

    if (sessionId) {
      await Promise.all([
        this.redis.del(REDIS_KEYS.session(sessionId)),
        this.redis.del(REDIS_KEYS.userSession(userId)),
      ]);

      this.logger.log(`User ${userId} force-logged out (admin action)`);
    }
  }
}
