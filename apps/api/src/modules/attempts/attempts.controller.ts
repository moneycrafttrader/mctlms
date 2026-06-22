import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import { UserRole } from '@lms/shared-types';
import { AttemptsService } from './attempts.service';
import { StartAttemptDto, SaveAnswerDto, SubmitAttemptDto } from './dto/start-attempt.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('attempts')
export class AttemptsController {
  constructor(private readonly attemptsService: AttemptsService) {}

  @Roles(UserRole.STUDENT)
  @Post('tests/:testId/start')
  startAttempt(
    @Param('testId') testId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: StartAttemptDto,
  ) {
    return this.attemptsService.startAttempt(testId, user.id, dto);
  }

  @Roles(UserRole.STUDENT)
  @Get('my')
  getMyAttempts(
    @CurrentUser() user: { id: string },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.attemptsService.getAttemptsByUser(user.id, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get(':id')
  getAttempt(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.attemptsService.getAttempt(id, user.id);
  }

  @Roles(UserRole.STUDENT)
  @Patch(':id/answer')
  saveAnswer(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() dto: SaveAnswerDto,
  ) {
    return this.attemptsService.saveAnswer(id, user.id, dto);
  }

  @Roles(UserRole.STUDENT)
  @Patch(':id/answers')
  saveAllAnswers(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body('answers') answers: SaveAnswerDto[],
  ) {
    return this.attemptsService.saveAllAnswers(id, user.id, answers ?? []);
  }

  @Roles(UserRole.STUDENT)
  @Post(':id/submit')
  submitAttempt(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() dto: SubmitAttemptDto,
  ) {
    return this.attemptsService.submitAttempt(id, user.id, dto);
  }

  @Get(':id/timer')
  getAttemptTimer(@Param('id') id: string) {
    return this.attemptsService.getAttemptTimer(id);
  }
}
