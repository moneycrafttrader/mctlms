import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { SupabaseService } from '../../common/services/supabase.service';
import { TABLES } from '../../common/constants/tables.constant';

@Injectable()
export class ResultsService {
  private readonly logger = new Logger(ResultsService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async getStudentResult(attemptId: string, userId: string) {
    // Verify ownership
    const { data: attempt, error: attemptError } = await this.supabaseService.client
      .from(TABLES.TEST_ATTEMPTS)
      .select('user_id, test_id')
      .eq('id', attemptId)
      .single();

    if (attemptError || !attempt) {
      throw new NotFoundException('Attempt not found');
    }

    if (attempt.user_id !== userId) {
      throw new ForbiddenException('You do not own this attempt');
    }

    // Fetch test to check result visibility
    const { data: test, error: testError } = await this.supabaseService.client
      .from(TABLES.TESTS)
      .select('show_result_immediately')
      .eq('id', attempt.test_id)
      .single();

    if (testError || !test) {
      throw new NotFoundException('Test not found');
    }

    // Fetch result with joins
    const { data: result, error: resultError } = await this.supabaseService.client
      .from(TABLES.TEST_RESULTS)
      .select(`
        *,
        test:${TABLES.TESTS}(title, total_marks, passing_marks, duration_minutes, show_result_immediately),
        answers:${TABLES.TEST_ANSWERS}(*)
      `)
      .eq('attempt_id', attemptId)
      .single();

    if (resultError || !result) {
      throw new NotFoundException('Result not found');
    }

    // If show_result_immediately is false and not yet published, deny
    if (!test.show_result_immediately && result.status !== 'published') {
      throw new ForbiddenException('Result has not been published yet');
    }

    return {
      obtained_marks: result.obtained_marks,
      total_marks: result.total_marks,
      percentage: result.percentage,
      rank: result.rank,
      total_attempts: result.total_attempts,
      accuracy: result.accuracy,
      topic_analysis: result.topic_analysis,
      question_analysis: result.question_analysis,
      teacher_feedback: result.teacher_feedback,
      passed: result.passed,
      duration_seconds: result.duration_seconds,
      published_at: result.published_at,
    };
  }

  async getMyResults(
    userId: string,
    options?: { page?: number; limit?: number },
  ) {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 50;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const query = this.supabaseService.client
      .from(TABLES.TEST_RESULTS)
      .select(`
        *,
        test:${TABLES.TESTS}(id, title, total_marks, passing_marks)
      `, { count: 'exact' })
      .eq('user_id', userId)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .range(from, to);

    const { data, count, error } = await query;
    if (error) throw error;

    const items = (data ?? []).map((r: any) => ({
      id: r.id,
      test_id: r.test_id,
      test_title: r.test?.title ?? null,
      percentage: r.percentage,
      rank: r.rank,
      passed: r.passed,
      obtained_marks: r.obtained_marks,
      total_marks: r.total_marks,
      published_at: r.published_at,
    }));

    return { items, total: count ?? 0, page, limit };
  }

  async getTestResults(
    testId: string,
    options?: { page?: number; limit?: number; orderBy?: string },
  ) {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 50;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const orderColumn = options?.orderBy === 'marks' ? 'obtained_marks' : 'rank';

    const query = this.supabaseService.client
      .from(TABLES.TEST_RESULTS)
      .select(`
        *,
        profile:${TABLES.PROFILES}!user_id(id, name, email)
      `, { count: 'exact' })
      .eq('test_id', testId)
      .eq('status', 'published')
      .order(orderColumn, { ascending: true })
      .range(from, to);

    const { data, count, error } = await query;
    if (error) throw error;

    const items = (data ?? []).map((r: any) => ({
      id: r.id,
      user_id: r.user_id,
      student_name: r.profile?.name ?? null,
      student_email: r.profile?.email ?? null,
      obtained_marks: r.obtained_marks,
      total_marks: r.total_marks,
      percentage: r.percentage,
      rank: r.rank,
      duration_seconds: r.duration_seconds,
      passed: r.passed,
      published_at: r.published_at,
    }));

    return { items, total: count ?? 0, page, limit };
  }

  async getTestAnalytics(testId: string) {
    const { data, error } = await this.supabaseService.client
      .from(TABLES.TEST_ANALYTICS_SNAPSHOTS)
      .select('*')
      .eq('test_id', testId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      throw new NotFoundException('No analytics snapshot found for this test');
    }

    return {
      total_attempts: data.total_attempts,
      average_score: data.average_score,
      highest: data.highest,
      lowest: data.lowest,
      median: data.median,
      pass_rate: data.pass_rate,
      average_accuracy: data.average_accuracy,
      average_duration: data.average_duration,
      question_performance: data.question_performance,
      topic_performance: data.topic_performance,
      batch_performance: data.batch_performance,
    };
  }

  async getStudentAnalytics(userId: string) {
    const { data: results, error } = await this.supabaseService.client
      .from(TABLES.TEST_RESULTS)
      .select(`
        *,
        test:${TABLES.TESTS}(id, title)
      `)
      .eq('user_id', userId)
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    if (error) throw error;

    if (!results || results.length === 0) {
      return {
        total_tests_taken: 0,
        average_percentage: 0,
        best_percentage: 0,
        worst_percentage: 0,
        topic_strengths: [],
        topic_weaknesses: [],
        recent_trend: [],
      };
    }

    const percentages = results.map((r: any) => r.percentage);
    const averagePercentage = percentages.reduce((a: number, b: number) => a + b, 0) / percentages.length;
    const bestPercentage = Math.max(...percentages);
    const worstPercentage = Math.min(...percentages);

    // Aggregate topic analysis across all results
    const topicMap = new Map<string, { total: number; correct: number }>();
    for (const r of results) {
      const topicAnalysis = r.topic_analysis;
      if (Array.isArray(topicAnalysis)) {
        for (const topic of topicAnalysis) {
          const existing = topicMap.get(topic.name) ?? { total: 0, correct: 0 };
          existing.total += topic.total_questions ?? 0;
          existing.correct += topic.correct_answers ?? 0;
          topicMap.set(topic.name, existing);
        }
      }
    }

    const topicStrengths: string[] = [];
    const topicWeaknesses: string[] = [];
    for (const [name, stats] of topicMap) {
      const accuracy = stats.total > 0 ? stats.correct / stats.total : 0;
      if (accuracy > 0.7) topicStrengths.push(name);
      if (accuracy < 0.4) topicWeaknesses.push(name);
    }

    const recentTrend = results.slice(0, 5).map((r: any) => ({
      test_id: r.test_id,
      test_title: r.test?.title ?? null,
      percentage: r.percentage,
      passed: r.passed,
      published_at: r.published_at,
    }));

    return {
      total_tests_taken: results.length,
      average_percentage: Math.round(averagePercentage * 100) / 100,
      best_percentage: bestPercentage,
      worst_percentage: worstPercentage,
      topicStrengths,
      topicWeaknesses,
      recent_trend: recentTrend,
    };
  }

  async getOverallAnalytics(options?: { batchId?: string }) {
    const [testCount, resultCount, allResults, studentsResult] =
      await Promise.all([
        // Total tests
        this.supabaseService.client
          .from(TABLES.TESTS)
          .select('id', { count: 'exact', head: true }),

        // Total published results
        this.supabaseService.client
          .from(TABLES.TEST_RESULTS)
          .select('id', { count: 'exact', head: true })
          .eq('status', 'published'),

        // All published results for aggregation
        this.supabaseService.client
          .from(TABLES.TEST_RESULTS)
          .select('percentage, passed, user_id')
          .eq('status', 'published'),

        // Distinct students who attempted tests
        this.supabaseService.client
          .from(TABLES.TEST_RESULTS)
          .select('user_id')
          .eq('status', 'published'),
      ]);

    const totalTests = (testCount as any).count ?? 0;
    const totalAttempts = (resultCount as any).count ?? 0;
    const results = (allResults.data ?? []) as any[];

    let totalStudents = 0;
    if (studentsResult.data) {
      const uniqueStudents = new Set(studentsResult.data.map((r: any) => r.user_id));
      totalStudents = uniqueStudents.size;
    }

    const overallAverage = results.length > 0
      ? results.reduce((sum: number, r: any) => sum + r.percentage, 0) / results.length
      : 0;

    const passed = results.filter((r: any) => r.passed).length;
    const failed = results.length - passed;

    let performanceByBatch: any[] = [];

    if (options?.batchId) {
      const { data: batchResults } = await this.supabaseService.client
        .from(TABLES.TEST_RESULTS)
        .select(`
          percentage,
          passed,
          profile:${TABLES.PROFILES}!user_id(id, batch_id)
        `)
        .eq('status', 'published')
        .eq('profile.batch_id', options.batchId);

      if (batchResults && batchResults.length > 0) {
        const batchPercentages = batchResults.map((r: any) => r.percentage);
        const batchAvg = batchPercentages.reduce((a: number, b: number) => a + b, 0) / batchPercentages.length;
        const batchPassed = batchResults.filter((r: any) => r.passed).length;

        performanceByBatch = [{
          batch_id: options.batchId,
          attempts: batchResults.length,
          average_percentage: Math.round(batchAvg * 100) / 100,
          pass_rate: Math.round((batchPassed / batchResults.length) * 10000) / 100,
        }];
      }
    }

    return {
      total_tests: totalTests,
      total_attempts: totalAttempts,
      overall_average: Math.round(overallAverage * 100) / 100,
      total_students_attempted: totalStudents,
      tests_by_status: { passed, failed },
      performance_by_batch: performanceByBatch,
    };
  }
}
