import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { UserRole } from '@lms/shared-types';
import { SupabaseService } from './supabase.service';
import { TABLES } from '../constants/tables.constant';

export type BatchAccessCaller = { id: string; role: string };

/**
 * Central batch membership checks for API authorization (service-role bypasses RLS).
 */
@Injectable()
export class BatchAccessService {
  private readonly logger = new Logger(BatchAccessService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async getTeacherBatchIds(teacherId: string): Promise<string[]> {
    const { data, error } = await this.supabaseService.client
      .from(TABLES.BATCH_TEACHERS)
      .select('batch_id')
      .eq('user_id', teacherId);

    if (error) {
      this.logger.error(`Failed to load teacher batches: ${error.message}`);
      throw new BadRequestException('Could not verify batch access');
    }
    return (data ?? []).map((r: { batch_id: string }) => r.batch_id);
  }

  async assertTeacherBatchAccess(teacherId: string, batchId: string): Promise<void> {
    const { data, error } = await this.supabaseService.client
      .from(TABLES.BATCH_TEACHERS)
      .select('batch_id')
      .eq('batch_id', batchId)
      .eq('user_id', teacherId)
      .maybeSingle();

    if (error) {
      this.logger.error(`Teacher batch access check failed: ${error.message}`);
      throw new BadRequestException('Could not verify batch access');
    }
    if (!data) {
      throw new ForbiddenException('You are not assigned to this batch');
    }
  }

  async assertStudentBatchAccess(studentId: string, batchId: string): Promise<void> {
    const { data, error } = await this.supabaseService.client
      .from(TABLES.BATCH_STUDENTS)
      .select('batch_id')
      .eq('batch_id', batchId)
      .eq('user_id', studentId)
      .maybeSingle();

    if (error) {
      this.logger.error(`Student batch access check failed: ${error.message}`);
      throw new BadRequestException('Could not verify batch access');
    }
    if (!data) {
      throw new NotFoundException('Batch not found');
    }
  }

  /**
   * Read access to batch-scoped resources (curriculum published view, etc.).
   */
  async assertBatchReadAccess(caller: BatchAccessCaller, batchId: string): Promise<void> {
    if (caller.role === UserRole.ADMIN) return;
    if (caller.role === UserRole.TEACHER) {
      await this.assertTeacherBatchAccess(caller.id, batchId);
      return;
    }
    if (caller.role === UserRole.STUDENT) {
      await this.assertStudentBatchAccess(caller.id, batchId);
      return;
    }
    throw new ForbiddenException('Access denied');
  }

  /**
   * Mutations on batch-scoped resources (curriculum write, etc.).
   */
  async assertBatchWriteAccess(caller: BatchAccessCaller, batchId: string): Promise<void> {
    if (caller.role === UserRole.ADMIN) return;
    if (caller.role === UserRole.TEACHER) {
      await this.assertTeacherBatchAccess(caller.id, batchId);
      return;
    }
    throw new ForbiddenException('Access denied');
  }

  async getSessionIdsForTeacherBatches(teacherId: string): Promise<string[]> {
    const batchIds = await this.getTeacherBatchIds(teacherId);
    if (batchIds.length === 0) return [];

    const { data, error } = await this.supabaseService.client
      .from(TABLES.SESSION_BATCHES)
      .select('session_id')
      .in('batch_id', batchIds);

    if (error) {
      this.logger.error(`Failed to resolve teacher sessions: ${error.message}`);
      throw new BadRequestException('Could not retrieve sessions');
    }
    return [...new Set((data ?? []).map((r: { session_id: string }) => r.session_id))];
  }

  async assertTeacherSessionAccess(teacherId: string, sessionId: string): Promise<void> {
    const allowedSessionIds = await this.getSessionIdsForTeacherBatches(teacherId);
    if (!allowedSessionIds.includes(sessionId)) {
      throw new ForbiddenException('You do not have access to this session');
    }
  }

  /**
   * Teacher may view a student profile if they share a batch, or a co-teacher on an assigned batch.
   */
  async assertTeacherCanViewUserProfile(teacherId: string, targetUserId: string): Promise<void> {
    const batchIds = await this.getTeacherBatchIds(teacherId);
    if (batchIds.length === 0) {
      throw new ForbiddenException('Access denied');
    }

    const { data: studentLink } = await this.supabaseService.client
      .from(TABLES.BATCH_STUDENTS)
      .select('user_id')
      .eq('user_id', targetUserId)
      .in('batch_id', batchIds)
      .limit(1);

    if (studentLink?.length) return;

    const { data: teacherLink } = await this.supabaseService.client
      .from(TABLES.BATCH_TEACHERS)
      .select('user_id')
      .eq('user_id', targetUserId)
      .in('batch_id', batchIds)
      .limit(1);

    if (teacherLink?.length) return;

    throw new ForbiddenException('Access denied');
  }

  private async buildTeacherAllowedTestStudentPairs(teacherId: string): Promise<Set<string>> {
    const batchIds = await this.getTeacherBatchIds(teacherId);
    const pairs = new Set<string>();
    if (batchIds.length === 0) return pairs;

    const [{ data: testLinks }, { data: enrollments }] = await Promise.all([
      this.supabaseService.client
        .from(TABLES.TEST_BATCHES)
        .select('test_id, batch_id')
        .in('batch_id', batchIds),
      this.supabaseService.client
        .from(TABLES.BATCH_STUDENTS)
        .select('user_id, batch_id')
        .in('batch_id', batchIds),
    ]);

    for (const tb of testLinks ?? []) {
      for (const en of enrollments ?? []) {
        if (en.batch_id === tb.batch_id) {
          pairs.add(`${tb.test_id}:${en.user_id}`);
        }
      }
    }
    return pairs;
  }

  async assertTeacherCanAccessAttempt(teacherId: string, attemptId: string): Promise<void> {
    const { data: attempt, error } = await this.supabaseService.client
      .from(TABLES.TEST_ATTEMPTS)
      .select('id, test_id, user_id')
      .eq('id', attemptId)
      .single();

    if (error || !attempt) {
      throw new NotFoundException('Attempt not found');
    }

    const pairs = await this.buildTeacherAllowedTestStudentPairs(teacherId);
    const key = `${attempt.test_id}:${attempt.user_id}`;
    if (!pairs.has(key)) {
      throw new ForbiddenException('You cannot access this submission');
    }
  }

  async assertTeacherCanAccessReviewQueueItem(teacherId: string, reviewQueueId: string): Promise<void> {
    const { data: item, error } = await this.supabaseService.client
      .from(TABLES.TEST_REVIEW_QUEUE)
      .select('id, attempt_id')
      .eq('id', reviewQueueId)
      .single();

    if (error || !item) {
      throw new NotFoundException('Review queue item not found');
    }

    await this.assertTeacherCanAccessAttempt(teacherId, item.attempt_id);
  }

  async getTeacherReviewableAttemptIds(teacherId: string): Promise<string[]> {
    const pairs = await this.buildTeacherAllowedTestStudentPairs(teacherId);
    if (pairs.size === 0) return [];

    const testIds = [...new Set([...pairs].map((p) => p.split(':')[0]))];
    const { data: attempts, error } = await this.supabaseService.client
      .from(TABLES.TEST_ATTEMPTS)
      .select('id, test_id, user_id')
      .in('test_id', testIds);

    if (error) {
      this.logger.error(`Failed to load attempts for review filter: ${error.message}`);
      throw new BadRequestException('Could not load review queue');
    }

    return (attempts ?? [])
      .filter((a: { test_id: string; user_id: string }) => pairs.has(`${a.test_id}:${a.user_id}`))
      .map((a: { id: string }) => a.id);
  }

  async assertTeacherBatchesAccess(teacherId: string, batchIds: string[]): Promise<void> {
    const unique = [...new Set((batchIds ?? []).filter(Boolean))];
    for (const batchId of unique) {
      await this.assertTeacherBatchAccess(teacherId, batchId);
    }
  }

  async getTeacherTestIds(teacherId: string): Promise<string[]> {
    const batchIds = await this.getTeacherBatchIds(teacherId);
    if (batchIds.length === 0) return [];

    const { data, error } = await this.supabaseService.client
      .from(TABLES.TEST_BATCHES)
      .select('test_id')
      .in('batch_id', batchIds);

    if (error) {
      this.logger.error(`Failed to load teacher tests: ${error.message}`);
      throw new BadRequestException('Could not verify test access');
    }
    return [...new Set((data ?? []).map((r: { test_id: string }) => r.test_id))];
  }

  private async getTestBatchIds(testId: string): Promise<string[]> {
    const { data, error } = await this.supabaseService.client
      .from(TABLES.TEST_BATCHES)
      .select('batch_id')
      .eq('test_id', testId);

    if (error) {
      this.logger.error(`Failed to load test batches: ${error.message}`);
      throw new BadRequestException('Could not verify test access');
    }
    return (data ?? []).map((r: { batch_id: string }) => r.batch_id);
  }

  /**
   * Teacher may read a test if it shares at least one assigned batch, or is an unassigned draft they created.
   */
  async assertTeacherTestReadAccess(teacherId: string, testId: string): Promise<void> {
    const testBatchIds = await this.getTestBatchIds(testId);
    if (testBatchIds.length === 0) {
      const { data: test, error } = await this.supabaseService.client
        .from(TABLES.TESTS)
        .select('created_by')
        .eq('id', testId)
        .maybeSingle();
      if (error || !test) {
        throw new NotFoundException('Test not found');
      }
      if (test.created_by !== teacherId) {
        throw new ForbiddenException('You do not have access to this test');
      }
      return;
    }
    const teacherBatches = await this.getTeacherBatchIds(teacherId);
    const allowed = testBatchIds.some((id) => teacherBatches.includes(id));
    if (!allowed) {
      throw new ForbiddenException('You do not have access to this test');
    }
  }

  /**
   * Teacher may mutate a test only when every linked batch is assigned to them (multi-batch safe).
   */
  async assertTeacherTestWriteAccess(teacherId: string, testId: string): Promise<void> {
    const testBatchIds = await this.getTestBatchIds(testId);
    if (testBatchIds.length === 0) {
      const { data: test, error } = await this.supabaseService.client
        .from(TABLES.TESTS)
        .select('created_by')
        .eq('id', testId)
        .maybeSingle();
      if (error || !test) {
        throw new NotFoundException('Test not found');
      }
      if (test.created_by !== teacherId) {
        throw new ForbiddenException('You cannot modify this test');
      }
      return;
    }
    await this.assertTeacherBatchesAccess(teacherId, testBatchIds);
  }

  async assertTeacherTestBatchAssignments(
    caller: BatchAccessCaller,
    batches?: { batchId?: string; batch_id?: string }[],
  ): Promise<void> {
    if (caller.role === UserRole.ADMIN) return;
    if (caller.role !== UserRole.TEACHER) {
      throw new ForbiddenException('Access denied');
    }
    const ids = (batches ?? [])
      .map((b) => b.batchId ?? b.batch_id)
      .filter((id): id is string => Boolean(id));
    if (ids.length === 0) return;
    await this.assertTeacherBatchesAccess(caller.id, ids);
  }

  async getTeacherRecordingIds(teacherId: string): Promise<string[]> {
    const batchIds = await this.getTeacherBatchIds(teacherId);
    if (batchIds.length === 0) return [];

    const { data, error } = await this.supabaseService.client
      .from(TABLES.RECORDING_BATCHES)
      .select('recording_id')
      .in('batch_id', batchIds);

    if (error) {
      this.logger.error(`Failed to load teacher recordings: ${error.message}`);
      throw new BadRequestException('Could not verify recording access');
    }
    return [...new Set((data ?? []).map((r: { recording_id: string }) => r.recording_id))];
  }

  async assertTeacherRecordingAccess(teacherId: string, recordingId: string): Promise<void> {
    const { data, error } = await this.supabaseService.client
      .from(TABLES.RECORDING_BATCHES)
      .select('batch_id')
      .eq('recording_id', recordingId);

    if (error) {
      this.logger.error(`Recording batch lookup failed: ${error.message}`);
      throw new BadRequestException('Could not verify recording access');
    }
    if (!data?.length) {
      throw new ForbiddenException('You do not have access to this recording');
    }
    const teacherBatches = await this.getTeacherBatchIds(teacherId);
    const allowed = data.some((r: { batch_id: string }) => teacherBatches.includes(r.batch_id));
    if (!allowed) {
      throw new ForbiddenException('You do not have access to this recording');
    }
  }

  async getTeacherCourseIds(teacherId: string): Promise<string[]> {
    const batchIds = await this.getTeacherBatchIds(teacherId);
    if (batchIds.length === 0) return [];

    const { data, error } = await this.supabaseService.client
      .from(TABLES.BATCHES)
      .select('course_id')
      .in('id', batchIds);

    if (error) {
      this.logger.error(`Failed to load teacher courses: ${error.message}`);
      throw new BadRequestException('Could not verify course access');
    }
    return [...new Set((data ?? []).map((r: { course_id: string }) => r.course_id).filter(Boolean))];
  }

  async assertTeacherCourseAccess(teacherId: string, courseId: string): Promise<void> {
    const courseIds = await this.getTeacherCourseIds(teacherId);
    if (!courseIds.includes(courseId)) {
      throw new ForbiddenException('You do not have access to this course');
    }
  }

  async assertTeacherCanMutateQuestion(teacherId: string, questionId: string): Promise<void> {
    const { data: links, error } = await this.supabaseService.client
      .from(TABLES.TEST_QUESTION_BANK)
      .select('test_id')
      .eq('question_bank_id', questionId);

    if (error) {
      this.logger.error(`Question test links failed: ${error.message}`);
      throw new BadRequestException('Could not verify question access');
    }

    const testIds = [...new Set((links ?? []).map((r: { test_id: string }) => r.test_id))];
    if (testIds.length === 0) {
      const { data: row } = await this.supabaseService.client
        .from(TABLES.QUESTION_BANK)
        .select('created_by')
        .eq('id', questionId)
        .maybeSingle();
      if (!row) {
        throw new NotFoundException('Question not found');
      }
      if (row.created_by !== teacherId) {
        throw new ForbiddenException('You cannot modify this question');
      }
      return;
    }

    for (const testId of testIds) {
      await this.assertTeacherTestWriteAccess(teacherId, testId);
    }
  }

  async assertTeacherCanViewQuestion(teacherId: string, questionId: string): Promise<void> {
    const { data: links } = await this.supabaseService.client
      .from(TABLES.TEST_QUESTION_BANK)
      .select('test_id')
      .eq('question_bank_id', questionId);

    const testIds = [...new Set((links ?? []).map((r: { test_id: string }) => r.test_id))];
    if (testIds.length === 0) {
      const { data: row } = await this.supabaseService.client
        .from(TABLES.QUESTION_BANK)
        .select('created_by')
        .eq('id', questionId)
        .maybeSingle();
      if (!row) {
        throw new NotFoundException('Question not found');
      }
      if (row.created_by !== teacherId) {
        throw new ForbiddenException('You do not have access to this question');
      }
      return;
    }

    let allowed = false;
    for (const testId of testIds) {
      try {
        await this.assertTeacherTestReadAccess(teacherId, testId);
        allowed = true;
        break;
      } catch (e) {
        if (e instanceof NotFoundException) throw e;
      }
    }
    if (!allowed) {
      throw new ForbiddenException('You do not have access to this question');
    }
  }

  async assertTeacherCanMarkAttendanceEntries(
    teacherId: string,
    sessionId: string,
    studentUserIds: string[],
  ): Promise<void> {
    await this.assertTeacherSessionAccess(teacherId, sessionId);

    const { data: sessionBatches, error } = await this.supabaseService.client
      .from(TABLES.SESSION_BATCHES)
      .select('batch_id')
      .eq('session_id', sessionId);

    if (error) {
      this.logger.error(`Session batch lookup failed: ${error.message}`);
      throw new BadRequestException('Could not verify attendance access');
    }

    const teacherBatches = await this.getTeacherBatchIds(teacherId);
    const allowedBatchIds = (sessionBatches ?? [])
      .map((r: { batch_id: string }) => r.batch_id)
      .filter((id) => teacherBatches.includes(id));

    if (allowedBatchIds.length === 0) {
      throw new ForbiddenException('You do not have access to this session');
    }

    const uniqueStudents = [...new Set(studentUserIds.filter(Boolean))];
    for (const userId of uniqueStudents) {
      const { data: enrol } = await this.supabaseService.client
        .from(TABLES.BATCH_STUDENTS)
        .select('user_id')
        .eq('user_id', userId)
        .in('batch_id', allowedBatchIds)
        .limit(1);
      if (!enrol?.length) {
        throw new ForbiddenException('You cannot mark attendance for this student');
      }
    }
  }
}