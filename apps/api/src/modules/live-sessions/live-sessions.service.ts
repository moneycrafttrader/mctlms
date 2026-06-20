/*
 * Live Sessions service — orchestrates Zoom webinar creation and student registration
 *
 * Why this service exists:
 *   - All session business logic lives here, NOT in the controller.
 *   - Coordinates: create Zoom webinar → register all students with unique URLs →
 *     store everything in the database.
 *   - This is the main orchestration method. It coordinates Zoom API + database in
 *     one transaction-like flow.
 *
 * A junior should know:
 *   - The `create` method does a LOT — it calls Zoom API, inserts multiple DB rows,
 *     and registers each student individually.
 *   - Students get their personal join URL from getStudentJoinUrl() — they never see
 *     any other student's URL (this enables attendance tracking).
 *   - getForStudent() returns upcoming and past sessions separately for the dashboard.
 */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { SessionStatus } from '@lms/shared-types';
import { SupabaseService } from '../../common/services/supabase.service';
import { BatchesService } from '../batches/batches.service';
import { ZoomService } from '../zoom/zoom.service';
import { TABLES } from '../../common/constants/tables.constant';
import { CreateSessionDto } from './dto/create-session.dto';

@Injectable()
export class LiveSessionsService {
  private readonly logger = new Logger(LiveSessionsService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly batchesService: BatchesService,
    private readonly zoomService: ZoomService,
  ) {}

  // ──────────────────────────────────────────────────────────────
  //  create
  // ──────────────────────────────────────────────────────────────

  /**
   * Create a new live session — this is the main orchestration method.
   *
   * Steps:
   *   1. Fetch the teacher and verify they have a zoomUserId set
   *   2. Verify all batchIds exist
   *   3. Create the Zoom webinar via ZoomService
   *   4. Insert the session into TABLES.LIVE_SESSIONS
   *   5. Insert batch associations into TABLES.SESSION_BATCHES
   *   6. Fetch all students from all assigned batches (deduplicated)
   *   7. Register each student as a Zoom webinar attendee
   *   8. Save each student's unique join URL to TABLES.SESSION_REGISTRANTS
   *   9. Return the created session with counts
   */
  async create(dto: CreateSessionDto) {
    // ── Step 1: Verify teacher ─────────────────────────────────
    const { data: teacher, error: teacherError } = await this.supabaseService.client
      .from(TABLES.PROFILES)
      .select('id, name, email, role, zoom_user_id')
      .eq('id', dto.teacherId)
      .single();

    if (teacherError || !teacher) {
      throw new BadRequestException('Teacher not found');
    }

    if (teacher.role !== 'teacher') {
      throw new BadRequestException('Selected user is not a teacher');
    }

    if (!teacher.zoom_user_id) {
      throw new BadRequestException(
        'Teacher does not have a Zoom user ID configured. Update their profile first.',
      );
    }

    // ── Step 2: Verify all batchIds exist ──────────────────────
    for (const batchId of dto.batchIds) {
      await this.batchesService.findById(batchId);
    }

    // ── Step 3: Create Zoom webinar ────────────────────────────
    const webinar = await this.zoomService.createWebinar({
      hostZoomUserId: teacher.zoom_user_id,
      topic: dto.topic,
      agenda: dto.agenda,
      startTime: dto.startTime,
      durationMinutes: dto.durationMinutes,
    });

    // ── Step 4: Insert session into database ───────────────────
    const { data: session, error: sessionError } = await this.supabaseService.client
      .from(TABLES.LIVE_SESSIONS)
      .insert({
        zoom_webinar_id: webinar.webinarId,
        zoom_join_url: webinar.joinUrl,
        zoom_start_url: webinar.startUrl,
        topic: dto.topic,
        agenda: dto.agenda ?? null,
        start_time: dto.startTime,
        duration_minutes: dto.durationMinutes,
        host_user_id: dto.teacherId,
        status: 'scheduled',
      })
      .select()
      .single();

    if (sessionError) {
      this.logger.error(`Failed to create session: ${sessionError.message}`);
      throw new BadRequestException('Failed to create session');
    }

    const sessionId = session.id;

    // ── Step 5: Insert batch associations ──────────────────────
    const batchRecords = dto.batchIds.map((batchId) => ({
      session_id: sessionId,
      batch_id: batchId,
    }));

    const { error: batchError } = await this.supabaseService.client
      .from(TABLES.SESSION_BATCHES)
      .insert(batchRecords);

    if (batchError) {
      this.logger.error(`Failed to link batches: ${batchError.message}`);
      // Don't throw — the session exists but batch links failed; admin can retry
    }

    // ── Step 6: Fetch all students from assigned batches ───────
    // Use Promise.all to fetch students from all batches in parallel
    const studentResults = await Promise.all(
      dto.batchIds.map((batchId) =>
        this.supabaseService.client
          .from(TABLES.BATCH_STUDENTS)
          .select('user_id, users!inner(id, name, email)')
          .eq('batch_id', batchId),
      ),
    );

    // Flatten and deduplicate by user_id
    const studentMap = new Map<string, { id: string; name: string; email: string }>();
    for (const result of studentResults) {
      if (result.data) {
        for (const item of result.data as any[]) {
          const user = item.users;
          if (!studentMap.has(user.id)) {
            studentMap.set(user.id, user);
          }
        }
      }
    }

    const students = Array.from(studentMap.values());
    let registrantCount = 0;

    // ── Steps 7–8: Register each student with Zoom ────────────
    const registrantRecords: any[] = [];
    for (const student of students) {
      try {
        const joinUrl = await this.zoomService.registerAttendee(
          webinar.webinarId,
          { name: student.name, email: student.email },
        );

        registrantRecords.push({
          session_id: sessionId,
          user_id: student.id,
          join_url: joinUrl,
          registered_at: new Date().toISOString(),
        });
        registrantCount++;
      } catch (error: any) {
        this.logger.warn(
          `Failed to register student ${student.id} for session ${sessionId}: ${error.message}`,
        );
        // Continue registering the rest — a single failure shouldn't block everyone
      }
    }

    // Batch-insert registrant records
    if (registrantRecords.length > 0) {
      await this.supabaseService.client
        .from(TABLES.SESSION_REGISTRANTS)
        .insert(registrantRecords);
    }

    return {
      ...session,
      totalStudents: students.length,
      registrantCount,
      batches: dto.batchIds,
    };
  }

