import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../../common/services/supabase.service';
import { TABLES } from '../../common/constants/tables.constant';

@Injectable()
export class CurriculumProgressService {
  private readonly logger = new Logger(CurriculumProgressService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

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
