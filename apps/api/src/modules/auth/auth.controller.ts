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
  Res,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
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
  async login(@Body() dto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const ip = (req.ip || req.headers['x-forwarded-for'] || 'unknown') as string;
    const userAgent = (req.headers['user-agent'] || 'unknown') as string;

    const result = await this.authService.login(dto, ip, userAgent);

    res.cookie('access_token', result.token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000,
    });

    return result;
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

  /**
   * POST /auth/change-password
   *
   * Set a permanent password after first login with a temp password.
   * Requires a valid JWT (the user is logged in with their temp password).
   * On success, must_change_password is cleared and the user must log in again.
   */
  @Post('change-password')
  async changePassword(
    @CurrentUser() user: { id: string },
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(
      user.id,
      dto.newPassword,
      dto.confirmPassword,
    );
  }

  /**
   * POST /auth/forgot-password
   *
   * Sends a Supabase password reset email.
   * Public — no auth required.
   * Always returns 200 to avoid email enumeration.
   */
  @Public()
  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }
}
