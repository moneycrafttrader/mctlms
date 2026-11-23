import { Controller, Get } from '@nestjs/common';
import { RedisService } from '@liaoliaots/nestjs-redis';
import { Public } from './common/decorators/public.decorator';

@Controller()
export class AppController {
  constructor(private readonly redisService: RedisService) {}

  @Public()
  @Get()
  @Get('health')
  async health() {
    const payload: Record<string, unknown> = {
      status: 'ok',
      service: 'mct-lms-api',
      version: 'current',
      timestamp: new Date().toISOString(),
    };

    try {
      const redis = this.redisService.getOrThrow();
      const pong = await redis.ping();
      payload.redis = pong === 'PONG' ? 'connected' : 'unexpected';
    } catch (err) {
      payload.redis = 'disconnected';
      payload.redisError = (err as Error).message;
    }

    return payload;
  }
}