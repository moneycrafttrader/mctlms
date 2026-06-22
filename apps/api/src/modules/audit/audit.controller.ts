import { Controller, Get, Query } from '@nestjs/common';
import { UserRole } from '@lms/shared-types';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuditService } from './audit.service';
import { QueryAuditDto } from './dto/query-audit.dto';

@Controller()
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Roles(UserRole.ADMIN)
  @Get('admin/audit-logs')
  findAll(@Query() query: QueryAuditDto) {
    return this.auditService.findAll(query);
  }
}
