import { Controller, Get, Post, Param, Query } from '@nestjs/common';
import { UserRole } from '@lms/shared-types';
import { EmailLogsService } from './email-logs.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { QueryEmailLogsDto } from './dto/query-email-logs.dto';

@Controller('email-logs')
export class EmailLogsController {
  constructor(private readonly service: EmailLogsService) {}

  @Roles(UserRole.ADMIN)
  @Get()
  listEmails(@Query() query: QueryEmailLogsDto) {
    return this.service.listEmails({
      page: query.page ? parseInt(query.page, 10) : undefined,
      limit: query.limit ? parseInt(query.limit, 10) : undefined,
      status: query.status,
      templateName: query.templateName,
      recipientSearch: query.recipientSearch,
      startDate: query.startDate,
      endDate: query.endDate,
    });
  }

  @Roles(UserRole.ADMIN)
  @Get('stats')
  getStats() {
    return this.service.getEmailStats();
  }

  @Roles(UserRole.ADMIN)
  @Get('analytics')
  getAnalytics() {
    return this.service.getAnalytics();
  }

  @Roles(UserRole.ADMIN)
  @Get('queue')
  getQueueStats() {
    return this.service.getQueueStats();
  }

  @Roles(UserRole.ADMIN)
  @Post(':id/retry')
  retryEmail(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: string },
  ) {
    return this.service.retryEmail(id, user);
  }
}
