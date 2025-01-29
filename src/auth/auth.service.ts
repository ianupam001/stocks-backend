import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SmsService } from '../sms/sms.service';
import { UsersService } from '../users/users.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { Roles } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly smsService: SmsService,
    private readonly jwtService: JwtService,
    private readonly userService: UsersService,
  ) {}

  async sendOTP(phone: string): Promise<{ message: string }> {
    const res = await this.smsService.sendOtp(phone);
    return { message: 'OTP sent successfully' };
  }

  async signIn(phone: string, otp: string): Promise<AuthResponseDto> {
    const isValidOtp = await this.smsService.verifyOtp(phone, otp);
    if (!isValidOtp) {
      throw new UnauthorizedException('Invalid OTP');
    }

    let user = await this.userService.findByPhone(phone);
    if (!user) {
      user = await this.userService.create({
        phone,
        name: phone, // Use 'name' instead of 'username' to match Prisma schema
        roles: [Roles.USER], // Use the Roles enum
      });
    }

    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    await this.userService.updateRefreshToken(user.id, refreshToken);

    return {
      accessToken,
      expiresIn: 3600, // 1 hour
      refreshToken,
      refreshExpiresIn: 604800, // 7 days
    };
  }

  async refreshToken(refreshToken: string): Promise<AuthResponseDto> {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.userService.findById(payload.id);

      if (!user || user.refreshToken !== refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const newAccessToken = this.generateAccessToken(user);
      const newRefreshToken = this.generateRefreshToken(user);

      await this.userService.updateRefreshToken(user.id, newRefreshToken);

      return {
        accessToken: newAccessToken,
        expiresIn: 3600,
        refreshToken: newRefreshToken,
        refreshExpiresIn: 604800,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private generateAccessToken(user: any): string {
    return this.jwtService.sign(
      { id: user.id, phone: user.phone, roles: user.roles },
      { expiresIn: '1h' },
    );
  }

  private generateRefreshToken(user: any): string {
    return this.jwtService.sign({ id: user.id }, { expiresIn: '7d' });
  }
}
