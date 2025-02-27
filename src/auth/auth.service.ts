import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
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
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private config: ConfigService,
    private readonly smsService: SmsService,
    private readonly jwtService: JwtService,
    private readonly userService: UsersService,
    private readonly prisma: PrismaService,
  ) {}

  async sendOTP(phone: string): Promise<{
    message: string;
    data?: { requiresTotp: boolean; userId: string };
  }> {
    let user = await this.userService.findByPhone(phone);
    console.log('user', user);
    if (user) {
      if (user.isTwoFAEnabled) {
        return {
          message: 'User already exists and 2FA is enabled',
          data: { requiresTotp: true, userId: user.id },
        };
      }

      await this.smsService.sendOtp(phone);
      return { message: 'OTP sent successfully' };
    }

    try {
      user = await this.prisma.user.create({
        data: { phone },
      });

      await this.smsService.sendOtp(phone);
      return { message: 'OTP sent successfully' };
    } catch (error) {
      if (error.code === 'P2002') {
        throw new BadRequestException('Phone number is already in use.');
      }
      throw new InternalServerErrorException('Could not create user.');
    }
  }

  async signIn(
    phone: string,
    req: Request,
    otp?: string,
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
      message: 'User logged in successfully',
      user,
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
      message: 'User logged in successfully',
      user,
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

  async logout(userId: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new UnauthorizedException('User not found.');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        refreshToken: null,
        currentIp: null,
        currentSessionId: null,
      },
    });

    return { message: 'Logged out successfully' };
  }
  // hepler functions
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
        expiresIn: '30d',
      }),
    ]);

    return {
      access_token: at,
      refresh_token: rt,
    };
  }
}
