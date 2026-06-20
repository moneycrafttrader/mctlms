/*
 * Videos controller — endpoints for the video library
 *
 * Why this controller exists:
 *   - Three tiers of access: admin (create/manage), teacher (view), student (watch).
 *   - POST /videos returns an uploadUrl — the frontend uploads directly to Mux.
 *   - GET /videos/:id/play is the security checkpoint — returns a signed time-limited URL.
 *   - POST /videos/:id/progress is called by the video player every 30 seconds.
 *
 * A junior should know:
 *   - Admin routes create topics and videos, manage batch access.
 *   - Student routes only show videos their batch can access.
 *   - GET /videos/:id/play verifies access before returning a signed URL.
 */
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { UserRole } from '@lms/shared-types';
import { VideosService } from './videos.service';
import { CreateTopicDto } from './dto/create-topic.dto';
import { CreateVideoDto } from './dto/create-video.dto';
import { RequestUploadDto } from './dto/request-upload.dto';
import { UpdateVideoDto } from './dto/update-video.dto';
import { UpdateVideoProgressDto } from './dto/update-video-progress.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('videos')
export class VideosController {
  constructor(private readonly videosService: VideosService) {}

  // ── Admin: Topics ────────────────────────────────────────────

  /**
   * POST /videos/topics
   *
   * Create a new topic (video category).
   * Only admins can create topics.
   */
  @Roles(UserRole.ADMIN)
  @Post('topics')
  createTopic(@Body() dto: CreateTopicDto) {
    return this.videosService.createTopic(dto);
  }

  /**
   * GET /videos/topics
   *
   * List all topics with video counts.
   * Admins can see this.
   */
  @Roles(UserRole.ADMIN)
  @Get('topics')
  getTopics() {
    return this.videosService.getTopics();
  }

  /**
   * GET /videos/topics/:id
   *
   * Get a topic with its videos list.
   * Admins and teachers can view.
   */
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Get('topics/:id')
  getTopicById(@Param('id') id: string) {
    return this.videosService.getTopicById(id);
  }

  // ── Admin: Videos ────────────────────────────────────────────

  /**
   * POST /videos
   *
   * Create a new video record and get a direct upload URL.
   * The frontend uses the uploadUrl to send the video file directly to Mux.
   * Only admins can create videos.
   */
  @Roles(UserRole.ADMIN)
  @Post()
  createVideo(@Body() dto: CreateVideoDto) {
    return this.videosService.createVideo(dto);
  }

  /**
   * POST /videos/:id/batches
   *
   * Assign a video to specific batches (cross-batch access control).
   * Only admins can manage batch access.
   */
  @Roles(UserRole.ADMIN)
  @Post(':id/batches')
  assignToBatches(
    @Param('id') id: string,
    @Body('batchIds') batchIds: string[],
  ) {
    return this.videosService.assignToBatches(id, batchIds);
  }

  /**
   * DELETE /videos/:id/batches
   *
   * Remove a video's access from specific batches.
   * Only admins can manage batch access.
   */
  @Roles(UserRole.ADMIN)
  @Delete(':id/batches')
  removeBatchAccess(
    @Param('id') id: string,
    @Body('batchIds') batchIds: string[],
  ) {
    return this.videosService.removeBatchAccess(id, batchIds);
  }

  // ── Admin: Direct Upload ────────────────────────────────────

  /**
   * POST /videos/upload-url
   *
   * Get a Mux direct upload URL so the frontend can PUT a video file
   * directly to Mux (the video never touches our server).
   * Creates a pending video record in the DB.
   */
  @Roles(UserRole.ADMIN)
  @Post('upload-url')
  requestUploadUrl(@Body() dto: RequestUploadDto) {
    return this.videosService.requestUploadUrl(dto);
  }

  // ── Admin: Update / Delete ───────────────────────────────────

  /**
   * PATCH /videos/:id
   *
   * Update video metadata (title, description, topic).
   * Only admins can update.
   */
  @Roles(UserRole.ADMIN)
  @Patch(':id')
  updateVideo(@Param('id') id: string, @Body() dto: UpdateVideoDto) {
    return this.videosService.updateVideo(id, dto);
  }

  /**
   * DELETE /videos/:id
   *
   * Delete a video and all associated records.
   * Only admins can delete.
   */
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  deleteVideo(@Param('id') id: string) {
    return this.videosService.deleteVideo(id);
  }

  /**
   * GET /videos/admin
   *
   * Admin view — all videos with batch assignment info and status.
   * Only admins can see this full view.
   */
  @Roles(UserRole.ADMIN)
  @Get('admin')
  getAdminVideos(
    @Query('topicId') topicId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.videosService.getAdminVideos(
      topicId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  // ── Student: Batch Videos ────────────────────────────────────

  /**
   * GET /videos/batch/:batchId
   *
   * Fetch all ready videos assigned to a specific batch.
   * Used by the student course classroom page.
   */
  @Get('batch/:batchId')
  getBatchVideos(@Param('batchId') batchId: string) {
    return this.videosService.getBatchVideos(batchId);
  }

  // ── Student: Videos ──────────────────────────────────────────

  /**
   * GET /videos/my
   *
   * Get all videos the logged-in student can watch, grouped by topic.
   * Students only see videos their batch has access to.
   */
  @Get('my')
  getMyVideos(
    @CurrentUser() user: { id: string },
    @Query('topicId') topicId?: string,
  ) {
    return this.videosService.getVideosForStudent(user.id, topicId);
  }

  /**
   * GET /videos/:id/play
   *
   * Get a signed playback URL for a video.
   * This is the security checkpoint — verifies batch access before returning a
   * time-limited URL (expires in 4 hours).
   */
  @Get(':id/play')
  getPlaybackUrl(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.videosService.getPlaybackUrl(id, user.id);
  }

  /**
   * POST /videos/:id/progress
   *
   * Update watch progress for the current video.
   * Called by the video player every ~30 seconds to save position for resume.
   */
  @Post(':id/progress')
  updateProgress(
    @Param('id') id: string,
    @Body() dto: UpdateVideoProgressDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.videosService.updateProgress(user.id, id, dto);
  }
}
