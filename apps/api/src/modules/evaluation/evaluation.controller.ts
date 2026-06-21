import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import { UserRole } from '@lms/shared-types';
import { EvaluationService, AutoGradeSummary } from './evaluation.service';
import { SubmitReviewDto } from './dto/evaluate.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('evaluation')
export class EvaluationController {
  constructor(private readonly evaluationService: EvaluationService) {}

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Post(':attemptId/auto-grade')
  autoGradeAttempt(@Param('attemptId') attemptId: string): Promise<{ summary: AutoGradeSummary; attempt: any }> {
    return this.evaluationService.autoGradeAttempt(attemptId);
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Get('review-queue')
  getReviewQueue(
    @Query('status') status?: string,
    @Query('assignedTo') assignedTo?: string,
    @Query('testId') testId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.evaluationService.getReviewQueue({
      status,
      assignedTo,
      testId,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Patch('review-queue/:id/assign')
  assignForReview(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.evaluationService.assignForReview(id, user.id);
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Patch('review-queue/:id/review')
  submitReview(
    @Param('id') id: string,
    @Body() dto: SubmitReviewDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.evaluationService.submitReview(id, dto, user.id);
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Post(':attemptId/publish')
  publishResults(@Param('attemptId') attemptId: string) {
    return this.evaluationService.publishResults(attemptId);
  }

  @Roles(UserRole.ADMIN)
  @Post('tests/:testId/analytics')
  calculateAnalytics(@Param('testId') testId: string) {
    return this.evaluationService.calculateAnalytics(testId);
  }
}
