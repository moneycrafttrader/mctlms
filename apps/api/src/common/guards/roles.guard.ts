/*
 * Role-based access control guard — runs AFTER JwtAuthGuard
 *
 * Why this guard exists:
 *   - Applied globally so any route with a @Roles() decorator is automatically restricted.
 *   - Reads the `requiredRoles` metadata set by @Roles() and compares against the
 *     authenticated user's role.
 *
 * A junior should know:
 *   - Don't add @UseGuards(RolesGuard) — it's already global.
 *   - Use the @Roles() decorator: @Roles('admin') or @Roles('admin', 'teacher').
 *   - If no @Roles() decorator is present, ANY authenticated user can access the route.
 *   - The user object is attached by JwtAuthGuard, so this guard must run after it.
 */
import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRED_ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '../constants/roles.constant';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Read the required roles from the @Roles() decorator on the route handler
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(
      REQUIRED_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // No roles required → allow everyone (but they must be authenticated via JwtAuthGuard)
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      this.logger.warn('RolesGuard called but no user on request — JwtAuthGuard may not have run');
      throw new ForbiddenException('Authentication required');
    }

    // Check if the user's role is in the list of permitted roles
    const hasRole = requiredRoles.some((role) => user.role === role);

    if (!hasRole) {
      throw new ForbiddenException(
        `Access denied. Required role(s): ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
