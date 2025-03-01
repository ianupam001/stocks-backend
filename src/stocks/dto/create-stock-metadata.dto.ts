import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber } from 'class-validator';

export class CreateStockMetadataDto {
  @ApiProperty({ example: '100010', description: 'Financial Code' })
  @IsOptional()
  @IsString()
  FINCODE?: string;

  @ApiProperty({ example: '500010', description: 'Scrip Code (Unique)' })
  @IsString()
  SCRIPCODE: string;

  @ApiProperty({ example: 'HDFC', description: 'Scrip Name' })
  @IsString()
  SCRIP_NAME: string;

  @ApiProperty({ example: 'A', description: 'Scrip Group', required: false })
  @IsOptional()
  @IsString()
  SCRIP_GROUP?: string;

  @ApiProperty({
    example: 'Housing Development Finance Corporation Ltd.',
    description: 'Company Name',
  })
  @IsString()
  COMPNAME: string;

  @ApiProperty({ example: '48', description: 'Industry Code', required: false })
  @IsOptional()
  @IsString()
  IND_CODE?: string;

  @ApiProperty({
    example: 'Finance - Housing',
    description: 'Industry',
    required: false,
  })
  @IsOptional()
  @IsString()
  industry?: string;

  @ApiProperty({ example: '336', description: 'House Code', required: false })
  @IsOptional()
  @IsString()
  HSE_CODE?: string;

  @ApiProperty({ example: 'HDFC', description: 'House', required: false })
  @IsOptional()
  @IsString()
  house?: string;

  @ApiProperty({ example: 'HDFC', description: 'Stock Symbol' })
  @IsString()
  SYMBOL: string;

  @ApiProperty({ example: 'EQ', description: 'Series', required: false })
  @IsOptional()
  @IsString()
  SERIES?: string;

  @ApiProperty({
    example: 'INE001A01036',
    description: 'ISIN Code',
    required: false,
  })
  @IsOptional()
  @IsString()
  ISIN?: string;

  @ApiProperty({
    example: 'HDFC-Amalgamated',
    description: 'Short Name',
    required: false,
  })
  @IsOptional()
  @IsString()
  S_NAME?: string;

  @ApiProperty({
    example: 'FIN',
    description: 'Report Format',
    required: false,
  })
  @IsOptional()
  @IsString()
  RFORMAT?: string;

  @ApiProperty({ example: 'FIN', description: 'File Format', required: false })
  @IsOptional()
  @IsString()
  FFORMAT?: string;

  @ApiProperty({
    example: 'Deepak S Parekh',
    description: 'Chairman',
    required: false,
  })
  @IsOptional()
  @IsString()
  CHAIRMAN?: string;

  @ApiProperty({
    example: 'Renu Sud Karnad',
    description: 'Managing Director',
    required: false,
  })
  @IsOptional()
  @IsString()
  MDIR?: string;

  @ApiProperty({
    example: 'Ajay Agarwal',
    description: 'Company Secretary',
    required: false,
  })
  @IsOptional()
  @IsString()
  COSEC?: string;

  @ApiProperty({
    example: '17-10',
    description: 'Incorporation Month',
    required: false,
  })
  @IsOptional()
  @IsString()
  INC_MONTH?: string;

  @ApiProperty({
    example: '1977',
    description: 'Incorporation Year',
    required: false,
  })
  @IsOptional()
  @IsString()
  INC_YEAR?: string;

  @ApiProperty({ example: 2, description: 'Face Value', required: false })
  @IsOptional()
  @IsNumber()
  FV?: string;

  @ApiProperty({
    example: 'Amalgamation',
    description: 'Status',
    required: false,
  })
  @IsOptional()
  @IsString()
  Status?: string;

  @ApiProperty({
    example: 'Amalgamation',
    description: 'Sublisting',
    required: false,
  })
  @IsOptional()
  @IsString()
  Sublisting?: string;

  @ApiProperty({
    example: 'HDFC',
    description: 'BSE Scrip ID',
    required: false,
  })
  @IsOptional()
  @IsString()
  Bse_Scrip_ID?: string;

  @ApiProperty({
    example: '1330',
    description: 'Security Token',
    required: false,
  })
  @IsOptional()
  @IsString()
  securitytoken?: string;

  @ApiProperty({
    example: 'L70100MH1977PLC019916',
    description: 'CIN',
    required: false,
  })
  @IsOptional()
  @IsString()
  CIN?: string;

  @ApiProperty({
    example: 'Amalgamation',
    description: 'BSE Sublisting',
    required: false,
  })
  @IsOptional()
  @IsString()
  Bse_sublisting?: string;

  @ApiProperty({
    example: 'Amalgamation',
    description: 'NSE Sublisting',
    required: false,
  })
  @IsOptional()
  @IsString()
  Nse_sublisting?: string;

  @ApiProperty({ example: 'A', description: 'Flag', required: false })
  @IsOptional()
  @IsString()
  FLAG?: string;
}
