import { Module } from '@nestjs/common';
import { RecordingCurriculumReconciliationService } from './recording-curriculum-reconciliation.service';
import { ReconciliationController } from './reconciliation.controller';
import { RecordingsModule } from '../recordings.module';
import { BatchCurriculumModule } from '../../batch-curriculum/batch-curriculum.module';

@Module({
  imports: [RecordingsModule, BatchCurriculumModule],
  controllers: [ReconciliationController],
  providers: [RecordingCurriculumReconciliationService],
  exports: [RecordingCurriculumReconciliationService],
})
export class RecordingCurriculumReconciliationModule {}
