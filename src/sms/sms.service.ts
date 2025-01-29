import { SMSTransport } from './sms.transport';
import { Injectable } from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

@Injectable()
export class SmsService {
  private SMSTransport: SMSTransport;

  messages = {
    entityCreated: 'You have successfully created account with Connect2College',
  };

  constructor(private config: ConfigService) {
    const options = {
      accountSid: config.get('TWILIO_ACCOUNT_SID'),
      authToken: config.get('TWILIO_AUTH_TOKEN'),
      verifyServiceId: config.get('TWILIO_VERIFY_SERVICE_SID'),
      smsServiceId: config.get('TWILIO_MSG_SERVICE_SID'),
    };
    this.SMSTransport = new SMSTransport('twilio', options);
  }

  async sendOtp(phone: string) {
    return await this.SMSTransport.twilioPhoneVerify(phone);
  }

  async verifyOtp(phone: string, otp: string) {
    try {
      const response = await this.SMSTransport.twilioOtpVerification(
        phone,
        otp,
      );
      console.log({ response });
      return response;
    } catch (error) {
      console.log({ error });
      throw new Error('Invalid Phone or OTP');
    }
  }

  // implement if required --- add a schema to save templates
  // async createTemplate(dto: CreateSMSTemplateDto) {}

  async sendSms(phone: string, message: string, data: object = {}) {
    try {
      let body = this.messages[message] || message;
      body = this.formatMessage(body, data);
      const response = await this.SMSTransport.twilioMessageSend(phone, body);
      return response;
    } catch (error) {
      console.error({ error });
      throw new Error('error sending sms, try after some time');
    }
  }

  formatMessage(template: string, data: object) {
    return template.replace(/{{(\w+)}}/g, (match, variable) => {
      return data[variable] || '';
    });
  }
}
