/*
 * Batches module — manages cohorts of students
 *
 * Why this module exists:
 *   - Groups all batch-related code (CRUD, membership, sessions) in one place.
 *   - Exports BatchesService so LiveSessionsModule can use it to look up batch sessions.
 *
 * A junior should know:
 *   - A batch is a cohort — students can be in multiple batches simultaneously.
 *   - Adding a new service? Put it in `providers` and `exports` if others need it.
 */
import { Module } from '@nestjs/common';
import { BatchesController } from './batches.controller';
import { BatchesService } from './batches.service';
import { EmailModule } from '../email/email.module';
import { ObservabilityModule } from '../observability/observability.module';

@Module({
  imports: [EmailModule, ObservabilityModule],
  controllers: [BatchesController],
  providers: [BatchesService],
  exports: [BatchesService],
})
export class BatchesModule {}
