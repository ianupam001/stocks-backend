import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsDate } from 'class-validator';

export class CreateRealTimeStockDataDto {
  @ApiProperty({ example: '500010', description: 'Scrip Code' })
  @IsString()
  SCRIPCODE: string;

  @ApiProperty({ example: 56240.15, description: 'Open Price' })
  @IsNumber()
  OPEN: number;

  @ApiProperty({ example: 56155.52, description: 'Close Price' })
  @IsNumber()
  CLOSE: number;

  @ApiProperty({ example: 56444.75, description: 'High Price' })
  @IsNumber()
  HIGH: number;

  @ApiProperty({ example: 56147.23, description: 'Low Price' })
  @IsNumber()
  LOW: number;

  @ApiProperty({ example: 0, description: 'Bid Price' })
  @IsNumber()
  BIDPRICE: number;

  @ApiProperty({ example: 0, description: 'Offer Price' })
  @IsNumber()
  OFFERPRICE: number;

  @ApiProperty({ example: 0, description: 'Bid Quantity' })
  @IsNumber()
  BIDQTY: number;

  @ApiProperty({ example: 0, description: 'Offer Quantity' })
  @IsNumber()
  OFFERQTY: number;

  @ApiProperty({ example: 0, description: 'Volume' })
  @IsNumber()
  VOLUME: number;

  @ApiProperty({ example: 0, description: 'Value' })
  @IsNumber()
  VALUE: number;

  @ApiProperty({
    example: '2022-09-30 09:18:00.000',
    description: 'Update Time',
  })
  @IsDate()
  UPDTIME: Date;
}
