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
import { StockDataDto } from './dto';
import { Roles } from 'src/common/decorators';
import { UserRole } from '@prisma/client';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

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
}
