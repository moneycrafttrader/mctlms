import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../../../common/services/supabase.service';
import { TABLES } from '../../../common/constants/tables.constant';

@Injectable()
export class RecordingCurriculumReconciliationService {
  private readonly logger = new Logger(RecordingCurriculumReconciliationService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async run(dryRun = true) {
    this.logger.log(`Running reconciliation ${dryRun ? '(DRY RUN)' : ''}`);

    const missingEntries = await this.findMissingCurriculumEntries();
    const orphanEntries = await this.findOrphanCurriculumEntries();

    this.logger.log(`Found ${missingEntries.length} missing curriculum entries`);
    this.logger.log(`Found ${orphanEntries.length} orphan curriculum entries`);

    if (dryRun) {
      return { dryRun: true, missingEntries, orphanEntries };
    }

    const insertResults = await this.insertMissingEntries(missingEntries);
    const deleteResults = await this.deleteOrphanEntries(orphanEntries);

    return {
      dryRun: false,
      missingEntries,
      orphanEntries,
      inserted: insertResults,
      deleted: deleteResults,
    };
  }

  private async findMissingCurriculumEntries(): Promise<any[]> {
    const { data: batchLinks } = await this.supabaseService.client
      .from(TABLES.RECORDING_BATCHES)
      .select('recording_id, batch_id');

    const missing: any[] = [];
    for (const link of batchLinks ?? []) {
      const { data: existing } = await this.supabaseService.client
        .from(TABLES.BATCH_RECORDING_CURRICULUM)
        .select('id')
        .eq('batch_id', (link as any).batch_id)
        .eq('content_id', (link as any).recording_id)
        .eq('content_type', 'recording')
        .maybeSingle();

      if (!existing) {
        missing.push({
          batch_id: (link as any).batch_id,
          content_id: (link as any).recording_id,
        });
      }
    }

    return missing;
  }

  private async findOrphanCurriculumEntries(): Promise<any[]> {
    const { data: curriculumEntries } = await this.supabaseService.client
      .from(TABLES.BATCH_RECORDING_CURRICULUM)
      .select('id, batch_id, content_id')
      .eq('content_type', 'recording');

    const orphans: any[] = [];
    for (const entry of curriculumEntries ?? []) {
      const { data: link } = await this.supabaseService.client
        .from(TABLES.RECORDING_BATCHES)
        .select('recording_id')
        .eq('recording_id', (entry as any).content_id)
        .eq('batch_id', (entry as any).batch_id)
        .maybeSingle();

      if (!link) {
        orphans.push({
          id: (entry as any).id,
          batch_id: (entry as any).batch_id,
          content_id: (entry as any).content_id,
        });
      }
    }

    return orphans;
  }

  private async insertMissingEntries(entries: any[]) {
    let inserted = 0;
    for (const entry of entries) {
      const { error } = await this.supabaseService.client
        .from(TABLES.BATCH_RECORDING_CURRICULUM)
        .insert({
          batch_id: entry.batch_id,
          content_id: entry.content_id,
          content_type: 'recording',
          category_name: 'General',
          module_name: null,
          title_override: null,
          sort_order: 0,
          is_published: true,
        });

      if (error) {
        this.logger.warn(`Failed to insert curriculum entry: ${error.message}`);
      } else {
        inserted++;
      }
    }
    return inserted;
  }

  private async deleteOrphanEntries(entries: any[]) {
    let deleted = 0;
    for (const entry of entries) {
      const { error } = await this.supabaseService.client
        .from(TABLES.BATCH_RECORDING_CURRICULUM)
        .delete()
        .eq('id', entry.id);

      if (error) {
        this.logger.warn(`Failed to delete orphan curriculum entry ${entry.id}: ${error.message}`);
      } else {
        deleted++;
      }
    }
    return deleted;
  }
}
