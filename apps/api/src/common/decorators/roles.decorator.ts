/*
 * @Roles() route decorator
 *
 * Why this decorator exists:
 *   - Restricts route access to specific user roles (admin, teacher, student).
 *   - Used together with RolesGuard (applied globally) which reads this metadata.
 *
 * A junior should know:
 *   - Place after @Public() or directly on the method: @Roles('admin')
 *   - Can pass multiple roles: @Roles('admin', 'teacher')
 *   - If no @Roles() is present, the route allows any authenticated user.
 */
import { SetMetadata } from '@nestjs/common';
import { Role } from '../constants/roles.constant';

export const REQUIRED_ROLES_KEY = 'requiredRoles';
export const Roles = (...roles: Role[]) => SetMetadata(REQUIRED_ROLES_KEY, roles);
