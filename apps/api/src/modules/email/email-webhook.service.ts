import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../../common/services/supabase.service';
import { TABLES } from '../../common/constants/tables.constant';

export interface DeliveryEvent {
  id: string;
  email_log_id: string | null;
  event_type: 'delivered' | 'opened' | 'clicked' | 'bounced' | 'complained';
  payload: Record<string, any>;
  created_at: string;
}

@Injectable()
export class EmailWebhookService {
  private readonly logger = new Logger(EmailWebhookService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async handleResendWebhook(payload: any): Promise<void> {
    const type = payload?.type as string | undefined;
    const data = payload?.data as Record<string, any> | undefined;

    if (!type || !data) {
      this.logger.warn('Received invalid Resend webhook payload');
      return;
    }

    const resendMessageId = data?.email_id as string | undefined;
    const recipientEmail = data?.to?.[0] as string | undefined;

    this.logger.log(`Resend webhook: type=${type}, messageId=${resendMessageId}, to=${recipientEmail}`);

    let eventType: 'delivered' | 'opened' | 'clicked' | 'bounced' | 'complained';
    switch (type) {
      case 'email.delivered': eventType = 'delivered'; break;
      case 'email.opened': eventType = 'opened'; break;
      case 'email.clicked': eventType = 'clicked'; break;
      case 'email.bounced': eventType = 'bounced'; break;
      case 'email.complained': eventType = 'complained'; break;
      default:
        this.logger.log(`Unhandled Resend webhook type: ${type}`);
        return;
    }

    let emailLogId: string | null = null;
    if (resendMessageId) {
      const { data: log } = await this.supabaseService.client
        .from(TABLES.EMAIL_LOGS)
        .select('id')
        .eq('provider_message_id', resendMessageId)
        .maybeSingle();

      emailLogId = (log as any)?.id ?? null;
    }

    if (!emailLogId && recipientEmail) {
      const { data: log } = await this.supabaseService.client
        .from(TABLES.EMAIL_LOGS)
        .select('id')
        .eq('recipient_email', recipientEmail)
        .eq('status', 'sent')
        .order('sent_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      emailLogId = (log as any)?.id ?? null;
    }

    // Store delivery event
    const { error } = await this.supabaseService.client
      .from(TABLES.EMAIL_DELIVERY_EVENTS)
      .insert({
        email_log_id: emailLogId,
        event_type: eventType,
        payload: data as any,
      });

    if (error) {
      this.logger.error(`Failed to store delivery event: ${error.message}`);
    }

    // Handle bounce: add to suppression list
    if (eventType === 'bounced' || eventType === 'complained') {
      if (recipientEmail) {
        await this.suppressEmail(recipientEmail, eventType, emailLogId);
      }
    }

    // Update email_log status for bounce/complaint
    if (emailLogId && (eventType === 'bounced' || eventType === 'complained')) {
      await this.supabaseService.client
        .from(TABLES.EMAIL_LOGS)
        .update({
          status: 'failed',
          error_message: `Email ${eventType}: ${(data as any)?.reject_reason ?? 'unknown reason'}`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', emailLogId);
    }
  }

  private async suppressEmail(
    email: string,
    reason: string,
    emailLogId: string | null,
  ): Promise<void> {
    const { error } = await this.supabaseService.client
      .from(TABLES.EMAIL_SUPPRESSIONS)
      .upsert({
        email,
        reason: `email_${reason}`,
        email_log_id: emailLogId,
      }, { onConflict: 'email' });

    if (error) {
      this.logger.error(`Failed to suppress email ${email}: ${error.message}`);
    } else {
      this.logger.warn(`Suppressed email: ${email} (reason: ${reason})`);
    }
  }

  isSuppressed(email: string): Promise<boolean> {
    return this.checkSuppressed(email);
  }

  private async checkSuppressed(email: string): Promise<boolean> {
    const { count, error } = await this.supabaseService.client
      .from(TABLES.EMAIL_SUPPRESSIONS)
      .select('*', { count: 'exact', head: true })
      .eq('email', email);

    if (error) {
      this.logger.error(`Failed to check suppression for ${email}: ${error.message}`);
      return false;
    }

    return (count ?? 0) > 0;
  }

  async getDeliveryEvents(emailLogId: string): Promise<DeliveryEvent[]> {
    const { data, error } = await this.supabaseService.client
      .from(TABLES.EMAIL_DELIVERY_EVENTS)
      .select('*')
      .eq('email_log_id', emailLogId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data ?? []) as DeliveryEvent[];
  }
}
