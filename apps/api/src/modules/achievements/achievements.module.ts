import { Module } from '@nestjs/common';
import { AchievementsController } from './achievements.controller';
import { AchievementsService } from './achievements.service';
import { EmailModule } from '../email/email.module';
import { PdfGenerationModule } from '../pdf/pdf-generation.module';
import { ObservabilityModule } from '../observability/observability.module';

@Module({
  imports: [EmailModule, PdfGenerationModule, ObservabilityModule],
  controllers: [AchievementsController],
  providers: [AchievementsService],
})
export class AchievementsModule {}
