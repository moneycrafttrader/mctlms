import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  ParseUUIDPipe,
} from '@nestjs/common';
import { UserRole } from '@lms/shared-types';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurriculumProgressService } from './curriculum-progress.service';

@Controller()
export class CurriculumProgressController {
  constructor(private readonly service: CurriculumProgressService) {}

  @Get('admin/batches/:batchId/progress')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  getAdminProgress(@Param('batchId', ParseUUIDPipe) batchId: string) {
    return { batchId };
  }

  @Get('batches/:batchId/progress')
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT)
  getMyProgress(
    @Param('batchId', ParseUUIDPipe) batchId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.service.getProgress(batchId, user.id);
  }

  @Post('admin/curriculum-rules')
  @Roles(UserRole.ADMIN)
  setRule(
    @Body() body: { batchId: string; categoryName: string; ruleType: string; threshold?: number },
  ) {
    return this.service.setRule(body.batchId, body.categoryName, body.ruleType, body.threshold);
  }

  @Post('admin/curriculum-prerequisites')
  @Roles(UserRole.ADMIN)
  addPrerequisite(
    @Body() body: { curriculumId: string; prerequisiteId: string; batchId: string },
  ) {
    return this.service.addPrerequisite(body.curriculumId, body.prerequisiteId, body.batchId);
  }

  @Delete('admin/curriculum-prerequisites/:id')
  @Roles(UserRole.ADMIN)
  removePrerequisite(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.removePrerequisite(id);
  }

  @Post('curriculum-progress')
  @Roles(UserRole.STUDENT)
  markProgress(
    @CurrentUser() user: { id: string },
    @Body() body: { curriculumId: string; completed: boolean },
  ) {
    return this.service.markItemProgress(user.id, body.curriculumId, body.completed);
  }
}
