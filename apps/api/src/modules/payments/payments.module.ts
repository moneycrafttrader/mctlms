import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { OutboxModule } from '../outbox/outbox.module';
import { ObservabilityModule } from '../observability/observability.module';

@Module({
  imports: [OutboxModule, ObservabilityModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
