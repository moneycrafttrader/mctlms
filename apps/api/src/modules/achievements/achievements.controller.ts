import {
  Controller,
  Get,
  Post,
  Param,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { UserRole } from '@lms/shared-types';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AchievementsService } from './achievements.service';

@Controller()
export class AchievementsController {
  constructor(private readonly service: AchievementsService) {}

  @Get('student/achievements')
  @Roles(UserRole.STUDENT)
  getMyAchievements(@CurrentUser() user: { id: string }) {
    return this.service.getMyAchievements(user.id);
  }

  @Get('student/certificates')
  @Roles(UserRole.STUDENT)
  getMyCertificates(@CurrentUser() user: { id: string }) {
    return this.service.getMyCertificates(user.id);
  }

  @Post('student/batches/:batchId/check-completion')
  @Roles(UserRole.STUDENT)
  checkCompletion(
    @CurrentUser() user: { id: string },
    @Param('batchId', ParseUUIDPipe) batchId: string,
  ) {
    return this.service.checkCourseCompletion(user.id, batchId);
  }

  @Get('certificates/verify')
  @Public()
  verifyCertificate(@Query('token') token: string) {
    return this.service.verifyCertificate(token);
  }

  @Get('certificates/:id/status')
  @Public()
  getCertificateStatus(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getVerificationStatus(id);
  }
}
