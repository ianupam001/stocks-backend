import { ApiProperty } from '@nestjs/swagger';
import { IsPhoneNumber, IsString, Length } from 'class-validator';

export class SignInDto {
  @ApiProperty()
  @IsPhoneNumber('IN')
  phone: string;

  @ApiProperty()
  @IsString()
  @Length(6, 6)
  otp: string;
}
