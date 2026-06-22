import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../common/services/supabase.service';
import { TABLES } from '../../common/constants/tables.constant';

export interface EmailTemplateRecord {
  id: string;
  name: string;
  subject: string;
  html_template: string | null;
  is_active: boolean;
  version: number;
  created_at: string;
  updated_at: string;
}

@Injectable()
export class EmailTemplatesService {
  private readonly logger = new Logger(EmailTemplatesService.name);
  private templatesCache: Map<string, EmailTemplateRecord> | null = null;
  private cacheTime = 0;
  private readonly CACHE_TTL = 300_000; // 5 minutes

  constructor(private readonly supabaseService: SupabaseService) {}

  async findAll(): Promise<EmailTemplateRecord[]> {
    const { data, error } = await this.supabaseService.client
      .from(TABLES.EMAIL_TEMPLATES)
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return (data ?? []) as EmailTemplateRecord[];
  }

  async findByName(name: string): Promise<EmailTemplateRecord | null> {
    const cache = await this.getCache();
    if (cache.has(name)) return cache.get(name) ?? null;

    const { data, error } = await this.supabaseService.client
      .from(TABLES.EMAIL_TEMPLATES)
      .select('*')
      .eq('name', name)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      this.logger.error(`Failed to fetch template ${name}: ${error.message}`);
      return null;
    }

    return data as EmailTemplateRecord | null;
  }

  async upsertTemplate(dto: {
    name: string;
    subject: string;
    htmlTemplate?: string;
    isActive?: boolean;
  }): Promise<EmailTemplateRecord> {
    const { data: existing } = await this.supabaseService.client
      .from(TABLES.EMAIL_TEMPLATES)
      .select('id, version')
      .eq('name', dto.name)
      .maybeSingle();

    if (existing) {
      const newVersion = ((existing as any).version ?? 0) + 1;
      const { data, error } = await this.supabaseService.client
        .from(TABLES.EMAIL_TEMPLATES)
        .update({
          subject: dto.subject,
          html_template: dto.htmlTemplate ?? null,
          is_active: dto.isActive ?? true,
          version: newVersion,
          updated_at: new Date().toISOString(),
        })
        .eq('id', (existing as any).id)
        .select('*')
        .single();

      if (error) throw error;
      this.invalidateCache();
      return data as EmailTemplateRecord;
    } else {
      const { data, error } = await this.supabaseService.client
        .from(TABLES.EMAIL_TEMPLATES)
        .insert({
          name: dto.name,
          subject: dto.subject,
          html_template: dto.htmlTemplate ?? null,
          is_active: dto.isActive ?? true,
          version: 1,
        })
        .select('*')
        .single();

      if (error) throw error;
      this.invalidateCache();
      return data as EmailTemplateRecord;
    }
  }

  async toggleActive(name: string, isActive: boolean): Promise<void> {
    const { error } = await this.supabaseService.client
      .from(TABLES.EMAIL_TEMPLATES)
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('name', name);

    if (error) throw error;
    this.invalidateCache();
  }

  async deleteTemplate(name: string): Promise<void> {
    const { error } = await this.supabaseService.client
      .from(TABLES.EMAIL_TEMPLATES)
      .delete()
      .eq('name', name);

    if (error) throw error;
    this.invalidateCache();
  }

  async getActiveTemplates(): Promise<Map<string, EmailTemplateRecord>> {
    return this.getCache();
  }

  private invalidateCache(): void {
    this.templatesCache = null;
    this.cacheTime = 0;
  }

  private async getCache(): Promise<Map<string, EmailTemplateRecord>> {
    const now = Date.now();
    if (this.templatesCache && now - this.cacheTime < this.CACHE_TTL) {
      return this.templatesCache;
    }

    const { data, error } = await this.supabaseService.client
      .from(TABLES.EMAIL_TEMPLATES)
      .select('*')
      .eq('is_active', true);

    if (error) {
      this.logger.error(`Failed to load templates cache: ${error.message}`);
      return this.templatesCache ?? new Map();
    }

    this.templatesCache = new Map<string, EmailTemplateRecord>();
    for (const row of (data ?? [])) {
      const t = row as EmailTemplateRecord;
      this.templatesCache.set(t.name, t);
    }
    this.cacheTime = now;
    return this.templatesCache;
  }
}
