import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { SmsModule } from './sms/sms.module';
import { APP_GUARD } from '@nestjs/core';
import { AtGaurd, RolesGuard } from './common/guards';
import { AppRequestLoggerMiddleware } from './common/middlewares';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    UsersModule,
    SmsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AtGaurd,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(AppRequestLoggerMiddleware).forRoutes('*path');
  }
}
