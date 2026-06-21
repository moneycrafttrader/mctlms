/*
 * Videos service — manages the video library, topics, access control, and progress
 *
 * Why this service exists:
 *   - Handles the video library — topics, videos, batch access control, and watch progress.
 *   - Two types of videos live here: manually uploaded content AND recordings from
 *     live sessions (Zoom recordings pushed through the cron job).
 *   - Security critical: getPlaybackUrl() is the ONLY entry point for video playback.
 *     It verifies batch access before returning a time-limited signed URL.
 *
 * A junior should know:
 *   - Topics = categories. Videos = individual files within a topic.
 *   - Students only see videos their batch has access to — filtered at DB level.
 *   - Every video play goes through getPlaybackUrl() — this is the security checkpoint.
 *   - The video player calls updateProgress() every 30 seconds for resume.
 */
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { RedisService } from '@liaoliaots/nestjs-redis';
import Redis from 'ioredis';
import { SupabaseService } from '../../common/services/supabase.service';
import { MuxService } from '../mux/mux.service';
import { PlaybackGuardService } from '../playback/playback-guard.service';
import { TABLES } from '../../common/constants/tables.constant';
import { REDIS_KEYS, REDIS_TTL } from '../../common/constants/redis-keys.constant';
import { CreateTopicDto } from './dto/create-topic.dto';
import { CreateVideoDto } from './dto/create-video.dto';
import { RequestUploadDto } from './dto/request-upload.dto';
import { UpdateVideoDto } from './dto/update-video.dto';
import { UpdateVideoProgressDto } from './dto/update-video-progress.dto';

