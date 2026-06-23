import { Controller, Get } from '@nestjs/common';
import { Public } from './common/decorators/public.decorator';

@Controller()
export class AppController {
  @Public()
  @Get()
  @Get('health')
  health() {
    return {
      status: 'ok',
      service: 'mct-lms-api',
      version: 'current',
      timestamp: new Date().toISOString(),
    };
  }
}
