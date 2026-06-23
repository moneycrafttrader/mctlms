import { Module, forwardRef } from '@nestjs/common';
import { OutboxService } from './outbox.service';
import { InvoicesModule } from '../invoices/invoices.module';

@Module({
  imports: [forwardRef(() => InvoicesModule)],
  providers: [OutboxService],
  exports: [OutboxService],
})
export class OutboxModule {}
