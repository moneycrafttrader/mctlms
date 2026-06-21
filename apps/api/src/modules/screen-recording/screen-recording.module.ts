import { Module } from '@nestjs/common';
import { ScreenRecordingService } from './screen-recording.service';
import { ScreenRecordingController } from './screen-recording.controller';

@Module({
  controllers: [ScreenRecordingController],
  providers: [ScreenRecordingService],
  exports: [ScreenRecordingService],
})
export class ScreenRecordingModule {}
