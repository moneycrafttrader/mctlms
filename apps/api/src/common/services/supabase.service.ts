/*
 * Supabase client factory — the ONLY place we initialise the SDK
 *
 * Why this file exists:
 *   - Provides two clients: `authClient` (anon key) for Auth API operations,
 *     and `client` (service-role key) for all database operations.
 *   - The service-role key bypasses Row-Level Security because the backend
 *     is a trusted environment. RLS is the safety net for the frontend.
 *   - Singleton — every module that needs Supabase injects this one instance.
 *
 * A junior should know:
 *   - Use `this.supabase.client` for ALL `from('table').select()` queries.
 *   - Use `this.supabase.authClient` ONLY for auth operations like signIn, signUp.
 *   - NEVER call `createClient()` anywhere else.
 */
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService implements OnModuleInit {
  // Service-role client — bypasses RLS, used for all database queries
  public client!: SupabaseClient;

  // Anon-key client — used only for Auth API operations (signIn, signUp, etc.)
  public authClient!: SupabaseClient;

  constructor(private readonly configService: ConfigService) {}

  /** Called automatically by NestJS after the constructor — safe to use ConfigService here */
  onModuleInit() {
    const url = this.configService.get<string>('SUPABASE_URL')!;
    const serviceRoleKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = this.configService.get<string>('SUPABASE_ANON_KEY')!;

    if (!url || !serviceRoleKey || !anonKey) {
      throw new Error(
        'SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and SUPABASE_ANON_KEY must be set in environment variables',
      );
    }

    this.client = createClient(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    this.authClient = createClient(url, anonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
}
