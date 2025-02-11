import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SmsService } from '../sms/sms.service';
import { UsersService } from '../users/users.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { UserRole } from '@prisma/client';
import { AuthUserResponseDto, RefreshTokenDto } from './dto';
import { ConfigService } from '@nestjs/config';
import { JwtPayload, Tokens } from './types';
import * as bcrypt from 'bcrypt';
import * as speakeasy from 'speakeasy';

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

      // Generate and store TOTP secret
      const secret = speakeasy.generateSecret({
        length: 20,
        name: 'Trend Reversal',
        issuer: 'Trend Reversal',
      });
      await this.userService.updateTotpSecret(user.id, secret.base32);
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

  async verifyTotp(userId: string, token: string): Promise<boolean> {
    const user = await this.userService.findById(userId);
    if (!user || !user.totpSecret) {
      throw new UnauthorizedException('TOTP not enabled');
    }

    return speakeasy.totp.verify({
      secret: user.totpSecret,
      encoding: 'base32',
      token,
    });
  }

  async generateTotpSecret(
    userId: string,
  ): Promise<{ secret: string; qr: string }> {
    const appName = 'Trend Reversal';
    const secret = speakeasy.generateSecret({
      length: 20,
      name: appName,
      issuer: appName,
    });

    await this.userService.updateTotpSecret(userId, secret.base32);

    const otpAuthUrl = `otpauth://totp/${encodeURIComponent(appName)}?secret=${secret.base32}&issuer=${encodeURIComponent(appName)}`;

    return { secret: secret.base32, qr: otpAuthUrl };
  }

  async refreshToken(dto: RefreshTokenDto): Promise<AuthResponseDto> {
    try {
      const { refreshToken } = dto;
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.config.get<string>('RT_SECRET'),
      });

      const user = await this.userService.findById(payload.sub);
      if (!user || !user.refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const isMatch = await bcrypt.compare(refreshToken, user.refreshToken);
      if (!isMatch) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const tokens = await this.getTokens(user.id, user.phone, user.roles);

      await this.userService.updateRefreshToken(user.id, tokens.refresh_token);

      return { tokens };
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
