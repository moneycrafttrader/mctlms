import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    MulterModule.register({ limits: { fileSize: 10 * 1024 * 1024 } }),
    EmailModule,
  ],
  controllers: [InvoicesController],
  providers: [InvoicesService],
  exports: [InvoicesService],
})
export class InvoicesModule {}
