import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../../common/services/supabase.service';
import { TABLES } from '../../common/constants/tables.constant';

export const OUTBOX_TABLE = 'outbox_messages';

@Injectable()
export class OutboxService {
  private readonly logger = new Logger(OutboxService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async enqueue(messageType: 'receipt' | 'invoice', payload: Record<string, any>): Promise<void> {
    const { error } = await this.supabaseService.client
      .from(OUTBOX_TABLE)
      .insert({
        message_type: messageType,
        payload,
        status: 'pending',
        retry_count: 0,
        max_retries: 3,
      });

    if (error) {
      this.logger.error(`Failed to enqueue ${messageType} message: ${error.message}`);
    }
  }

  async processPending(batchSize = 10): Promise<number> {
    const { data: messages, error } = await this.supabaseService.client
      .from(OUTBOX_TABLE)
      .select('*')
      .eq('status', 'pending')
      .lte('retry_count', 'max_retries')
      .order('created_at', { ascending: true })
      .limit(batchSize);

    if (error || !messages?.length) return 0;

    let processed = 0;
    for (const msg of messages as any[]) {
      await this.markProcessing(msg.id);

      try {
        if (msg.message_type === 'receipt') {
          const { InvoicesService } = await import('../invoices/invoices.service');
          const invoicesService = new (InvoicesService as any)(
            this.supabaseService,
            null as any,
          );
          await invoicesService.createAndSendReceipt(msg.payload.paymentId);
        } else if (msg.message_type === 'invoice') {
          const { InvoicesService } = await import('../invoices/invoices.service');
          const invoicesService = new (InvoicesService as any)(
            this.supabaseService,
            null as any,
          );
          await invoicesService.createAndSendInvoice(msg.payload.paymentId);
        }

        await this.markCompleted(msg.id);
        processed++;
      } catch (err: any) {
        this.logger.error(`Outbox message ${msg.id} failed: ${err.message}`);
        await this.markFailed(msg.id, err.message);
      }
    }

    return processed;
  }

  private async markProcessing(id: string): Promise<void> {
    await this.supabaseService.client
      .from(OUTBOX_TABLE)
      .update({ status: 'processing' })
      .eq('id', id);
  }

  private async markCompleted(id: string): Promise<void> {
    await this.supabaseService.client
      .from(OUTBOX_TABLE)
      .update({
        status: 'completed',
        processed_at: new Date().toISOString(),
      })
      .eq('id', id);
  }

  private async markFailed(id: string, error: string): Promise<void> {
    const { data: current } = await this.supabaseService.client
      .from(OUTBOX_TABLE)
      .select('retry_count')
      .eq('id', id)
      .single();

    const retryCount = ((current as any)?.retry_count ?? 0) + 1;

    await this.supabaseService.client
      .from(OUTBOX_TABLE)
      .update({
        status: retryCount >= 3 ? 'failed' : 'pending',
        retry_count: retryCount,
        last_error: error,
      })
      .eq('id', id);
  }
}
