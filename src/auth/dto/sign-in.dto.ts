import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsPhoneNumber, IsString, Length } from 'class-validator';

export class SignInDto {
  @ApiProperty()
  @IsPhoneNumber('IN')
  phone: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  @Length(6, 6)
  otp?: string;
}
