import { Module } from '@nestjs/common';
import { TradingSessionsController } from './trading-sessions.controller';
import { TradingSessionsService } from './trading-sessions.service';
import { ZoomModule } from '../zoom/zoom.module';

@Module({
  imports: [ZoomModule],
  controllers: [TradingSessionsController],
  providers: [TradingSessionsService],
})
export class TradingSessionsModule {}
