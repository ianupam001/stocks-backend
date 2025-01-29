import { ApiProperty } from '@nestjs/swagger';
import { Roles } from '@prisma/client';
import { IsOptional, IsPhoneNumber, IsString } from 'class-validator';

export class CreateUserDto {
  @ApiProperty()
  @IsString()
  @IsPhoneNumber('IN')
  phone: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty()
  @IsString()
  email?: string;

  @ApiProperty()
  roles?: Roles[];
}
