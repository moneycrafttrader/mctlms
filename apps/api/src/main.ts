/*
 * Application entry point — bootstraps the NestJS server
 *
 * Why this file exists:
 *   - Creates the Nest application, attaches global middleware (CORS, validation),
 *     and starts listening on the configured port.
 *   - The ValidationPipe is configured to strip unknown properties and transform
 *     payloads so DTOs work correctly.
 *
 * A junior should know:
 *   - `whitelist: true` strips properties not in your DTO — prevents mass-assignment.
 *   - `forbidNonWhitelisted: true` throws an error if extra properties are sent.
 *   - `transform: true` automatically converts strings to numbers/booleans per DTO types.
 *   - Changes to CORS origin are made via the FRONTEND_URL env variable.
 */
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');
  const configService = app.get(ConfigService);

  // ── CORS ────────────────────────────────────────────────────
  // Allow the frontend (Next.js dev server) to call this API
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // ── Global validation pipe ──────────────────────────────────
  // Automatically validates all incoming DTOs using class-validator decorators
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,                // Strip unknown properties
      forbidNonWhitelisted: true,     // Throw error if unknown props sent
      transform: true,                // Auto-transform types (string → number, etc.)
    }),
  );

  // ── Start listening ─────────────────────────────────────────
  const port = configService.get<number>('PORT') ?? 3001;
  await app.listen(port);
  logger.log(`API is running on http://localhost:${port}`);
}
bootstrap();
