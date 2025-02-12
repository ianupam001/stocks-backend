import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsInt, IsDate } from 'class-validator';

export class StockDataDto {
  @ApiProperty({ example: 'AAPL', description: 'Stock Ticker Symbol' })
  @IsString()
  ticker: string;

  @ApiProperty({ example: '2024-02-12', description: 'Stock Date' })
  @IsDate()
  date: Date;

  @ApiProperty({ example: '15:30:00', description: 'Stock Time' })
  @IsString()
  time: string;

  @ApiProperty({ example: 150.25, description: 'Last Traded Price' })
  @IsNumber()
  ltp: number;

  @ApiProperty({ example: 150.1, description: 'Buy Price' })
  @IsNumber()
  buyPrice: number;

  @ApiProperty({ example: 100, description: 'Buy Quantity' })
  @IsInt()
  buyQty: number;

  @ApiProperty({ example: 150.5, description: 'Sell Price' })
  @IsNumber()
  sellPrice: number;

  @ApiProperty({ example: 200, description: 'Sell Quantity' })
  @IsInt()
  sellQty: number;

  @ApiProperty({ example: 50, description: 'Last Traded Quantity' })
  @IsInt()
  ltq: number;

  @ApiProperty({ example: 5000, description: 'Open Interest' })
  @IsInt()
  openInterest: number;
}
