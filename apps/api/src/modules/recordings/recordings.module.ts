import { Module } from '@nestjs/common';
import { RecordingsController } from './recordings.controller';
import { RecordingsService } from './recordings.service';
import { MuxModule } from '../mux/mux.module';
import { PlaybackModule } from '../playback/playback.module';

@Module({
  imports: [MuxModule, PlaybackModule],
  controllers: [RecordingsController],
  providers: [RecordingsService],
  exports: [RecordingsService],
})
export class RecordingsModule {}
