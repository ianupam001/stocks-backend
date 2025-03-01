import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { StockDataDto } from './dto/stock-data.dto';
import { CreateRealTimeStockDataDto, CreateStockMetadataDto } from './dto';
import { CustomForbiddenException } from 'src/common/execeptions';
import axios from 'axios';

@Injectable()
export class StocksService {
  private readonly logger = new Logger(StocksService.name);
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
      const url =
        'https://contentapi.accordwebservices.com/RawData/GetRawDataJSON?filename=Company_master&date=30092022&section=Master&sub=&token=fMqHkvwLKoN6rTyt_j7F3HNgnvhBtWWE';

      // Fetch data from API
      const response = await axios.get(url);

      // Extract the 'Table' array
      const stockMetadataArray: CreateStockMetadataDto[] = response.data.Table;

      if (!Array.isArray(stockMetadataArray)) {
        throw new CustomForbiddenException('Invalid API response format.');
      }

      console.log(`Fetched ${stockMetadataArray.length} stock records`);

      for (const stockMetadata of stockMetadataArray) {
        const existingRecord = await this.prisma.stockMetadata.findUnique({
          where: { SCRIPCODE: stockMetadata.SCRIPCODE },
        });

        if (!existingRecord) {
          await this.prisma.stockMetadata.create({
            data: {
              FINCODE: stockMetadata.FINCODE,
              SCRIPCODE: stockMetadata.SCRIPCODE,
              SCRIP_NAME: stockMetadata.SCRIP_NAME,
              SCRIP_GROUP: stockMetadata.SCRIP_GROUP,
              COMPNAME: stockMetadata.COMPNAME,
              IND_CODE: stockMetadata.IND_CODE,
              industry: stockMetadata.industry,
              HSE_CODE: stockMetadata.HSE_CODE,
              house: stockMetadata.house,
              SYMBOL: stockMetadata.SYMBOL,
              SERIES: stockMetadata.SERIES,
              ISIN: stockMetadata.ISIN,
              S_NAME: stockMetadata.S_NAME,
              RFORMAT: stockMetadata.RFORMAT,
              FFORMAT: stockMetadata.FFORMAT,
              CHAIRMAN: stockMetadata.CHAIRMAN,
              MDIR: stockMetadata.MDIR,
              COSEC: stockMetadata.COSEC,
              INC_MONTH: stockMetadata.INC_MONTH,
              INC_YEAR: stockMetadata.INC_YEAR,
              FV: stockMetadata.FV,
              Status: stockMetadata.Status,
              Sublisting: stockMetadata.Sublisting,
              Bse_Scrip_ID: stockMetadata.Bse_Scrip_ID,
              securitytoken: stockMetadata.securitytoken,
              CIN: stockMetadata.CIN,
              Bse_sublisting: stockMetadata.Bse_sublisting,
              Nse_sublisting: stockMetadata.Nse_sublisting,
              FLAG: stockMetadata.FLAG,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          });
        } else {
          this.logger.warn(
            `Stock metadata already exists for SCRIPCODE: ${stockMetadata.SCRIPCODE}`,
          );
        }
      }

      return stockMetadataArray; // Return only after processing
    } catch (error) {
      console.error('Error fetching and saving stock metadata:', error);
      throw error;
    }
  }

  async fetchAndSaveRealTimeData() {
    try {
      const url =
        'https://contentapi.accordwebservices.com/RawData/GetRawDataJSON?filename=2022093003&date=30092022&section=BseStocksLive&sub=&token=fMqHkvwLKoN6rTyt_j7F3HNgnvhBtWWE';

      // Fetch data from API
      const response = await axios.get(url);
      const realTimeDataArray = response.data.Table;

      if (!Array.isArray(realTimeDataArray)) {
        throw new CustomForbiddenException('Invalid API response format.');
      }

      console.log(
        `Fetched ${realTimeDataArray.length} real-time stock records`,
      );

      for (const realTimeData of realTimeDataArray) {
        // Handle null values by providing defaults
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

        // Upsert the data
        await this.prisma.realTimeStockData.upsert({
          where: { SCRIPCODE: realTimeData.SCRIPCODE.toString() },
          update: data,
          create: data,
        });
      }
      return realTimeDataArray;
    } catch (error) {
      console.error('Error fetching and saving real-time stock data:', error);
      throw error;
    }
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
