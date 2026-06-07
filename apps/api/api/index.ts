import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import express from 'express';
import { ExpressAdapter } from '@nestjs/platform-express';

const server = express();

let isAppInitialized = false;
let app: any;

async function bootstrap() {
  app = await NestFactory.create(AppModule, new ExpressAdapter(server));

  // Set global prefix
  app.setGlobalPrefix('api/v1');

  // Enable cookies
  app.use(cookieParser());

  // Enable validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Enable CORS
  app.enableCors({
    origin: true,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Accept,Authorization',
  });

  await app.init();
  isAppInitialized = true;
}

export default async function handler(req: any, res: any) {
  if (!isAppInitialized) {
    await bootstrap();
  }
  server(req, res);
}
