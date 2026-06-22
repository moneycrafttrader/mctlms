import { Module } from '@nestjs/common';
import { BatchCurriculumController } from './batch-curriculum.controller';
import { BatchCurriculumService } from './batch-curriculum.service';

@Module({
  controllers: [BatchCurriculumController],
  providers: [BatchCurriculumService],
  exports: [BatchCurriculumService],
})
export class BatchCurriculumModule {}
