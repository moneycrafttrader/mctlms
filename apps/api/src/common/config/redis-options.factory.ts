import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/** ioredis options passed to @liaoliaots/nestjs-redis */
export type NestRedisClientOptions = {
  host: string;
  port: number;
  password?: string;
  tls?: Record<string, never>;
};

/**
 * Prefer REDIS_URL (Upstash / managed providers) when set; otherwise REDIS_HOST + PORT + PASSWORD.
 * TLS is enabled for rediss:// URLs or when a password is set (existing Upstash convention).
 */
export function resolveRedisClientOptions(
  config: ConfigService,
): NestRedisClientOptions {
  const logger = new Logger('RedisConfig');
  const rawUrl = config.get<string>('REDIS_URL')?.trim();

  if (rawUrl) {
    const parsed = new URL(rawUrl);
    const host = parsed.hostname;
    const port = parsed.port
      ? parseInt(parsed.port, 10)
      : parsed.protocol === 'rediss:'
        ? 6379
        : 6379;
    const password =
      decodeURIComponent(parsed.password || '') ||
      config.get<string>('REDIS_PASSWORD') ||
      undefined;
    const useTls = parsed.protocol === 'rediss:';

    logger.log(`Redis: using REDIS_URL → ${host}:${port} (tls=${useTls})`);

    return {
      host,
      port,
      password: password || undefined,
      tls: useTls ? {} : undefined,
    };
  }

  const host = config.get<string>('REDIS_HOST') ?? '127.0.0.1';
  const port = config.get<number>('REDIS_PORT') ?? 6379;
  const password = config.get<string>('REDIS_PASSWORD');
  const useTls = !!password;

  logger.log(`Redis: using REDIS_HOST → ${host}:${port} (tls=${useTls})`);

  return {
    host,
    port,
    password: password || undefined,
    tls: useTls ? {} : undefined,
  };
}