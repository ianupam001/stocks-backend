import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { StockDataDto } from './dto/stock-data.dto';
import { CreateRealTimeStockDataDto, CreateStockMetadataDto } from './dto';
import { CustomForbiddenException } from 'src/common/execeptions';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { StocksGateway } from './gateway/stocks.gateway';
import { Interval } from '@nestjs/schedule';

@Injectable()
export class StocksService implements OnGatewayInit {
  @WebSocketServer() server: Server;

  private metadataApiUrl: string;
  private realTimeApiUrl: string;
  private readonly logger = new Logger(StocksService.name);
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private stocksGateway: StocksGateway,
  ) {
    this.metadataApiUrl = `${this.config.get<string>('STOCK_METADATA_API_URL')}&token=${this.config.get<string>('API_TOKEN')}`;
    this.realTimeApiUrl = `${this.config.get<string>('STOCK_REALTIME_API_URL')}&token=${this.config.get<string>('API_TOKEN')}`;
  }

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

  async createMetadata(metaData: CreateStockMetadataDto) {
    try {
      // Check if metadata already exists
      const existingMetadata = await this.prisma.stockMetadata.findUnique({
        where: { SCRIPCODE: metaData.SCRIPCODE },
      });

      if (existingMetadata) {
        throw new CustomForbiddenException('Stock metadata already exists');
      }

      // Create metadata entry
      const newMetadata = await this.prisma.stockMetadata.create({
        data: {
          FINCODE: metaData.FINCODE,
          SCRIPCODE: metaData.SCRIPCODE,
          SCRIP_NAME: metaData.SCRIP_NAME,
          SCRIP_GROUP: metaData.SCRIP_GROUP,
          COMPNAME: metaData.COMPNAME,
          IND_CODE: metaData.IND_CODE,
          industry: metaData.industry,
          HSE_CODE: metaData.HSE_CODE,
          house: metaData.house,
          SYMBOL: metaData.SYMBOL,
          SERIES: metaData.SERIES,
          ISIN: metaData.ISIN,
          S_NAME: metaData.S_NAME,
          RFORMAT: metaData.RFORMAT,
          FFORMAT: metaData.FFORMAT,
          CHAIRMAN: metaData.CHAIRMAN,
          MDIR: metaData.MDIR,
          COSEC: metaData.COSEC,
          INC_MONTH: metaData.INC_MONTH,
          INC_YEAR: metaData.INC_YEAR,
          FV: metaData.FV,
          Status: metaData.Status,
          Sublisting: metaData.Sublisting,
          Bse_Scrip_ID: metaData.Bse_Scrip_ID,
          securitytoken: metaData.securitytoken,
          CIN: metaData.CIN,
          Bse_sublisting: metaData.Bse_sublisting,
          Nse_sublisting: metaData.Nse_sublisting,
          FLAG: metaData.FLAG,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      return {
        message: 'Stock metadata created successfully',
        data: newMetadata,
      };
    } catch (error) {
      throw new CustomForbiddenException(error.message);
    }
  }

  async createRealTimeData(realTimeData: CreateRealTimeStockDataDto) {
    try {
      const stockData = await this.prisma.realTimeStockData.create({
        data: {
          SCRIPCODE: realTimeData.SCRIPCODE,
          OPEN: realTimeData.OPEN,
          CLOSE: realTimeData.CLOSE,
          HIGH: realTimeData.HIGH,
          LOW: realTimeData.LOW,
          BIDPRICE: realTimeData.BIDPRICE,
          OFFERPRICE: realTimeData.OFFERPRICE,
          BIDQTY: realTimeData.BIDQTY,
          OFFERQTY: realTimeData.OFFERQTY,
          VOLUME: realTimeData.VOLUME,
          VALUE: realTimeData.VALUE,
          UPDTIME: realTimeData.UPDTIME,
        },
      });

      return {
        message: 'Real-time stock data created successfully',
        data: stockData,
      };
    } catch (error) {
      throw new CustomForbiddenException(error.message);
    }
  }

  async fetchAndSaveStockMetadata() {
    try {
      const url = this.metadataApiUrl;
      if (!url) {
        throw new Error('STOCK_API_URL is not defined.');
      }

      const response = await axios.get(url);
      const stockMetadataArray: CreateStockMetadataDto[] = response.data.Table;

      if (!Array.isArray(stockMetadataArray)) {
        throw new CustomForbiddenException('Invalid API response format.');
      }

      for (const stockMetadata of stockMetadataArray) {
        await this.prisma.stockMetadata.upsert({
          where: { SCRIPCODE: stockMetadata.SCRIPCODE },
          update: stockMetadata,
          create: stockMetadata,
        });
      }

      return stockMetadataArray;
    } catch (error) {
      console.error('Error fetching and saving stock metadata:', error);
      throw new CustomForbiddenException(error.message);
    }
  }

  @Interval(10000)
  async fetchAndStreamRealTimeData() {
    try {
      const url = this.realTimeApiUrl;
      if (!url) throw new Error('STOCK_REALTIME_API_URL is not defined.');

      const response = await axios.get(url);
      const realTimeDataArray = response.data.Table;

      if (!Array.isArray(realTimeDataArray)) {
        throw new Error('Invalid API response format.');
      }

      for (const realTimeData of realTimeDataArray) {
        const data = {
          SCRIPCODE: realTimeData.SCRIPCODE.toString(),
          OPEN: realTimeData.OPEN || 0,
          CLOSE: realTimeData.CLOSE || 0,
          HIGH: realTimeData.HIGH || 0,
          LOW: realTimeData.LOW || 0,
          BIDPRICE: realTimeData.BIDPRICE || 0,
          OFFERPRICE: realTimeData.OFFERPRICE || 0,
          BIDQTY: realTimeData.BIDQTY || 0,
          OFFERQTY: realTimeData.OFFERQTY || 0,
          VOLUME: realTimeData.VOLUME || 0,
          VALUE: realTimeData.VALUE || 0,
          UPDTIME: new Date(realTimeData.UPDTIME),
          createdAt: new Date(),
        };

        // Fetch stock metadata
        const metadata = await this.prisma.stockMetadata.findUnique({
          where: { SCRIPCODE: data.SCRIPCODE },
        });

        if (!metadata) {
          this.logger.warn(
            `Metadata not found for SCRIPCODE: ${data.SCRIPCODE}`,
          );
          continue;
        }

        // Merge real-time data with metadata
        const stockUpdate = { ...data, metadata };

        // Send update to WebSocket clients
        this.stocksGateway.sendStockUpdate(stockUpdate);

        // Save real-time data to the database
        this.saveRealtimeStockData(data);
      }
    } catch (error) {
      this.logger.error('Error fetching real-time stock data:', error);
    }
  }

  private async saveRealtimeStockData(data: any) {
    try {
      await this.prisma.realTimeStockData.upsert({
        where: { SCRIPCODE: data.SCRIPCODE },
        update: data,
        create: data,
      });
    } catch (error) {
      this.logger.error('Error saving stock data:', error);
    }
  }

  afterInit() {
    console.log('WebSocket server initialized');
  }
  // Helper functions

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
