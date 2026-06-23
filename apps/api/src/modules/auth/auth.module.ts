import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { DeviceModule } from '../devices/device.module';
import { EmailModule } from '../email/email.module';
import { PlaybackModule } from '../playback/playback.module';
import { ObservabilityModule } from '../observability/observability.module';

@Module({
  imports: [DeviceModule, EmailModule, PlaybackModule, ObservabilityModule],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
