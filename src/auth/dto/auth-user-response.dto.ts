import { Roles } from '@prisma/client';
export class AuthUserResponseDto {
  user: {
    id: string;
    phone: string;
    roles: Roles[];
  };
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
  refreshExpiresIn: number;
}
