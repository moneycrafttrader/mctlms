import { Controller, Post, Query } from '@nestjs/common';
import { UserRole } from '@lms/shared-types';
import { RecordingCurriculumReconciliationService } from './recording-curriculum-reconciliation.service';
import { Roles } from '../../../common/decorators/roles.decorator';

@Controller('admin/reconciliation')
export class ReconciliationController {
  constructor(
    private readonly reconciliationService: RecordingCurriculumReconciliationService,
  ) {}

  @Roles(UserRole.ADMIN)
  @Post('curriculum')
  async run(@Query('dryRun') dryRun?: string) {
    const isDryRun = dryRun !== 'false';
    return this.reconciliationService.run(isDryRun);
  }
}
