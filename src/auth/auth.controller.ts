import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  AuthResponseDto,
  AuthUserResponseDto,
  RefreshTokenDto,
  SendOtpDto,
  SignInDto,
  TOTPVerifyDto,
} from './dto';
import { AuthService } from './auth.service';
import { GetCurrentUserId, Public, Roles } from 'src/common/decorators';
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

  @Post('totp/generate')
  @Roles(UserRole.USER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  generateTotp(@GetCurrentUserId() userId: string) {
    return this.authService.generateTotpSecret(userId);
  }

  @Post('totp/verify')
  @Roles(UserRole.USER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async verifyTotp(
    @GetCurrentUserId() userId: string,
    @Body() dto: TOTPVerifyDto,
  ) {
    const isValid = await this.authService.verifyTotp(userId, dto.token);
    if (!isValid) {
      throw new UnauthorizedException('Invalid TOTP token');
    }
    return { message: 'TOTP verified successfully' };
  }
}
