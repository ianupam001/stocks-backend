import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SmsService } from '../sms/sms.service';
import { UsersService } from '../users/users.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { UserRole } from '@prisma/client';
import { AuthUserResponseDto, RefreshTokenDto } from './dto';
import { ConfigService } from '@nestjs/config';
import { JwtPayload, Tokens } from './types';

@Injectable()
export class AuthService {
  constructor(
    private config: ConfigService,
    private readonly smsService: SmsService,
    private readonly jwtService: JwtService,
    private readonly userService: UsersService,
  ) {}

  async sendOTP(phone: string): Promise<{ message: string }> {
    const res = await this.smsService.sendOtp(phone);
    return { message: 'OTP sent successfully' };
  }

  async signIn(phone: string, otp: string): Promise<AuthUserResponseDto> {
    const isValidOtp = await this.smsService.verifyOtp(phone, otp);
    if (!isValidOtp) {
      throw new UnauthorizedException('Invalid OTP');
    }

    let user = await this.userService.findByPhone(phone);
    if (!user) {
      user = await this.userService.create({
        phone,
        roles: [UserRole.USER],
      });
    }

    const tokens = await this.getTokens(user.id, user.phone, user.roles);

    await this.userService.updateRefreshToken(user.id, tokens.refresh_token);

    return {
      user: {
        id: user.id,
        phone: user.phone,
        roles: user.roles,
      },
      tokens,
    };
  }

  async refreshToken(dto: RefreshTokenDto): Promise<AuthResponseDto> {
    try {
      const { refreshToken } = dto;
      console.log(refreshToken);
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.config.get<string>('RT_SECRET'),
      });
      const user = await this.userService.findById(payload.id);
      if (!user || user.refreshToken !== refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const tokens = await this.getTokens(user.id, user.phone, user.roles);

      await this.userService.updateRefreshToken(user.id, tokens.refresh_token);

      return {
        tokens,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async getTokens(
    userId: string,
    identification: string,
    role: UserRole[] = [UserRole.USER],
  ): Promise<Tokens> {
    const jwtPayload: JwtPayload = {
      sub: userId,
      identification: identification,
      role: role,
    };
    const [at, rt] = await Promise.all([
      this.jwtService.signAsync(jwtPayload, {
        secret: this.config.get<string>('AT_SECRET'),
        expiresIn: 60 * 60 * 24 * 7,
      }),
      this.jwtService.signAsync(jwtPayload, {
        secret: this.config.get<string>('RT_SECRET'),
        expiresIn: 60 * 60 * 24 * 7,
      }),
    ]);

    return {
      access_token: at,
      refresh_token: rt,
    };
  }
}
