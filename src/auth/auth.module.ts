import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SmsService } from 'src/sms/sms.service';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PrismaService } from 'src/prisma/prisma.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AtStrategy, RtStrategy } from './strategies';

@Module({
  imports: [PrismaModule, ConfigModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [
    AuthService,
    SmsService,
    AtStrategy,
    RtStrategy,
    UsersService,
    PrismaService,
  ],
  exports: [AuthService],
})
export class AuthModule {}
