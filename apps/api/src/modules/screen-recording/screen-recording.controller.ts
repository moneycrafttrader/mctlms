import { Controller, Post, Get, Body, Param, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { UserRole } from '@lms/shared-types';
import { ScreenRecordingService } from './screen-recording.service';
import { ReportViolationDto } from './dto/report-violation.dto';
import { RiskScoreData } from './screen-recording.types';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('screen-recording')
export class ScreenRecordingController {
  constructor(private readonly screenRecordingService: ScreenRecordingService) {}

  @Post('violation')
  async reportViolation(
    @Body() dto: ReportViolationDto,
    @CurrentUser() user: { id: string },
    @Req() req: Request,
  ) {
    const ip = (req.ip || req.headers['x-forwarded-for'] || 'unknown') as string;
    const userAgent = req.headers['user-agent'] || 'unknown';

    await this.screenRecordingService.reportViolation({
      userId: user.id,
      contextType: dto.contextType,
      contextId: dto.contextId,
      detectionType: dto.detectionType,
      details: dto.details,
      ip,
      userAgent: Array.isArray(userAgent) ? userAgent[0] : userAgent,
    });

    return { recorded: true };
  }

  @Roles(UserRole.ADMIN)
  @Get('violations')
  async getViolations(
    @Query('userId') userId?: string,
    @Query('contextType') contextType?: string,
    @Query('limit') limit?: string,
  ) {
    return this.screenRecordingService.getViolations(userId, contextType, limit ? parseInt(limit, 10) : 200);
  }

  @Roles(UserRole.ADMIN)
  @Get('counters')
  async getCounters(@Query('userId') userId?: string) {
    return this.screenRecordingService.getViolationCounters(userId);
  }

  @Roles(UserRole.ADMIN)
  @Get('risk-scores')
  async getRiskScores(@Query('limit') limit?: string) {
    return this.screenRecordingService.getAllRiskScores(limit ? parseInt(limit, 10) : 200);
  }

  @Roles(UserRole.ADMIN)
  @Get('risk-score/:userId')
  async getRiskScore(@Param('userId') userId: string): Promise<RiskScoreData | null> {
    return this.screenRecordingService.getRiskScore(userId);
  }
}
