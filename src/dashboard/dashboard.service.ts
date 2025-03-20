import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats() {
    const totalUsers = await this.prisma.user.count();
    const activeUsers = await this.prisma.user.count({
      where: { currentSessionId: { not: null } },
    });

    const usersWith2FA = await this.prisma.user.count({
      where: { isTwoFAEnabled: true },
    });

    const newUsersLast7Days = await this.prisma.user.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setDate(new Date().getDate() - 7)),
        },
      },
    });

    const totalAdmins = await this.prisma.user.count({
      where: { roles: { has: 'ADMIN' } },
    });

    const totalModerators = await this.prisma.user.count({
      where: { roles: { has: 'MODERATOR' } },
    });

    const totalCompanies = await this.prisma.stockMetadata.count();
    const totalStocks = await this.prisma.stockData.count();
    const realTimeStockCount = await this.prisma.realTimeStockData.count();

    const mostActiveStocks = await this.prisma.realTimeStockData.findMany({
      orderBy: { VOLUME: 'desc' },
      take: 5,
      select: { SCRIPCODE: true, VOLUME: true },
    });

    const topGainers = await this.prisma.realTimeStockData.findMany({
      orderBy: { HIGH: 'desc' },
      take: 5,
      select: { SCRIPCODE: true, HIGH: true },
    });

    const topLosers = await this.prisma.realTimeStockData.findMany({
      orderBy: { LOW: 'asc' },
      take: 5,
      select: { SCRIPCODE: true, LOW: true },
    });

    return {
      users: {
        totalUsers,
        activeUsers,
        usersWith2FA,
        newUsersLast7Days,
      },
      roles: {
        totalAdmins,
        totalModerators,
      },
      stocks: {
        totalCompanies,
        totalStocks,
        realTimeStockCount,
        mostActiveStocks,
        topGainers,
        topLosers,
      },
    };
  }
}