  // ──────────────────────────────────────────────────────────────
  //  findAll
  // ──────────────────────────────────────────────────────────────

  /**
   * List sessions with optional filters and pagination.
   *
   * Steps:
   *   1. Build query with optional batchId or status filter
   *   2. Apply range() for pagination, order by start_time desc
   *   3. Also fetch total count
   *   4. Return PaginatedResponse
   */
  async findAll(
    page = 1,
    limit = 20,
    batchId?: string,
    status?: string,
  ) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = this.supabaseService.client
      .from(TABLES.LIVE_SESSIONS)
      .select('*', { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
    }

    // If filtering by batch, we need to join through SESSION_BATCHES
    if (batchId) {
      const { data: sessionIds } = await this.supabaseService.client
        .from(TABLES.SESSION_BATCHES)
        .select('session_id')
        .eq('batch_id', batchId);

      const ids = (sessionIds ?? []).map((s: any) => s.session_id);
      if (ids.length > 0) {
        query = query.in('id', ids);
      } else {
        // No sessions for this batch — return empty
        return { items: [], total: 0, page, limit };
      }
    }

    const { data, error, count } = await query
      .order('start_time', { ascending: false })
      .range(from, to);

    if (error) {
      this.logger.error(`Failed to fetch sessions: ${error.message}`);
      throw new BadRequestException('Could not retrieve sessions');
    }

    return {
      items: data ?? [],
      total: count ?? 0,
      page,
      limit,
    };
  }

  // ──────────────────────────────────────────────────────────────
  //  findById
  // ──────────────────────────────────────────────────────────────

  /**
   * Get a single session by ID, including its batch list and host teacher info.
   *
   * Steps:
   *   1. Fetch the session
   *   2. Fetch related batch IDs from SESSION_BATCHES
   *   3. Fetch the host teacher's name
   *   4. Return combined result
   */
  async findById(id: string) {
    // Fetch session
    const { data: session, error: sessionError } = await this.supabaseService.client
      .from(TABLES.LIVE_SESSIONS)
      .select('*')
      .eq('id', id)
      .single();

    if (sessionError || !session) {
      throw new NotFoundException('Session not found');
    }

    // Fetch batch IDs
    const { data: batchLinks } = await this.supabaseService.client
      .from(TABLES.SESSION_BATCHES)
      .select('batch_id')
      .eq('session_id', id);

    const batchIds = (batchLinks ?? []).map((b: any) => b.batch_id);

    // Fetch host teacher info
    const { data: teacher } = await this.supabaseService.client
      .from(TABLES.PROFILES)
      .select('id, name, email')
      .eq('id', session.host_user_id)
      .single();

    return {
      ...session,
      batchIds,
      hostTeacher: teacher ?? null,
    };
  }

