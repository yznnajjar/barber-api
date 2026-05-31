import { createParamDecorator, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AuthUser } from '../interfaces/jwt-payload.interface';

/**
 * Convenience accessor for the current user's salonId. Throws if the owner
 * has no salon yet, so controllers never have to null-check it.
 *   Usage:  myMethod(@SalonId() salonId: string)
 */
export const SalonId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const user = ctx.switchToHttp().getRequest().user as AuthUser;
    if (!user?.salonId) {
      throw new ForbiddenException('No salon is associated with this account');
    }
    return user.salonId;
  },
);
