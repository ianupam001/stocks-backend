import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaService } from 'src/prisma/prisma.service';
import { StocksScheduler } from './stocks.schedular';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [StocksScheduler, PrismaService],
})
export class SchedulerModule {}
