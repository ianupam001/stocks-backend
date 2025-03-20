import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SmsService } from './sms.service';
import { Roles } from 'src/common/decorators';
import { UserRole } from '@prisma/client';
import { SendSmsDto } from './dto';

@ApiTags('SMS')
@ApiBearerAuth()
@Controller({
  path: 'sms',
  version: '1',
})
export class SmsController {
  constructor(private readonly smsService: SmsService) {}

  @Post('send-sms')
  @Roles(UserRole.ADMIN)
  async sendSms(@Body() dto: SendSmsDto) {
    return this.smsService.sendSms(dto.to, dto.body);
  }
}
