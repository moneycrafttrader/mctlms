import { Module } from '@nestjs/common';
import { EmailLogsController } from './email-logs.controller';
import { EmailLogsService } from './email-logs.service';
import { AuditModule } from '../audit/audit.module';
import { ObservabilityModule } from '../observability/observability.module';

@Module({
  imports: [AuditModule, ObservabilityModule],
  controllers: [EmailLogsController],
  providers: [EmailLogsService],
  exports: [EmailLogsService],
})
export class EmailLogsModule {}
