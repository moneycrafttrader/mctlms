import { Module, forwardRef } from '@nestjs/common';
import { EmailController } from './email.controller';
import { EmailService } from './email.service';
import { EmailWebhookService } from './email-webhook.service';
import { EmailTemplatesService } from './email-templates.service';
import { EmailLogsModule } from '../email-logs/email-logs.module';
import { AuditModule } from '../audit/audit.module';
import { ObservabilityModule } from '../observability/observability.module';

@Module({
  imports: [forwardRef(() => EmailLogsModule), AuditModule, ObservabilityModule],
  controllers: [EmailController],
  providers: [EmailService, EmailWebhookService, EmailTemplatesService],
  exports: [EmailService],
})
export class EmailModule {}