@Injectable()
export class VideosService {
  private readonly logger = new Logger(VideosService.name);
  private readonly redis: Redis;

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly muxService: MuxService,
    private readonly playbackGuard: PlaybackGuardService,
    redisService: RedisService,
  ) {
    this.redis = redisService.getOrThrow();
  }

  // ──────────────────────────────────────────────────────────────
  //  createTopic
  // ──────────────────────────────────────────────────────────────

  /**
   * Create a new topic (video category).
   */
  async createTopic(dto: CreateTopicDto) {
    const { data, error } = await this.supabaseService.client
      .from(TABLES.TOPICS)
      .insert({
        name: dto.name,
        description: dto.description ?? null,
        sort_order: dto.sortOrder ?? 0,
      })
      .select()
      .single();

    if (error) {
      this.logger.error(`Failed to create topic: ${error.message}`);
      throw new BadRequestException('Failed to create topic');
    }

    return data;
  }

  // ──────────────────────────────────────────────────────────────
  //  getTopics
  // ──────────────────────────────────────────────────────────────

  /**
   * Fetch all topics ordered by sort_order, with video count per topic.
   */
  async getTopics() {
    const { data, error } = await this.supabaseService.client
      .from(TABLES.TOPICS)
      .select('*, videos(count)')
      .order('sort_order', { ascending: true });

    if (error) {
      this.logger.error(`Failed to fetch topics: ${error.message}`);
      throw new BadRequestException('Could not retrieve topics');
    }

    return data ?? [];
  }

  // ──────────────────────────────────────────────────────────────
  //  getTopicById
  // ──────────────────────────────────────────────────────────────

  /**
   * Get a topic by ID, including its videos list.
   */
  async getTopicById(id: string) {
    const { data: topic, error: topicError } = await this.supabaseService.client
      .from(TABLES.TOPICS)
      .select('*')
      .eq('id', id)
      .single();

    if (topicError || !topic) {
      throw new NotFoundException('Topic not found');
    }

    const { data: videos } = await this.supabaseService.client
      .from(TABLES.VIDEOS)
      .select('*')
      .eq('topic_id', id)
      .order('sort_order', { ascending: true });

    return { ...topic, videos: videos ?? [] };
  }

  // ──────────────────────────────────────────────────────────────
  //  createVideo
  // ──────────────────────────────────────────────────────────────

  /**
   * Create a new video record and get a direct upload URL from Mux.
   *
   * Two-step process: we create the record first, then the frontend uploads to
   * Mux directly using the returned URL. This way the video never touches our server.
   *
   * Steps:
   *   1. Call MuxService to create a direct upload URL
   *   2. Insert the video record into TABLES.VIDEOS with status 'uploading'
   *   3. If batchIds provided, insert into TABLES.VIDEO_BATCHES
   *   4. Return video metadata + upload URL for the frontend
   */
  async createVideo(dto: CreateVideoDto) {
    // Get direct upload URL from Mux
    const { uploadUrl, uploadId } = await this.muxService.createUploadUrl(
      dto.title,
      dto.topicId ?? '',
    );

    // Insert video record
    const { data: video, error: videoError } = await this.supabaseService.client
      .from(TABLES.VIDEOS)
      .insert({
        title: dto.title,
        description: dto.description ?? null,
        topic_id: dto.topicId ?? null,
        mux_upload_id: uploadId,
        sort_order: dto.sortOrder ?? 0,
        status: 'processing',
      })
      .select()
      .single();

    if (videoError) {
      this.logger.error(`Failed to create video: ${videoError.message}`);
      throw new BadRequestException('Failed to create video');
    }

    // Assign to batches if provided
    if (dto.batchIds && dto.batchIds.length > 0) {
      const batchRecords = dto.batchIds.map((batchId) => ({
        video_id: video.id,
        batch_id: batchId,
      }));

      await this.supabaseService.client
        .from(TABLES.VIDEO_BATCHES)
        .upsert(batchRecords, { onConflict: 'video_id,batch_id' });
    }

    return { video, uploadUrl };
  }

  // ──────────────────────────────────────────────────────────────
  //  assignToBatches
  // ──────────────────────────────────────────────────────────────

  /**
   * Assign a video to one or more batches (cross-batch assignment).
   *
   * Same video can be in multiple batches — one upload, many view permissions.
   */
  async assignToBatches(videoId: string, batchIds: string[]) {
    const records = batchIds.map((batchId) => ({
      video_id: videoId,
      batch_id: batchId,
    }));

    const { error } = await this.supabaseService.client
      .from(TABLES.VIDEO_BATCHES)
      .upsert(records, { onConflict: 'video_id,batch_id' });

    if (error) {
      this.logger.error(`Failed to assign video to batches: ${error.message}`);
      throw new BadRequestException('Failed to assign video to batches');
    }

    return { assignedCount: batchIds.length };
  }

  // ──────────────────────────────────────────────────────────────
  //  removeBatchAccess
  // ──────────────────────────────────────────────────────────────

  /**
   * Remove a video's access from specific batches.
   */
  async removeBatchAccess(videoId: string, batchIds: string[]) {
    const { error } = await this.supabaseService.client
      .from(TABLES.VIDEO_BATCHES)
      .delete()
      .eq('video_id', videoId)
      .in('batch_id', batchIds);

    if (error) {
      this.logger.error(`Failed to remove batch access: ${error.message}`);
      throw new BadRequestException('Failed to remove batch access');
    }

    return { removedCount: batchIds.length };
  }

  // ──────────────────────────────────────────────────────────────
  //  getVideosForStudent
  // ──────────────────────────────────────────────────────────────

  /**
   * Get all videos a student can watch, grouped by topic.
   *
   * Students only see videos their batch has access to. We filter at the DB level,
   * not in application code.
   *
   * Steps:
   *   1. Find the student's batches
   *   2. Find videos those batches can access via VIDEO_BATCH_ACCESS
   *   3. Optionally filter by topicId
   *   4. Include watch progress (left-joined from VIDEO_PROGRESS)
   *   5. NEVER return mux_asset_id or raw playback URL — metadata only
   */
  async getVideosForStudent(userId: string, topicId?: string) {
    // Get student's batches
    const { data: batchMemberships } = await this.supabaseService.client
      .from(TABLES.BATCH_STUDENTS)
      .select('batch_id')
      .eq('user_id', userId);

    const batchIds = (batchMemberships ?? []).map((b: any) => b.batch_id);

    if (batchIds.length === 0) {
      return [];
    }

    // Find video IDs accessible by these batches
    const { data: accessRecords } = await this.supabaseService.client
      .from(TABLES.VIDEO_BATCHES)
      .select('video_id')
      .in('batch_id', batchIds);

    const videoIds = [
      ...new Set((accessRecords ?? []).map((r: any) => r.video_id)),
    ];

    if (videoIds.length === 0) {
      return [];
    }

    // Fetch videos with optional topic filter
    let videosQuery = this.supabaseService.client
      .from(TABLES.VIDEOS)
      .select('id, title, description, topic_id, sort_order, status, created_at, topics(name)')
      .in('id', videoIds)
      .eq('status', 'ready')
      .order('sort_order', { ascending: true });

    if (topicId) {
      videosQuery = videosQuery.eq('topic_id', topicId);
    }

    const { data: videos } = await videosQuery;

    if (!videos || videos.length === 0) {
      return [];
    }

    // Include watch progress
    const videoIdList = videos.map((v: any) => v.id);
    const { data: progress } = await this.supabaseService.client
      .from(TABLES.VIDEO_PROGRESS)
      .select('video_id, watched_seconds, completed, last_watched_at')
      .in('video_id', videoIdList)
      .eq('user_id', userId);

    const progressMap = new Map(
      (progress ?? []).map((p: any) => [p.video_id, p]),
    );

    return videos.map((video: any) => ({
      ...video,
      progress: progressMap.get(video.id) ?? {
        watched_seconds: 0,
        completed: false,
        last_watched_at: null,
      },
    }));
  }

  // ──────────────────────────────────────────────────────────────
  //  getPlaybackUrl
  // ──────────────────────────────────────────────────────────────

  /**
   * Get a signed playback URL for a video — the security checkpoint.
   *
   * Every video play goes through here. Signed URLs expire in 4 hours.
   *
   * Steps:
   *   1. Fetch video from DB, verify status is 'ready'
   *   2. Verify user has batch access (check VIDEO_BATCH_ACCESS → BATCH_STUDENTS)
   *   3. If no access → throw ForbiddenException
   *   4. Generate signed playback URL and thumbnail URL from Mux
   *   5. Log the view in VIDEO_VIEWS
   *   6. Return { url, thumbnail }
   */
  async authorizePlayback(videoId: string, userId: string, deviceId?: string, ip?: string) {
    const { data: video } = await this.supabaseService.client
      .from(TABLES.VIDEOS)
      .select('status')
      .eq('id', videoId)
      .single();

    if (!video) throw new NotFoundException('Video not found');
    if (video.status !== 'ready') throw new BadRequestException('Video is not ready for playback yet');

    const { data: userBatches } = await this.supabaseService.client
      .from(TABLES.BATCH_STUDENTS)
      .select('batch_id')
      .eq('user_id', userId);

    const userBatchIds = (userBatches ?? []).map((b: any) => b.batch_id);
    if (userBatchIds.length > 0) {
      const { data: accessRecords } = await this.supabaseService.client
        .from(TABLES.VIDEO_BATCHES)
        .select('batch_id')
        .eq('video_id', videoId)
        .in('batch_id', userBatchIds);

      if (!accessRecords || accessRecords.length === 0) {
        throw new ForbiddenException('You do not have access to this video');
      }
    }

    return this.playbackGuard.authorize(userId, videoId, deviceId, ip);
  }

  async getPlaybackUrl(videoId: string, userId: string, token: string, deviceId?: string, ip?: string) {
    const { data: video } = await this.supabaseService.client
      .from(TABLES.VIDEOS)
      .select('mux_playback_id, status')
      .eq('id', videoId)
      .single();

    if (!video) throw new NotFoundException('Video not found');
    if (video.status !== 'ready') throw new BadRequestException('Video is not ready for playback yet');
    if (!video.mux_playback_id) throw new BadRequestException('Video has no playback ID configured');

    return this.playbackGuard.getSignedUrl(
      token,
      video.mux_playback_id,
      userId,
      videoId,
      deviceId,
      ip,
    );
  }

  // ──────────────────────────────────────────────────────────────
  //  updateProgress
  // ──────────────────────────────────────────────────────────────

  /**
   * Update a student's watch progress for a video.
   *
   * Called every ~30 seconds by the video player to save position for resume.
   *
   * Steps:
   *   1. Upsert into VIDEO_PROGRESS (watched_seconds, completed, last_watched_at)
   *   2. Return the updated progress record
   */
  async updateProgress(
    userId: string,
    videoId: string,
    dto: UpdateVideoProgressDto,
  ) {
    const { data, error } = await this.supabaseService.client
      .from(TABLES.VIDEO_PROGRESS)
      .upsert(
        {
          user_id: userId,
          video_id: videoId,
          watched_seconds: dto.watchedSeconds,
          completed: dto.completed ?? false,
          last_watched_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,video_id' },
      )
      .select()
      .single();

    if (error) {
      this.logger.error(`Failed to update progress: ${error.message}`);
      throw new BadRequestException('Failed to update progress');
    }

    return data;
  }

  // ──────────────────────────────────────────────────────────────
  //  requestUploadUrl
  // ──────────────────────────────────────────────────────────────

  /**
   * Request a Mux direct upload URL and create a pending video record.
   *
   * Steps:
   *   1. Create a direct upload URL via MuxService
   *   2. Insert a video record into TABLES.VIDEOS with status 'processing'
   *   3. Return the upload URL + video metadata
   */
  async requestUploadUrl(dto: RequestUploadDto) {
    const { uploadUrl, uploadId } = await this.muxService.createDirectUploadUrl(dto.title);

    const { data: video, error } = await this.supabaseService.client
      .from(TABLES.VIDEOS)
      .insert({
        title: dto.title,
        mux_upload_id: uploadId,
        status: 'processing',
      })
      .select('id, title, status, created_at')
      .single();

    if (error) {
      this.logger.error(`Failed to create video record: ${error.message}`);
      throw new BadRequestException('Failed to create video record');
    }

    return { uploadUrl, video };
  }

  // ──────────────────────────────────────────────────────────────
  //  updateVideo
  // ──────────────────────────────────────────────────────────────

  /**
   * Update video metadata (title, description, topic).
   * Admin-only. Only provided fields are updated.
   */
  async updateVideo(id: string, dto: UpdateVideoDto) {
    const updateData: Record<string, any> = {};
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.topicId !== undefined) updateData.topic_id = dto.topicId;

    if (Object.keys(updateData).length === 0) {
      throw new BadRequestException('No fields to update');
    }

    const { data, error } = await this.supabaseService.client
      .from(TABLES.VIDEOS)
      .update(updateData)
      .eq('id', id)
      .select('*, topics(name)')
      .single();

    if (error || !data) {
      this.logger.error(`Failed to update video ${id}: ${error?.message}`);
      throw new BadRequestException('Failed to update video');
    }

    return data;
  }

  // ──────────────────────────────────────────────────────────────
  //  deleteVideo
  // ──────────────────────────────────────────────────────────────

  /**
   * Delete a video and its related records.
   * Admin-only. Cascades to progress, views, batch links.
   */
  async deleteVideo(id: string) {
    const { data: video } = await this.supabaseService.client
      .from(TABLES.VIDEOS)
      .select('id, mux_asset_id')
      .eq('id', id)
      .single();

    if (!video) {
      throw new NotFoundException('Video not found');
    }

    // Delete from Mux first (if it has a Mux asset) — ignore 404s
    if (video.mux_asset_id) {
      await this.muxService.deleteAsset(video.mux_asset_id);
    }

    // Then delete the row from Supabase
    const { error } = await this.supabaseService.client
      .from(TABLES.VIDEOS)
      .delete()
      .eq('id', id);

    if (error) {
      this.logger.error(`Failed to delete video ${id}: ${error.message}`);
      throw new BadRequestException('Failed to delete video');
    }

    return { deleted: true };
  }

  // ──────────────────────────────────────────────────────────────
  //  getBatchVideos
  // ──────────────────────────────────────────────────────────────

  /**
   * Fetch all ready videos assigned to a specific batch.
   * Used by the student course classroom page.
   */
  async getBatchVideos(batchId: string) {
    const { data: links } = await this.supabaseService.client
      .from(TABLES.VIDEO_BATCHES)
      .select('video_id')
      .eq('batch_id', batchId);

    const videoIds = (links ?? []).map((l: any) => l.video_id);

    if (videoIds.length === 0) {
      return [];
    }

    const { data: videos } = await this.supabaseService.client
      .from(TABLES.VIDEOS)
      .select('id, title, description, duration_seconds, status, created_at, sort_order')
      .in('id', videoIds)
      .eq('status', 'ready')
      .order('sort_order', { ascending: true });

    return (videos ?? []).map((v: any) => ({
      id: v.id,
      title: v.title,
      description: v.description,
      duration: v.duration_seconds,
      status: v.status,
      createdAt: v.created_at,
    }));
  }

  // ──────────────────────────────────────────────────────────────
  //  getAdminVideos
  // ──────────────────────────────────────────────────────────────

  /**
   * Admin view — shows all videos with batch assignment info and status.
   */
  async getAdminVideos(topicId?: string, page = 1, limit = 20) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = this.supabaseService.client
      .from(TABLES.VIDEOS)
      .select(`*, topics(name), ${TABLES.VIDEO_BATCHES}!video_id(batch_id)`, { count: 'exact' })
      .order('created_at', { ascending: false });

    if (topicId) {
      query = query.eq('topic_id', topicId);
    }

    const { data, error, count } = await query.range(from, to);

    if (error) {
      this.logger.error(`Failed to fetch admin videos: ${error.message}`);
      throw new BadRequestException('Could not retrieve videos');
    }

    return {
      items: data ?? [],
      total: count ?? 0,
      page,
      limit,
    };
  }
}
