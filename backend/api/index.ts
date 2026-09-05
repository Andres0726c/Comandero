import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import type { Express } from 'express';
import type { IncomingMessage, ServerResponse } from 'http';

let cachedApp: Express;

async function bootstrap(): Promise<Express> {
  if (!cachedApp) {
    const app = await NestFactory.create(AppModule, { logger: false });
    app.enableCors({ origin: '*' });
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    cachedApp = app.getHttpAdapter().getInstance();
  }
  return cachedApp;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const app = await bootstrap();
  app(req, res);
}
