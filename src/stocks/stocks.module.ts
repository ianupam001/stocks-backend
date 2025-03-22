import { Module } from '@nestjs/common';
import { StocksController } from './stocks.controller';
import { StocksService } from './stocks.service';
import { StocksGateway } from './gateway/stocks.gateway'; // Import the WebSocket gateway
import { PrismaModule } from 'src/prisma/prisma.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('AT_SECRET'),
        signOptions: { expiresIn: '10000s' },
      }),
    }),
  ],
  controllers: [StocksController],
  providers: [StocksService, StocksGateway], // Register StocksGateway
  exports: [StocksService],
})
export class StocksModule {}
