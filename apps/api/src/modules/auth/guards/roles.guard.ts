import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@mangosteen/database';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(executionContext: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      executionContext.getHandler(),
      executionContext.getClass(),
    ]);
    if (!requiredRoles) {
      return true;
    }

    const request = executionContext.switchToHttp().getRequest();
    const user = request.user;
    if (!user || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException({
        success: false,
        error: {
          code: 'AUTH_FORBIDDEN',
          message: 'Authenticated user lacks required role/permissions.',
          details: [`Required: ${requiredRoles.join(', ')}. Got: ${user?.role || 'NONE'}.`],
        },
      });
    }

    return true;
  }
}
