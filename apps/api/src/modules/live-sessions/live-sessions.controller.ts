/*
 * Live Sessions controller — endpoints for managing live Zoom webinars
 *
 * Why this controller exists:
 *   - Thin HTTP layer — validates input, delegates to service, returns results.
 *   - Students have their own endpoints (/my, /:id/join) that use @CurrentUser()
 *     so they don't need to know their own ID.
 *   - The /join endpoint returns a unique Zoom URL tied to the student's email
 *     for attendance tracking.
 *
 * A junior should know:
 *   - POST /live-sessions is the big one — it creates a Zoom webinar AND registers
 *     all students automatically.
 *   - GET /live-sessions/my is what the student dashboard calls to see their sessions.
 *   - GET /live-sessions/:id/join returns the student's personal Zoom join URL.
 */
import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { SessionStatus, UserRole } from '@lms/shared-types';
import { LiveSessionsService } from './live-sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('live-sessions')
export class LiveSessionsController {
  constructor(private readonly liveSessionsService: LiveSessionsService) {}

  /**
   * POST /live-sessions
   *
   * Create a new live session — creates a Zoom webinar and registers all students
   * from the assigned batches.
   * Only admins can create sessions.
   */
  @Roles(UserRole.ADMIN)
  @Post()
  create(@Body() dto: CreateSessionDto) {
    return this.liveSessionsService.create(dto);
  }

  /**
   * GET /live-sessions
   *
   * List all sessions with optional filters (batchId, status) and pagination.
   * Admins and teachers can view the full list.
   */
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('batchId') batchId?: string,
    @Query('status') status?: string,
  ) {
    return this.liveSessionsService.findAll(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      batchId,
      status,
    );
  }

  /**
   * GET /live-sessions/my
   *
   * Get all sessions for the currently logged-in student, split into upcoming and past.
   * This is what the student dashboard calls.
   */
  @Get('my')
  getMySessions(@CurrentUser() user: { id: string }) {
    return this.liveSessionsService.getForStudent(user.id);
  }

  /**
   * GET /live-sessions/:id
   *
   * Get details of a single session, including batch IDs and host teacher info.
   */
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT)
  @Get(':id')
  findById(@Param('id') id: string) {
    return this.liveSessionsService.findById(id);
  }

  /**
   * GET /live-sessions/:id/join
   *
   * Get the currently logged-in student's personal Zoom join URL for a session.
   * Each student has a unique URL tied to their email — this enables attendance tracking.
   */
  @Get(':id/join')
  getJoinUrl(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.liveSessionsService.getStudentJoinUrl(id, user.id);
  }

  /**
   * PATCH /live-sessions/:id/status
   *
   * Manually update the status of a session (scheduled, live, ended, cancelled).
   * Only admins can change session status.
   */
  @Roles(UserRole.ADMIN)
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: SessionStatus,
  ) {
    return this.liveSessionsService.updateStatus(id, status);
  }
}
