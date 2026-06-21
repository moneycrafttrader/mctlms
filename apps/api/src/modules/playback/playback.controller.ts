import { Controller, Post, Get, Param, Body, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { UserRole } from '@lms/shared-types';
import { PlaybackGuardService } from './playback-guard.service';
import { ReportEventDto } from './dto/report-event.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('playback')
export class PlaybackController {
  constructor(private readonly playbackGuard: PlaybackGuardService) {}

  @Post('event')
  async reportEvent(
    @Body() dto: ReportEventDto,
    @CurrentUser() user: { id: string },
    @Req() req: Request,
  ) {
    const ip = (req.ip || req.headers['x-forwarded-for'] || 'unknown') as string;
    await this.playbackGuard.reportEvent(
      user.id,
      dto.recordingId,
      dto.eventType,
      dto.positionSeconds,
      dto.playbackSessionId,
      ip,
    );
    return { recorded: true };
  }

  @Roles(UserRole.ADMIN)
  @Get('violations')
  async getViolations(@Query('userId') userId?: string) {
    return this.playbackGuard.getViolations(userId);
  }

  @Roles(UserRole.ADMIN)
  @Get('events')
  async getEvents(
    @Query('recordingId') recordingId?: string,
    @Query('userId') userId?: string,
  ) {
    return this.playbackGuard.getEvents(recordingId, userId);
  }
}
