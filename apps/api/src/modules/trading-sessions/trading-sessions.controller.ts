import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
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

  @Roles(UserRole.ADMIN)
  @Get()
  findAll() {
    return this.tradingSessionsService.findAll();
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tradingSessionsService.remove(id);
  }
}
