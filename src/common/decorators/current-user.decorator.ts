import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserPayload } from '../../auth/interfaces/user.interface';

export interface AuthenticatedUser extends UserPayload {
  id?: string;
}

/**
 * Custom decorator to extract the authenticated user from the Request.
 *
 * Examples:
 *   @CurrentUser() user: AuthenticatedUser
 *   @CurrentUser('sub') userId: string
 *   @CurrentUser('id') userId: string
 */
export const CurrentUser = createParamDecorator(
  (data: keyof UserPayload | 'id' | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return null;
    }

    if (data === 'id' || data === 'sub') {
      return user.sub ?? user.id;
    }

    return data ? user[data] : user;
  },
);