  // ──────────────────────────────────────────────────────────────
  //  getStudentJoinUrl
  // ──────────────────────────────────────────────────────────────

  /**
   * Get a student's personal (unique) Zoom join URL for a session.
   *
   * Students get their personal join URL here — they never see any other
   * student's URL. This is how Zoom tracks individual attendance.
   *
   * Steps:
   *   1. Query SESSION_REGISTRANTS for the given session and user
   *   2. Throw NotFoundException if not registered
   *   3. Return the join URL
   */
  async getStudentJoinUrl(sessionId: string, userId: string): Promise<string> {
    const { data, error } = await this.supabaseService.client
      .from(TABLES.SESSION_REGISTRANTS)
      .select('join_url')
      .eq('session_id', sessionId)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      throw new NotFoundException(
        'You are not registered for this session. Contact your admin.',
      );
    }

    return data.join_url;
  }

  // ──────────────────────────────────────────────────────────────
  //  getForStudent
  // ──────────────────────────────────────────────────────────────

  /**
   * Get all sessions relevant to a student, split into upcoming and past.
   *
   * Steps:
   *   1. Find all batches the student is enrolled in
   *   2. Find all sessions for those batches
   *   3. Separate into upcoming (scheduled/live) and past (ended)
   *   4. Include attendance status for past sessions
   *   5. Return the separated lists
   */
  async getForStudent(userId: string) {
    // Get student's batches
    const { data: batchMemberships } = await this.supabaseService.client
      .from(TABLES.BATCH_STUDENTS)
      .select('batch_id')
      .eq('user_id', userId);

    const batchIds = (batchMemberships ?? []).map((b: any) => b.batch_id);

    if (batchIds.length === 0) {
      return { upcoming: [], past: [] };
    }

    // Get all session IDs for these batches
    const { data: sessionLinks } = await this.supabaseService.client
      .from(TABLES.SESSION_BATCHES)
      .select('session_id')
      .in('batch_id', batchIds);

    const sessionIds = [
      ...new Set((sessionLinks ?? []).map((s: any) => s.session_id)),
    ];

    if (sessionIds.length === 0) {
      return { upcoming: [], past: [] };
    }

    // Fetch all sessions
    const { data: sessions } = await this.supabaseService.client
      .from(TABLES.LIVE_SESSIONS)
      .select('*')
      .in('id', sessionIds)
      .order('start_time', { ascending: false });

    // Split into upcoming and past
    const now = new Date().toISOString();
    const upcoming = (sessions ?? []).filter(
      (s: any) => s.status === 'scheduled' || s.status === 'live',
    );
    const past = (sessions ?? []).filter(
      (s: any) => s.status === 'ended' || s.status === 'cancelled',
    );

    // Include attendance status for past sessions
    if (past.length > 0) {
      const pastIds = past.map((s: any) => s.id);
      const { data: attendance } = await this.supabaseService.client
        .from(TABLES.ATTENDANCE)
        .select('session_id, status')
        .in('session_id', pastIds)
        .eq('user_id', userId);

      const attendanceMap = new Map(
        (attendance ?? []).map((a: any) => [a.session_id, a.status]),
      );

      for (const session of past) {
        (session as any).attendanceStatus =
          attendanceMap.get(session.id) || 'absent';
      }
    }

    return { upcoming, past };
  }

  // ──────────────────────────────────────────────────────────────
  //  updateStatus
  // ──────────────────────────────────────────────────────────────

  /**
   * Manually update the status of a session (admin-only).
   *
   * Steps:
   *   1. Update the status in the database
   *   2. Return the updated session
   */
  async updateStatus(id: string, status: SessionStatus) {
    const { data, error } = await this.supabaseService.client
      .from(TABLES.LIVE_SESSIONS)
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      this.logger.error(`Failed to update session status ${id}: ${error?.message}`);
      throw new BadRequestException('Failed to update session status');
    }

    return data;
  }
}
