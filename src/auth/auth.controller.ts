import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  AdminSignDto,
  AuthUserResponseDto,
  AuthUserResponseWithTotp,
  RefreshTokenDto,
  SendOtpDto,
  SignInDto,
  TOTPVerifyDto,
} from './dto';
import { AuthService } from './auth.service';
import { GetCurrentUserId, Public, Roles } from 'src/common/decorators';
import { UserRole } from '@prisma/client';
import { Request } from 'express';

@ApiBearerAuth()
@ApiTags('Auth')
@Controller({
  path: 'auth',
  version: '1',
})
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('admin-sign-in')
  async adminLogin(@Body() dto: AdminSignDto) {
    return this.authService.adminLogin(dto.email, dto.password);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('send-otp')
  sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOTP(dto.phone);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('sign-in')
  async signIn(
    @Body() dto: SignInDto,
    @Req() req: Request,
  ): Promise<AuthUserResponseWithTotp | AuthUserResponseDto> {
    return this.authService.signIn(dto.phone, req, dto.otp);
  }

  @Post('refresh-token')
  @Roles(UserRole.ADMIN, UserRole.USER)
  @HttpCode(HttpStatus.OK)
  refreshToken(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto);
  }

  @Public()
  @Post('totp/generate/:userId')
  @Roles(UserRole.USER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  generateTotp(@Param('userId') userId: string) {
    return this.authService.generateTotpSecret(userId);
  }

  @Public()
  @Post('totp/verify/:userId')
  @Roles(UserRole.USER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async verifyTotp(
    @Param('userId') userId: string,
    @Body() dto: TOTPVerifyDto,
    @Req() req: Request,
  ): Promise<AuthUserResponseDto> {
    return this.authService.verifyTotp(userId, dto.token, req);
  }

  @Post('logout')
  @Roles(UserRole.ADMIN, UserRole.USER)
  @HttpCode(HttpStatus.OK)
  logout(@GetCurrentUserId() userId: string) {
    return this.authService.logout(userId);
  }
}
