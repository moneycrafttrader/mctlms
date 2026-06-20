/*
 * Auth module — wires together the auth controller and service
 *
 * Why this module exists:
 *   - Follows NestJS convention: every feature gets its own module.
 *   - Exports AuthService so JwtAuthGuard (in common/) can inject it for session validation.
 *   - JwtModule and RedisModule are already global (registered in AppModule), so they
 *     don't need to be imported again here.
 *
 * A junior should know:
 *   - Adding a new provider? Put it in the `providers` array.
 *   - If another module needs AuthService, add it to `exports`.
 */
import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
