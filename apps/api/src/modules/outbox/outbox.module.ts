import { Module } from '@nestjs/common';
import { SupabaseService } from '../../common/services/supabase.service';
import { OutboxService } from './outbox.service';

@Module({
  providers: [OutboxService, SupabaseService],
  exports: [OutboxService],
})
export class OutboxModule {}
