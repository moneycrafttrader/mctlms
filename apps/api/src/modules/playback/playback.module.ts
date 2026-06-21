import { Module } from '@nestjs/common';
import { PlaybackGuardService } from './playback-guard.service';
import { PlaybackController } from './playback.controller';
import { MuxModule } from '../mux/mux.module';

@Module({
  imports: [MuxModule],
  controllers: [PlaybackController],
  providers: [PlaybackGuardService],
  exports: [PlaybackGuardService],
})
export class PlaybackModule {}
