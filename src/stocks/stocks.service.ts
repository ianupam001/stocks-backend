import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { StockDataDto } from './dto/stock-data.dto';

@Injectable()
export class StocksService {
  constructor(private prisma: PrismaService) {}

  async saveStockData(stockDto: StockDataDto) {
    return this.prisma.stockData.create({
      data: {
        ticker: stockDto.ticker,
        date: stockDto.date,
        time: stockDto.time,
        ltp: stockDto.ltp,
        buyPrice: stockDto.buyPrice,
        buyQty: stockDto.buyQty,
        sellPrice: stockDto.sellPrice,
        sellQty: stockDto.sellQty,
        ltq: stockDto.ltq,
        openInterest: stockDto.openInterest,
      },
    });
  }

  async getAllStockData() {
    return this.prisma.stockData.findMany();
  }

  async calculateIndicators(ticker: string) {
    const stockData = await this.prisma.stockData.findMany({
      where: { ticker },
      orderBy: { date: 'desc' },
      take: 50,
    });

    if (stockData.length < 14) {
      return { message: 'Not enough data for indicators' };
    }

    return {
      movingAverage: this.calculateMovingAverage(stockData),
      rsi: this.calculateRSI(stockData),
      macd: this.calculateMACD(stockData),
    };
  }

  private calculateMovingAverage(stockData: StockDataDto[]) {
    const sum = stockData.reduce((acc, data) => acc + data.ltp, 0);
    return sum / stockData.length;
  }

  private calculateRSI(stockData: StockDataDto[]) {
    let gains = 0,
      losses = 0;

    for (let i = 1; i < stockData.length; i++) {
      const change = stockData[i].ltp - stockData[i - 1].ltp;
      if (change > 0) gains += change;
      else losses += Math.abs(change);
    }

    if (losses === 0) return 100;

    const avgGain = gains / stockData.length;
    const avgLoss = losses / stockData.length;
    const rs = avgGain / avgLoss;

    return 100 - 100 / (1 + rs);
  }

  private calculateMACD(stockData: StockDataDto[]) {
    const shortEMA = this.calculateEMA(stockData, 12);
    const longEMA = this.calculateEMA(stockData, 26);
    const macd = shortEMA - longEMA;
    const signal = this.calculateEMA(stockData, 9, macd);

    return { macd, signal };
  }

  private calculateEMA(
    stockData: StockDataDto[],
    period: number,
    prevEMA?: number,
  ) {
    const k = 2 / (period + 1);
    return stockData.reduce(
      (ema, data) => data.ltp * k + ema * (1 - k),
      prevEMA || stockData[0].ltp,
    );
  }
}
