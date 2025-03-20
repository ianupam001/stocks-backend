import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class SendSmsDto {
  @ApiProperty()
  @IsString()
  to: string;

  @ApiProperty()
  @IsString()
  body: string;
}
