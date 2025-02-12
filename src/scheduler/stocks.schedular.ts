import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from 'src/prisma/prisma.service';
import * as AWS from 'aws-sdk';

@Injectable()
export class StocksScheduler {
  private readonly logger = new Logger(StocksScheduler.name);
  private readonly s3: AWS.S3;

  constructor(private prisma: PrismaService) {
    this.s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION,
    });
  }

  @Cron('0 16 * * 1-5', { timeZone: 'Asia/Kolkata' }) // Runs at 4:00 PM IST (Market Close)
  async migrateDataToAWS() {
    this.logger.log('Starting data migration to AWS Data Lake...');

    const bucketName = process.env.AWS_S3_BUCKET_NAME;
    if (!bucketName) {
      this.logger.error(
        'AWS_S3_BUCKET_NAME is not defined in environment variables.',
      );
      return;
    }

    const stockData = await this.prisma.stockData.findMany();
    if (!stockData.length) {
      this.logger.warn('No stock data found for migration.');
      return;
    }

    const fileName = `stock-data-${new Date().toISOString()}.json`;
    const fileContent = JSON.stringify(stockData, null, 2);

    const params = {
      Bucket: bucketName,
      Key: `data-lake/${fileName}`,
      Body: fileContent,
      ContentType: 'application/json',
    };

    try {
      await this.s3.upload(params).promise();
      this.logger.log(`Data successfully migrated to AWS: ${fileName}`);

      await this.prisma.stockData.deleteMany();
      this.logger.log('Stock data deleted from MongoDB after migration.');
    } catch (error) {
      this.logger.error(`Error migrating data to AWS: ${error.message}`);
    }
  }
}
