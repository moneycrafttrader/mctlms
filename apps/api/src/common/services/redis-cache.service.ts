import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '@liaoliaots/nestjs-redis';
import Redis from 'ioredis';

const DEFAULT_TTL = 300; // 5 minutes

@Injectable()
export class RedisCacheService {
  private readonly logger = new Logger(RedisCacheService.name);
  private readonly redis: Redis;

  constructor(redisService: RedisService) {
    this.redis = redisService.getOrThrow();
  }

  key(prefix: string, ...parts: string[]): string {
    return ['cache', prefix, ...parts].join(':');
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await this.redis.get(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch (err) {
      this.logger.warn(`Cache GET error for ${key}: ${(err as Error).message}`);
      return null;
    }
  }

  async set(key: string, value: unknown, ttl = DEFAULT_TTL): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      await this.redis.setex(key, ttl, serialized);
    } catch (err) {
      this.logger.warn(`Cache SET error for ${key}: ${(err as Error).message}`);
    }
  }

  async wrap<T>(key: string, ttl: number, factory: () => Promise<T>): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;

    const fresh = await factory();
    await this.set(key, fresh, ttl);
    return fresh;
  }

  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (err) {
      this.logger.warn(`Cache DEL error for ${key}: ${(err as Error).message}`);
    }
  }

  async delByPattern(pattern: string): Promise<void> {
    try {
      let cursor = '0';
      let keys: string[] = [];
      do {
        const result = await this.redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = result[0];
        keys = result[1];
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      } while (cursor !== '0');
      this.logger.log(`Invalidated ${keys.length} key(s) matching ${pattern}`);
    } catch (err) {
      this.logger.warn(`Cache SCAN/DEL error for ${pattern}: ${(err as Error).message}`);
    }
  }

  async invalidateRecordingsCache(): Promise<void> {
    await this.delByPattern('cache:recordings:*');
  }
}
