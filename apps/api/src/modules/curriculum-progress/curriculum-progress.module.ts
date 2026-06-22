import { Module } from '@nestjs/common';
import { CurriculumProgressController } from './curriculum-progress.controller';
import { CurriculumProgressService } from './curriculum-progress.service';

@Module({
  controllers: [CurriculumProgressController],
  providers: [CurriculumProgressService],
  exports: [CurriculumProgressService],
})
export class CurriculumProgressModule {}
