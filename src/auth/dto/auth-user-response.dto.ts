import { UserRole } from '@prisma/client';
import { Tokens } from '../types';
export class AuthUserResponseDto {
  user: {
    id: string;
    phone: string;
    roles: UserRole[];
  };
  tokens:Tokens
}
