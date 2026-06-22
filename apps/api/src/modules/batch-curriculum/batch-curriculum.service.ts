import { Injectable, Logger, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../../common/services/supabase.service';
import { TABLES } from '../../common/constants/tables.constant';
import { AddCurriculumItemDto } from './dto/add-curriculum-item.dto';
import { UpdateCurriculumItemDto } from './dto/update-curriculum-item.dto';
import { ReorderCurriculumDto } from './dto/reorder-curriculum.dto';

@Injectable()
export class BatchCurriculumService {
  private readonly logger = new Logger(BatchCurriculumService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async findAll(batchId: string) {
    const { data, error } = await this.supabaseService.client
      .from(TABLES.BATCH_RECORDING_CURRICULUM)
      .select('*, recordings(*)')
      .eq('batch_id', batchId)
      .order('category_name', { ascending: true })
      .order('sort_order', { ascending: true });

    if (error) {
      this.logger.error(`Failed to fetch curriculum for batch ${batchId}: ${error.message}`);
      throw new InternalServerErrorException('Could not load curriculum.');
    }

    const grouped: Record<string, any[]> = {};
    for (const item of data ?? []) {
      const cat = (item as any).category_name ?? 'General';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(item);
    }

    return Object.entries(grouped).map(([category, items]) => ({
      category,
      items,
    }));
  }

  async findPublished(batchId: string) {
    const { data, error } = await this.supabaseService.client
      .from(TABLES.BATCH_RECORDING_CURRICULUM)
      .select('*, recordings!inner(id, title, description, duration_seconds, status, created_at)')
      .eq('batch_id', batchId)
      .eq('is_published', true)
      .order('category_name', { ascending: true })
      .order('sort_order', { ascending: true });

    if (error) {
      this.logger.error(`Failed to fetch published curriculum for batch ${batchId}: ${error.message}`);
      throw new InternalServerErrorException('Could not load curriculum.');
    }

    const grouped: Record<string, any[]> = {};
    for (const item of data ?? []) {
      const cat = (item as any).category_name ?? 'General';
      if (!grouped[cat]) grouped[cat] = [];
      const rec = (item as any).recordings ?? {};
      grouped[cat].push({
        id: item.id,
        recordingId: item.recording_id,
        title: rec.title,
        description: rec.description,
        durationSeconds: rec.duration_seconds,
        categoryName: item.category_name,
        moduleName: item.module_name,
        sortOrder: item.sort_order,
      });
    }

    return Object.entries(grouped).map(([category, items]) => ({
      category,
      items,
    }));
  }

  async add(batchId: string, dto: AddCurriculumItemDto) {
    const { data, error } = await this.supabaseService.client
      .from(TABLES.BATCH_RECORDING_CURRICULUM)
      .insert({
        batch_id: batchId,
        recording_id: dto.recordingId,
        category_name: dto.categoryName,
        module_name: dto.moduleName ?? null,
        sort_order: dto.sortOrder ?? 0,
        is_published: dto.isPublished ?? true,
      })
      .select('*')
      .single();

    if (error) {
      this.logger.error(`Failed to add curriculum item: ${error.message}`);
      throw new InternalServerErrorException(`Could not add curriculum item: ${error.message}`);
    }
    return data;
  }

  async update(id: string, dto: UpdateCurriculumItemDto) {
    const existing = await this.findById(id);

    const updates: Record<string, any> = {};
    if (dto.categoryName !== undefined) updates.category_name = dto.categoryName;
    if (dto.moduleName !== undefined) updates.module_name = dto.moduleName;
    if (dto.sortOrder !== undefined) updates.sort_order = dto.sortOrder;
    if (dto.isPublished !== undefined) updates.is_published = dto.isPublished;

    const { data, error } = await this.supabaseService.client
      .from(TABLES.BATCH_RECORDING_CURRICULUM)
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      this.logger.error(`Failed to update curriculum item ${id}: ${error.message}`);
      throw new InternalServerErrorException(`Could not update curriculum item: ${error.message}`);
    }
    return data;
  }

  async remove(id: string) {
    await this.findById(id);

    const { error } = await this.supabaseService.client
      .from(TABLES.BATCH_RECORDING_CURRICULUM)
      .delete()
      .eq('id', id);

    if (error) {
      this.logger.error(`Failed to remove curriculum item ${id}: ${error.message}`);
      throw new InternalServerErrorException(`Could not remove curriculum item: ${error.message}`);
    }
    return { deleted: true };
  }

  async reorder(batchId: string, dto: ReorderCurriculumDto) {
    const updates = dto.items.map((item) => ({
      id: item.id,
      sort_order: item.sortOrder,
    }));

    for (const u of updates) {
      const { error } = await this.supabaseService.client
        .from(TABLES.BATCH_RECORDING_CURRICULUM)
        .update({ sort_order: u.sort_order })
        .eq('id', u.id);
      if (error) {
        this.logger.error(`Reorder failed for item ${u.id}: ${error.message}`);
        throw new InternalServerErrorException('Reorder failed.');
      }
    }
    return { reordered: true };
  }

  private async findById(id: string) {
    const { data, error } = await this.supabaseService.client
      .from(TABLES.BATCH_RECORDING_CURRICULUM)
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Curriculum item "${id}" not found.`);
    }
    return data;
  }
}
