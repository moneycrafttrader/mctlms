import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { SupabaseService } from '../../common/services/supabase.service';
import { TABLES } from '../../common/constants/tables.constant';

const PROGRESS_BATCH_SIZE = 50;

@Injectable()
export class CurriculumProgressService {
  private readonly logger = new Logger(CurriculumProgressService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async getAdminProgress(batchId: string) {
    // 1. Fetch all enrolled students
    const { data: enrolled, error: enrollErr } = await this.supabaseService.client
      .from(TABLES.BATCH_STUDENTS)
      .select('user_id')
      .eq('batch_id', batchId);

    if (enrollErr) {
      this.logger.error(`Failed to fetch batch enrollment: ${enrollErr.message}`);
      throw enrollErr;
    }

    const studentIds = (enrolled ?? []).map((e: any) => e.user_id);
    const totalStudents = studentIds.length;

    if (totalStudents === 0) {
      return {
        batchId,
        totalStudents: 0,
        activeStudents: 0,
        completedCurriculum: 0,
        averageProgress: 0,
        completionRate: 0,
        courseBreakdown: [],
        batchBreakdown: [],
      };
    }

    // 2. Fetch curriculum items for this batch
    const { data: curriculum } = await this.supabaseService.client
      .from(TABLES.BATCH_RECORDING_CURRICULUM)
      .select('id, category_name')
      .eq('batch_id', batchId);

    const curriculumItems = curriculum ?? [];
    const totalItems = curriculumItems.length;

    // 3. Fetch all progress records for these students
    const { data: progress } = await this.supabaseService.client
      .from(TABLES.BATCH_CURRICULUM_ITEM_PROGRESS)
      .select('user_id, curriculum_id, completed')
      .in('user_id', studentIds);

    const progressRows = progress ?? [];

    // 4. Aggregate per student
    const studentProgressMap = new Map<string, { completed: number; total: number }>();

    // Initialize all students with zero progress
    for (const sid of studentIds) {
      studentProgressMap.set(sid, { completed: 0, total: totalItems });
    }

    // Count completed items per student
    for (const row of progressRows as any[]) {
      const entry = studentProgressMap.get(row.user_id);
      if (entry && row.completed) {
        entry.completed += 1;
      }
    }

    // 5. Compute aggregate metrics
    let totalCompleted = 0;
    let completedCurriculum = 0;
    let activeCount = 0;

    // Course breakdown by category
    const categoryMap = new Map<string, { totalItems: number; completedItems: number }>();
    for (const item of curriculumItems as any[]) {
      const cat = item.category_name ?? 'General';
      if (!categoryMap.has(cat)) {
        categoryMap.set(cat, { totalItems: 0, completedItems: 0 });
      }
      categoryMap.get(cat)!.totalItems += 1;
    }

    for (const [sid, progress] of studentProgressMap) {
      totalCompleted += progress.completed;

      if (progress.completed > 0) {
        activeCount += 1;
      }

      if (totalItems > 0 && progress.completed >= totalItems) {
        completedCurriculum += 1;
      }

      // Category-level aggregation
      for (const [cat, counts] of categoryMap) {
        const categoryItems = (curriculumItems as any[])
          .filter((i: any) => (i.category_name ?? 'General') === cat)
          .map((i: any) => i.id);

        const userCategoryCompleted = progressRows
          .filter((p: any) => p.user_id === sid && categoryItems.includes(p.curriculum_id) && p.completed)
          .length;

        counts.completedItems += userCategoryCompleted;
      }
    }

    const averageProgress = totalItems > 0
      ? Math.round((totalCompleted / (totalStudents * totalItems)) * 100)
      : 0;

    const completionRate = totalStudents > 0
      ? Math.round((completedCurriculum / totalStudents) * 100)
      : 0;

    // 6. Build course breakdown
    const courseBreakdown = Array.from(categoryMap.entries()).map(([category, counts]) => ({
      category,
      totalItems: counts.totalItems,
      averageCompletion: Math.round((counts.completedItems / (totalStudents * counts.totalItems)) * 100),
    }));

    return {
      batchId,
      totalStudents,
      activeStudents: activeCount,
      completedCurriculum,
      averageProgress,
      completionRate,
      courseBreakdown,
      batchBreakdown: [{ batchId, studentCount: totalStudents }],
    };
  }

  async getProgress(batchId: string, userId: string) {
    const { data: curriculum } = await this.supabaseService.client
      .from(TABLES.BATCH_RECORDING_CURRICULUM)
      .select('*')
      .eq('batch_id', batchId);

    const { data: rules } = await this.supabaseService.client
      .from(TABLES.BATCH_CURRICULUM_RULES)
      .select('*')
      .eq('batch_id', batchId);

    const { data: prerequisites } = await this.supabaseService.client
      .from(TABLES.BATCH_CURRICULUM_PREREQUISITES)
      .select('*')
      .eq('batch_id', batchId);

    const categories = this.groupByCategory(curriculum ?? []);
    const results: any[] = [];

    for (const cat of categories) {
      const rule = (rules ?? []).find((r: any) => r.category_name === cat.category);
      const itemProgresses = await Promise.all(
        cat.items.map((item: any) => this.getItemProgress(item, userId)),
      );

      const completedCount = itemProgresses.filter((p) => p.completed).length;
      const totalCount = itemProgresses.length;
      const isCompleted = this.evaluateCompletion(
        rule?.rule_type ?? 'all_items',
        rule?.threshold ?? null,
        completedCount,
        totalCount,
      );

      results.push({
        category: cat.category,
        totalItems: totalCount,
        completedItems: completedCount,
        isCompleted,
        rule: rule?.rule_type ?? 'all_items',
        items: itemProgresses,
      });
    }

    return {
      batchId,
      categories: results,
      prerequisites: prerequisites ?? [],
    };
  }

  async setRule(batchId: string, categoryName: string, ruleType: string, threshold?: number) {
    const { data, error } = await this.supabaseService.client
      .from(TABLES.BATCH_CURRICULUM_RULES)
      .upsert(
        { batch_id: batchId, category_name: categoryName, rule_type: ruleType, threshold: threshold ?? null },
        { onConflict: 'batch_id,category_name' },
      )
      .select()
      .single();

    if (error) {
      this.logger.error(`Failed to set rule: ${error.message}`);
      throw error;
    }
    return data;
  }

  async addPrerequisite(curriculumId: string, prerequisiteId: string, batchId: string) {
    const { data, error } = await this.supabaseService.client
      .from(TABLES.BATCH_CURRICULUM_PREREQUISITES)
      .insert({ batch_id: batchId, curriculum_id: curriculumId, prerequisite_id: prerequisiteId })
      .select()
      .single();

    if (error) {
      this.logger.error(`Failed to add prerequisite: ${error.message}`);
      throw error;
    }
    return data;
  }

  async removePrerequisite(id: string) {
    const { error } = await this.supabaseService.client
      .from(TABLES.BATCH_CURRICULUM_PREREQUISITES)
      .delete()
      .eq('id', id);

    if (error) {
      this.logger.error(`Failed to remove prerequisite: ${error.message}`);
      throw error;
    }
    return { deleted: true };
  }

  async markItemProgress(
    userId: string,
    curriculumId: string,
    completed: boolean,
  ) {
    // Verify the user is enrolled in the batch that owns this curriculum item
    const { data: item, error: itemError } = await this.supabaseService.client
      .from(TABLES.BATCH_RECORDING_CURRICULUM)
      .select('batch_id')
      .eq('id', curriculumId)
      .single();

    if (itemError || !item) {
      throw new ForbiddenException('Curriculum item not found');
    }

    const { data: enrollment, error: enrollError } = await this.supabaseService.client
      .from(TABLES.BATCH_STUDENTS)
      .select('batch_id')
      .eq('batch_id', (item as any).batch_id)
      .eq('user_id', userId)
      .maybeSingle();

    if (enrollError || !enrollment) {
      throw new ForbiddenException('You are not enrolled in this batch');
    }

    const { data, error } = await this.supabaseService.client
      .from(TABLES.BATCH_CURRICULUM_ITEM_PROGRESS)
      .upsert(
        {
          user_id: userId,
          curriculum_id: curriculumId,
          completed,
          completed_at: completed ? new Date().toISOString() : null,
        },
        { onConflict: 'user_id,curriculum_id' },
      )
      .select()
      .single();

    if (error) {
      this.logger.error(`Failed to update progress: ${error.message}`);
      throw error;
    }
    return data;
  }

  private async getItemProgress(item: any, userId: string) {
    const type = item.content_type ?? 'recording';
    const contentId = item.content_id;

    let completed = false;

    if (type === 'recording' && contentId) {
      const { data } = await this.supabaseService.client
        .from(TABLES.VIDEO_PROGRESS)
        .select('completed')
        .eq('user_id', userId)
        .eq('recording_id', contentId)
        .maybeSingle();
      completed = data?.completed ?? false;
    } else if (type === 'test' && contentId) {
      const { data } = await this.supabaseService.client
        .from(TABLES.TEST_RESULTS)
        .select('id')
        .eq('user_id', userId)
        .eq('test_id', contentId)
        .eq('passed', true)
        .maybeSingle();
      completed = !!data;
    } else {
      const { data } = await this.supabaseService.client
        .from(TABLES.BATCH_CURRICULUM_ITEM_PROGRESS)
        .select('completed')
        .eq('user_id', userId)
        .eq('curriculum_id', item.id)
        .maybeSingle();
      completed = data?.completed ?? false;
    }

    return {
      curriculumId: item.id,
      contentId,
      contentType: type,
      completed,
    };
  }

  private evaluateCompletion(
    ruleType: string,
    threshold: number | null,
    completedCount: number,
    totalCount: number,
  ): boolean {
    if (totalCount === 0) return false;
    switch (ruleType) {
      case 'all_items':
        return completedCount >= totalCount;
      case 'all_recordings':
        return completedCount >= totalCount;
      case 'pass_tests':
        return completedCount >= totalCount;
      case 'percentage':
        return threshold != null && (completedCount / totalCount) * 100 >= threshold;
      case 'any_one':
        return completedCount >= 1;
      default:
        return completedCount >= totalCount;
    }
  }

  private groupByCategory(items: any[]) {
    const grouped: Record<string, any[]> = {};
    for (const item of items) {
      const cat = item.category_name ?? 'General';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(item);
    }
    return Object.entries(grouped).map(([category, items]) => ({ category, items }));
  }
}
