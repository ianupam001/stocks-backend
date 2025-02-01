import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  AuthResponseDto,
  AuthUserResponseDto,
  RefreshTokenDto,
  SendOtpDto,
  SignInDto,
} from './dto';
import { AuthService } from './auth.service';
import { Public, Roles } from 'src/common/decorators';
import { UserRole } from '@prisma/client';

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
  @Post('send-otp')
  sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOTP(dto.phone);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('sign-in')
  signIn(@Body() dto: SignInDto): Promise<AuthUserResponseDto> {
    return this.authService.signIn(dto.phone, dto.otp);
  }

  @Post('refresh-token')
  @Roles(UserRole.ADMIN, UserRole.USER)
  @HttpCode(HttpStatus.OK)
  refreshToken(@Body() dto: RefreshTokenDto): Promise<AuthResponseDto> {
    return this.authService.refreshToken(dto);
  }
}
