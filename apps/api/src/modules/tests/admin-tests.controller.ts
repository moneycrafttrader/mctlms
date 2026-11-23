import { Controller, Get, Query } from '@nestjs/common';
import { UserRole } from '@lms/shared-types';
import { TestsService } from './tests.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { BatchAccessCaller } from '../../common/services/batch-access.service';

@Controller()
export class AdminTestsController {
  constructor(private readonly testsService: TestsService) {}

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Get('admin/tests')
  legacyFindAll(
    @Query('status') status?: string,
    @Query('batchId') batchId?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @CurrentUser() user?: BatchAccessCaller,
  ) {
    return this.testsService.findAll(
      {
        status,
        batchId,
        search,
        page: page ? parseInt(page, 10) : undefined,
        limit: limit ? parseInt(limit, 10) : undefined,
      },
      user,
    );
  }
}
