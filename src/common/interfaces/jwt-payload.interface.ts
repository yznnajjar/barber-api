import { Role } from '@prisma/client';

/** Shape of the data we sign into every access token. */
export interface JwtPayload {
  sub: string;      // user id
  email: string;
  role: Role;
  salonId: string | null;
}

/** The authenticated user object attached to `request.user` after JwtAuthGuard. */
export interface AuthUser {
  userId: string;
  email: string;
  role: Role;
  salonId: string | null;
}
