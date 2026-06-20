import { Controller, Post, Body } from '@nestjs/common';
import { UserRole } from '@lms/shared-types';
import { TradingSessionsService } from './trading-sessions.service';
import { CreateTradingSessionDto } from './dto/create-trading-session.dto';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('admin/sessions')
export class TradingSessionsController {
  constructor(private readonly tradingSessionsService: TradingSessionsService) {}

  @Roles(UserRole.ADMIN)
  @Post()
  create(@Body() dto: CreateTradingSessionDto) {
    return this.tradingSessionsService.create(dto);
  }
}
