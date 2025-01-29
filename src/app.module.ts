import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { SmsService } from './sms/sms.service';
import { SmsController } from './sms/sms.controller';
import { PrismaService } from './prisma/prisma.service';
import { SmsModule } from './sms/sms.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    UsersModule,
    SmsModule,
  ],
})
export class AppModule {}
