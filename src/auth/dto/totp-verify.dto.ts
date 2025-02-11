import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class TOTPVerifyDto {
  @ApiProperty()
  @IsNotEmpty()
  token: string;
}
