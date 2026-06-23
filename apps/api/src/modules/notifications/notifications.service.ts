import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { SupabaseService } from '../../common/services/supabase.service';
import { ObservabilityService } from '../observability/observability.service';
import { TABLES } from '../../common/constants/tables.constant';
import { logEntityEvent } from '../../common/utils/observability-helper';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly observabilityService: ObservabilityService,
  ) {}

  async createAnnouncement(dto: CreateAnnouncementDto, actorId: string) {
    if (dto.targetType !== 'all' && !dto.targetId) {
      throw new BadRequestException('targetId is required when targetType is course or batch.');
    }

    const payload: Record<string, any> = {
      title: dto.title,
      message: dto.message,
      target_type: dto.targetType,
      target_id: dto.targetId ?? null,
      is_published: dto.isPublished ?? false,
      created_by: actorId,
    };

    const { data, error } = await this.supabaseService.client
      .from(TABLES.ANNOUNCEMENTS)
      .insert(payload)
      .select('*')
      .single();

    if (error) {
      this.logger.error(`Failed to create announcement: ${error.message}`);
      throw new InternalServerErrorException(`Could not create announcement: ${error.message}`);
    }

    if (dto.isPublished) {
      await this.sendAnnouncementNotifications(data.id).catch((err) => {
        this.logger.error(`Failed to send notifications for announcement ${data.id}: ${err.message}`);
      });
      logEntityEvent(
        this.observabilityService,
        'ANNOUNCEMENT_PUBLISHED',
        'announcement',
        data.id,
        actorId,
        { title: dto.title, targetType: dto.targetType, targetId: dto.targetId },
      ).catch(() => {});
    }

    return data;
  }

  async sendAnnouncementNotifications(announcementId: string) {
    const { data: announcement, error: fetchErr } = await this.supabaseService.client
      .from(TABLES.ANNOUNCEMENTS)
      .select('*')
      .eq('id', announcementId)
      .single();

    if (fetchErr || !announcement) {
      throw new NotFoundException(`Announcement "${announcementId}" not found.`);
    }

    let studentIds: string[] = [];

    if (announcement.target_type === 'all') {
      const { data: students, error } = await this.supabaseService.client
        .from(TABLES.PROFILES)
        .select('id')
        .eq('role', 'student')
        .eq('is_active', true);

      if (error) {
        this.logger.error(`Failed to fetch all students: ${error.message}`);
        throw new InternalServerErrorException('Could not fetch target students.');
      }
      studentIds = (students ?? []).map((s: any) => s.id);
    } else if (announcement.target_type === 'course') {
      const courseId = announcement.target_id;
      if (!courseId) {
        throw new BadRequestException('Announcement is missing target_id for course target.');
      }

      const { data: batches, error: batchErr } = await this.supabaseService.client
        .from(TABLES.BATCHES)
        .select('id')
        .eq('course_id', courseId);

      if (batchErr) {
        this.logger.error(`Failed to fetch batches for course ${courseId}: ${batchErr.message}`);
        throw new InternalServerErrorException('Could not fetch course batches.');
      }

      const batchIds = (batches ?? []).map((b: any) => b.id);
      if (batchIds.length === 0) return;

      const { data: enrolments, error: enrolErr } = await this.supabaseService.client
        .from(TABLES.BATCH_STUDENTS)
        .select('user_id')
        .in('batch_id', batchIds);

      if (enrolErr) {
        this.logger.error(`Failed to fetch batch students: ${enrolErr.message}`);
        throw new InternalServerErrorException('Could not fetch target students.');
      }
      studentIds = [...new Set((enrolments ?? []).map((e: any) => e.user_id))];
    } else if (announcement.target_type === 'batch') {
      const batchId = announcement.target_id;
      if (!batchId) {
        throw new BadRequestException('Announcement is missing target_id for batch target.');
      }

      const { data: enrolments, error: enrolErr } = await this.supabaseService.client
        .from(TABLES.BATCH_STUDENTS)
        .select('user_id')
        .eq('batch_id', batchId);

      if (enrolErr) {
        this.logger.error(`Failed to fetch batch students for batch ${batchId}: ${enrolErr.message}`);
        throw new InternalServerErrorException('Could not fetch target students.');
      }
      studentIds = (enrolments ?? []).map((e: any) => e.user_id);
    }

    if (studentIds.length === 0) {
      this.logger.warn(`No target students found for announcement ${announcementId}`);
      return;
    }

    const notificationRows = studentIds.map((userId) => ({
      user_id: userId,
      announcement_id: announcementId,
      title: announcement.title,
      message: announcement.message,
    }));

    const { error: insertErr } = await this.supabaseService.client
      .from(TABLES.NOTIFICATIONS)
      .insert(notificationRows);

    if (insertErr) {
      this.logger.error(`Failed to bulk insert notifications: ${insertErr.message}`);
      throw new InternalServerErrorException('Could not send notifications.');
    }
  }

  async updateAnnouncement(id: string, dto: UpdateAnnouncementDto) {
    const { data: existing, error: fetchErr } = await this.supabaseService.client
      .from(TABLES.ANNOUNCEMENTS)
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !existing) {
      throw new NotFoundException(`Announcement "${id}" not found.`);
    }

    if (dto.targetType && dto.targetType !== 'all' && !dto.targetId && !existing.target_id) {
      throw new BadRequestException('targetId is required when targetType is course or batch.');
    }

    const updates: Record<string, any> = {};
    if (dto.title !== undefined) updates.title = dto.title;
    if (dto.message !== undefined) updates.message = dto.message;
    if (dto.targetType !== undefined) updates.target_type = dto.targetType;
    if (dto.targetId !== undefined) updates.target_id = dto.targetId;
    if (dto.isPublished !== undefined) updates.is_published = dto.isPublished;

    const { data, error } = await this.supabaseService.client
      .from(TABLES.ANNOUNCEMENTS)
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      this.logger.error(`Failed to update announcement ${id}: ${error.message}`);
      throw new InternalServerErrorException(`Could not update announcement: ${error.message}`);
    }

    const wasPublished = existing.is_published === true;
    const nowPublished = data.is_published === true;
    if (!wasPublished && nowPublished) {
      await this.sendAnnouncementNotifications(data.id).catch((err) => {
        this.logger.error(`Failed to send notifications for updated announcement ${data.id}: ${err.message}`);
      });
      logEntityEvent(
        this.observabilityService,
        'ANNOUNCEMENT_PUBLISHED',
        'announcement',
        id,
        'system',
        { title: dto.title, targetType: dto.targetType, targetId: dto.targetId },
      ).catch(() => {});
    }

    return data;
  }

  async getAnnouncements() {
    const { data, error } = await this.supabaseService.client
      .from(TABLES.ANNOUNCEMENTS)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      this.logger.error(`Failed to fetch announcements: ${error.message}`);
      throw new InternalServerErrorException('Could not load announcements.');
    }

    return data ?? [];
  }

  async getMyNotifications(userId: string) {
    const { data, error } = await this.supabaseService.client
      .from(TABLES.NOTIFICATIONS)
      .select(
        `*,
         read: ${TABLES.NOTIFICATION_READS}(
           read_at
         )`,
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      this.logger.error(`Failed to fetch notifications for user ${userId}: ${error.message}`);
      throw new InternalServerErrorException('Could not load notifications.');
    }

    return (data ?? []).map((n: any) => ({
      ...n,
      isRead: n.read && n.read.length > 0,
      readAt: n.read?.[0]?.read_at ?? null,
      read: undefined,
    }));
  }

  async getUnreadCount(userId: string) {
    const { data: notificationIds, error: notifErr } = await this.supabaseService.client
      .from(TABLES.NOTIFICATIONS)
      .select('id')
      .eq('user_id', userId);

    if (notifErr) {
      this.logger.error(`Failed to fetch notifications for unread count: ${notifErr.message}`);
      throw new InternalServerErrorException('Could not compute unread count.');
    }

    const ids = (notificationIds ?? []).map((n: any) => n.id);

    if (ids.length === 0) return { unreadCount: 0 };

    const { count, error: readErr } = await this.supabaseService.client
      .from(TABLES.NOTIFICATION_READS)
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .in('notification_id', ids);

    if (readErr) {
      this.logger.error(`Failed to count read notifications: ${readErr.message}`);
      throw new InternalServerErrorException('Could not compute unread count.');
    }

    return { unreadCount: ids.length - (count ?? 0) };
  }

  async markAsRead(userId: string, notificationId: string) {
    const { data: existing } = await this.supabaseService.client
      .from(TABLES.NOTIFICATION_READS)
      .select('id')
      .eq('user_id', userId)
      .eq('notification_id', notificationId)
      .maybeSingle();

    if (existing) return { success: true };

    const { error } = await this.supabaseService.client
      .from(TABLES.NOTIFICATION_READS)
      .insert({
        user_id: userId,
        notification_id: notificationId,
        read_at: new Date().toISOString(),
      });

    if (error) {
      this.logger.error(`Failed to mark notification ${notificationId} as read: ${error.message}`);
      throw new InternalServerErrorException('Could not mark notification as read.');
    }

    return { success: true };
  }

  async markAllAsRead(userId: string) {
    const { data: notifications, error: notifErr } = await this.supabaseService.client
      .from(TABLES.NOTIFICATIONS)
      .select('id')
      .eq('user_id', userId);

    if (notifErr) {
      this.logger.error(`Failed to fetch notifications for mark-all-read: ${notifErr.message}`);
      throw new InternalServerErrorException('Could not fetch notifications.');
    }

    const allIds = (notifications ?? []).map((n: any) => n.id);
    if (allIds.length === 0) return { success: true, markedCount: 0 };

    const { data: readRecords, error: readErr } = await this.supabaseService.client
      .from(TABLES.NOTIFICATION_READS)
      .select('notification_id')
      .eq('user_id', userId)
      .in('notification_id', allIds);

    if (readErr) {
      this.logger.error(`Failed to fetch read records: ${readErr.message}`);
      throw new InternalServerErrorException('Could not check read status.');
    }

    const readIds = new Set((readRecords ?? []).map((r: any) => r.notification_id));
    const unreadIds = allIds.filter((id) => !readIds.has(id));

    if (unreadIds.length === 0) return { success: true, markedCount: 0 };

    const now = new Date().toISOString();
    const rows = unreadIds.map((notificationId) => ({
      user_id: userId,
      notification_id: notificationId,
      read_at: now,
    }));

    const { error: insertErr } = await this.supabaseService.client
      .from(TABLES.NOTIFICATION_READS)
      .insert(rows);

    if (insertErr) {
      this.logger.error(`Failed to bulk mark notifications as read: ${insertErr.message}`);
      throw new InternalServerErrorException('Could not mark notifications as read.');
    }

    return { success: true, markedCount: unreadIds.length };
  }
}
