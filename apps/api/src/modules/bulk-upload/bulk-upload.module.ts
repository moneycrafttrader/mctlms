import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { BulkUploadController } from './bulk-upload.controller';
import { BulkUploadService } from './bulk-upload.service';
import { EmailModule } from '../email/email.module';
import { BatchesModule } from '../batches/batches.module';

@Module({
  imports: [
    MulterModule.register({ limits: { fileSize: 10 * 1024 * 1024 } }),
    EmailModule,
    BatchesModule,
  ],
  controllers: [BulkUploadController],
  providers: [BulkUploadService],
  exports: [BulkUploadService],
})
export class BulkUploadModule {}
