import { User, UserRole } from '@prisma/client';
import { Tokens } from '../types';

export class AuthUserResponseDto {
  user: User;
  tokens: Tokens;
  message: string;
}

export class AuthUserResponseWithTotp {
  requiresTotp: boolean;
  userId: string;
}
