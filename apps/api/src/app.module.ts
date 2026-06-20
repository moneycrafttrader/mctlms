/*
 * Root module of the NestJS API
 *
 * Why this module exists:
 *   - Ties together every feature module, global provider, and third-party module.
 *   - ConfigModule reads .env so every service has access to environment variables.
 *   - JwtModule is global — no need to import it in child modules.
 *   - Guards, filters, and interceptors registered here apply to EVERY route.
 *
 * A junior should know:
 *   - Adding a new feature? Create its module and add it to the `imports` array.
 *   - Need a new global provider? Add it to the `providers` array.
 *   - The order of imports generally doesn't matter, but feature modules are listed
 *     alphabetically for readability.
 */
import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { RedisModule } from '@liaoliaots/nestjs-redis';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';

// ── Feature modules ──────────────────────────────────────────
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CoursesModule } from './modules/courses/courses.module';
import { BatchesModule } from './modules/batches/batches.module';
import { LiveSessionsModule } from './modules/live-sessions/live-sessions.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { VideosModule } from './modules/videos/videos.module';
import { EmailModule } from './modules/email/email.module';
import { TestsModule } from './modules/tests/tests.module';
import { ZoomModule } from './modules/zoom/zoom.module';
import { MuxModule } from './modules/mux/mux.module';
import { BulkUploadModule } from './modules/bulk-upload/bulk-upload.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { BusinessConfigModule } from './modules/business-config/business-config.module';
import { InvoicesModule } from './modules/invoices/invoices.module';

// ── Common providers ─────────────────────────────────────────
import { SupabaseService } from './common/services/supabase.service';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseTransformInterceptor } from './common/interceptors/response-transform.interceptor';

// ── Jobs ─────────────────────────────────────────────────────
import { RecordingUploadJob } from './jobs/recording-upload.job';

@Global()
@Module({
  imports: [
    // ── Config ────────────────────────────────────────────────
    // Makes ConfigService available everywhere without importing ConfigModule
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),

    // ── JWT ───────────────────────────────────────────────────
    // Global so every service can inject JwtService directly
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: config.get<string>('JWT_EXPIRES_IN') ?? '24h',
        },
      }),
    }),

    // ── Redis ─────────────────────────────────────────────────
    // Used for session storage, caching, and rate-limiting
    RedisModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        config: {
          host: config.get<string>('REDIS_HOST') ?? '127.0.0.1',
          port: config.get<number>('REDIS_PORT') ?? 6379,
          password: config.get<string>('REDIS_PASSWORD'),
          tls: config.get<string>('REDIS_PASSWORD') ? {} : undefined,
        },
      }),
    }),

    // ── Scheduling ────────────────────────────────────────────
    // Enables @Cron() decorators used in jobs (e.g. recording upload pipeline)
    ScheduleModule.forRoot(),

    // ── Feature modules ───────────────────────────────────────
    AuthModule,
    UsersModule,
    CoursesModule,
    BatchesModule,
    LiveSessionsModule,
    AttendanceModule,
    VideosModule,
    EmailModule,
    TestsModule,
    ZoomModule,
    MuxModule,
    BulkUploadModule,
    PaymentsModule,
    InvoicesModule,
    BusinessConfigModule,
    AnalyticsModule,
  ],
  exports: [
    SupabaseService,
  ],
  providers: [
    // ── Singleton services ────────────────────────────────────
    SupabaseService,
    RecordingUploadJob,

    // ── Global guards ─────────────────────────────────────────
    // Order matters: JwtAuthGuard runs first, then RolesGuard
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },

    // ── Global filter ─────────────────────────────────────────
    // Catches every HttpException and returns a consistent shape
    { provide: APP_FILTER, useClass: HttpExceptionFilter },

    // ── Global interceptor ────────────────────────────────────
    // Wraps every successful response in { success, data, timestamp }
    { provide: APP_INTERCEPTOR, useClass: ResponseTransformInterceptor },
  ],
})
export class AppModule {}
