import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SmsService } from '../sms/sms.service';
import { UsersService } from '../users/users.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { UserRole } from '@prisma/client';
import {
  AuthUserResponseDto,
  AuthUserResponseWithTotp,
  RefreshTokenDto,
} from './dto';
import { ConfigService } from '@nestjs/config';
import { JwtPayload, Tokens } from './types';
import * as bcrypt from 'bcrypt';
import * as speakeasy from 'speakeasy';
import { Request } from 'express';

@Injectable()
export class AuthService {
  constructor(
    private config: ConfigService,
    private readonly smsService: SmsService,
    private readonly jwtService: JwtService,
    private readonly userService: UsersService,
  ) {}

  async sendOTP(phone: string): Promise<{ message: string }> {
    const user = await this.userService.findByPhone(phone);

    if (user && user.isTwoFAEnabled) {
      throw new UnauthorizedException(
        'TOTP is enabled. Please use authenticator.',
      );
    }
    await this.smsService.sendOtp(phone);
    return { message: 'OTP sent successfully' };
  }

  async signIn(
    phone: string,
    otp?: string,
    req?: Request,
  ): Promise<AuthUserResponseWithTotp | AuthUserResponseDto> {
    const user = await this.userService.findByPhone(phone);
    if (!user) {
      throw new UnauthorizedException('User not found.');
    }

    if (!req) {
      throw new NotFoundException('No IP is found in request');
    }
    
    const clientIp = req.ip;

    if (!clientIp) {
      throw new NotFoundException('Client Ip is required');
    }
    const existingSession = await this.userService.findByIp(clientIp);

    if (existingSession && existingSession.id !== user.id) {
      throw new UnauthorizedException('This IP address is already in use.');
    }

    if (user.isTwoFAEnabled) {
      return { requiresTotp: true, userId: user.id };
    }

    if (!otp) {
      throw new UnauthorizedException('OTP is required for login.');
    }

    const isValidOtp = await this.smsService.verifyOtp(phone, otp);
    if (!isValidOtp) {
      throw new UnauthorizedException('Invalid OTP');
    }

    // Generate tokens and update session info
    const tokens = await this.getTokens(user.id, user.phone, user.roles);
    await this.userService.updateRefreshToken(user.id, tokens.refresh_token);

    await this.userService.updateSession(
      user.id,
      clientIp,
      tokens.access_token,
    );

    return {
      user: {
        id: user.id,
        phone: user.phone,
        roles: user.roles,
      },
      tokens,
    };
  }

  async verifyTotp(
    userId: string,
    token: string,
  ): Promise<AuthUserResponseDto> {
    const user = await this.userService.findById(userId);
    if (!user || !user.totpSecret) {
      throw new UnauthorizedException('TOTP not enabled');
    }

    const isValid = speakeasy.totp.verify({
      secret: user.totpSecret,
      encoding: 'base32',
      token,
    });

    if (!isValid) {
      throw new UnauthorizedException('Invalid TOTP token');
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
    await this.userService.enableTwoFA(userId); // Mark user as TOTP-enabled

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
        expiresIn: '7d',
      }),
      this.jwtService.signAsync(jwtPayload, {
        secret: this.config.get<string>('RT_SECRET'),
        expiresIn: '7d',
      }),
    ]);

    return {
      access_token: at,
      refresh_token: rt,
    };
  }
}
