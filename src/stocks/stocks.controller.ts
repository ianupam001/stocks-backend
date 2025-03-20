import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { StocksService } from './stocks.service';
import {
  CreateRealTimeStockDataDto,
  CreateStockMetadataDto,
  StockDataDto,
} from './dto';
import { Public, Roles } from 'src/common/decorators';
import { UserRole } from '@prisma/client';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Stocks')
@ApiBearerAuth()
@Controller({
  path: 'stocks',
  version: '1',
})
export class StocksController {
  constructor(private readonly stocksService: StocksService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.USER)
  @HttpCode(HttpStatus.OK)
  saveStockData(@Body() stock: StockDataDto) {
    return this.stocksService.saveStockData(stock);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.USER)
  @HttpCode(HttpStatus.OK)
  getAllStocks() {
    return this.stocksService.getAllStockData();
  }

  @Get(':ticker/indicators')
  @Roles(UserRole.ADMIN, UserRole.USER)
  @HttpCode(HttpStatus.OK)
  getIndicators(@Param('ticker') ticker: string) {
    return this.stocksService.calculateIndicators(ticker);
  }

  @Post('metadata')
  @ApiOperation({ summary: 'Create Stock Metadata' })
  createStockMetadata(@Body() createStockMetadataDto: CreateStockMetadataDto) {
    return this.stocksService.createMetadata(createStockMetadataDto);
  }

  @Post('real-time')
  @ApiOperation({ summary: 'Create Real-Time Stock Data' })
  createRealTimeStockData(
    @Body() createRealTimeStockDataDto: CreateRealTimeStockDataDto,
  ) {
    return this.stocksService.createRealTimeData(createRealTimeStockDataDto);
  }
  @Public()
  @Get('fetch-metadata')
  async fetchMetadata() {
    return this.stocksService.fetchAndSaveStockMetadata();
  }

  @Public()
  @Get('fetch-real-time-data')
  async fetchRealTimeData() {
    return this.stocksService.fetchAndSaveRealTimeData();
  }
}
