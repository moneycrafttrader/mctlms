import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { UploadsController } from './uploads.controller';
import { SupabaseService } from '../../common/services/supabase.service';

@Module({
  imports: [
    MulterModule.register({ limits: { fileSize: 10 * 1024 * 1024 } }),
  ],
  controllers: [UploadsController],
  providers: [SupabaseService],
})
export class UploadsModule {}
