/*
 * Auth controller — exposes login, logout, and session-check endpoints
 *
 * Why this controller exists:
 *   - Thin layer between HTTP and AuthService — no business logic here.
 *   - Extracts request metadata (IP, user-agent) and passes it to the service.
 *
 * A junior should know:
 *   - `@Public()` on login means it doesn't need a JWT (obviously — you don't have one yet).
 *   - `@CurrentUser()` reads the user object that JwtAuthGuard attached to the request.
 *   - The `ip` comes from either `req.ip` (Express) or the `x-forwarded-for` header
 *     (when behind a reverse proxy like Nginx).
 */
import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  /**
   * POST /auth/login
   *
   * Authenticate with email + password.
   * Returns a JWT token and basic user info on success.
   *
   * This route is @Public() because you don't have a token yet.
   */
  @Public()
  @Post('login')
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    const ip = (req.ip || req.headers['x-forwarded-for'] || 'unknown') as string;
    const userAgent = (req.headers['user-agent'] || 'unknown') as string;

    return this.authService.login(dto, ip, userAgent);
  }

  /**
   * POST /auth/logout
   *
   * End the current session. The JWT is invalidated by removing the session from Redis.
   * Requires a valid JWT (not @Public).
   */
  @Post('logout')
  async logout(
    @CurrentUser() user: { id: string; sessionId: string },
  ) {
    return this.authService.logout(user.id, user.sessionId);
  }

  /**
   * GET /auth/me
   *
   * Returns the currently authenticated user's session info.
   * The frontend calls this on page load to check "am I still logged in?"
   * If the JWT is expired or the session was invalidated, this returns 401.
   *
   * Requires a valid JWT (not @Public).
   */
  @Get('me')
  getProfile(
    @CurrentUser() user: { id: string; role: string; sessionId: string },
  ) {
    return user;
  }
}
