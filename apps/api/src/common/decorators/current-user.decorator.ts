/*
 * @CurrentUser() parameter decorator
 *
 * Why this decorator exists:
 *   - Extracts the authenticated user from `request.user` (set by JwtAuthGuard).
 *   - Avoids reaching into `@Req() req` and manually reading `req.user` in every controller.
 *
 * A junior should know:
 *   - Use in controller methods: getProfile(@CurrentUser() user: { id: string, role: string })
 *   - Works because JwtAuthGuard attaches `{ id, role, sessionId }` to request.user.
 *   - If the route is @Public(), user will be undefined — guard accordingly.
 */
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
