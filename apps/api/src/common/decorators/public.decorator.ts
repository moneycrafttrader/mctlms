/*
 * @Public() route decorator
 *
 * Why this decorator exists:
 *   - By default every route requires JWT authentication (JwtAuthGuard is global).
 *   - Mark any route with @Public() to skip authentication (e.g. login, register, webhooks).
 *
 * A junior should know:
 *   - Import and place above the method: @Public() @Post('login')
 *   - The JwtAuthGuard reads this metadata via the Reflector to decide whether to skip.
 */
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
