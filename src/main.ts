import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as basicAuth from 'express-basic-auth';
import { AppModule } from './app.module';

import * as dotenv from 'dotenv';
import { IoAdapter } from '@nestjs/platform-socket.io';

dotenv.config();

const SWAGGER_ENVS = ['local', 'dev', 'staging'];

async function bootstrap() {
  const isProd = process.env.ENV === 'PROD';
  const port = isProd ? process.env.PROD_PORT : process.env.DEV_PORT;

  const app = await NestFactory.create(AppModule, {
    cors: true,
  });

  app.useGlobalPipes(new ValidationPipe());
  app.useWebSocketAdapter(new IoAdapter(app));
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
  });

  if (!process.env.SWAGGER_USER || !process.env.SWAGGER_PASSWORD) {
    throw new Error(
      'SWAGGER_USER and SWAGGER_PASSWORD must be defined in the .env file.',
    );
  }
  app.use(
    ['/docs', '/docs-json'],
    basicAuth({
      challenge: true,
      users: {
        [process.env.SWAGGER_USER]: process.env.SWAGGER_PASSWORD,
      },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Stocks APIs' + (isProd ? ' (PROD)' : ' (DEV)'))
    .setDescription('Api documentation for stocks app')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
  await app.listen(port || 5000, () => {
    console.log(`Application is running on port ${port}`);
  });
}
bootstrap();
