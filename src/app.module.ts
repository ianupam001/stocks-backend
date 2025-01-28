import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import * as path from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mongodb',
        url: configService
          .get<string>('DB_URI', '')
          .replace(
            '<DB_PASSWORD>',
            configService.get<string>('DB_PASSWORD', ''),
          ),
        synchronize: true,
        logging: ['query', 'error', 'schema'],
        entities: [path.join(__dirname, '**/*.entity.js')],
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
  ],
})
export class AppModule {}
