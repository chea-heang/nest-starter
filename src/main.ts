import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/exceptions/http-exception.filter';
import { ThrottlerExceptionFilter } from './common/guards/throttler-exception.filter';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { WinstonModule } from 'nest-winston';
import { winstonLogger } from './common/logger/winston.config';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: WinstonModule.createLogger({ instance: winstonLogger }),
  });

  // Serve static Frontend files from public folder
  app.useStaticAssets(join(__dirname, '..', 'public'));

  // Global Prefix
  app.setGlobalPrefix('api/v1');

  // Global Exception Filters
  app.useGlobalFilters(
    new HttpExceptionFilter(),
    new ThrottlerExceptionFilter(),
  );

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,           // strip unknown fields
      forbidNonWhitelisted: true, // throw if unknown fields sent
      transform: true,           // auto-transform types (string → number)
    }),
  );

  // Global Response Interceptor
  app.useGlobalInterceptors(new TransformInterceptor());

  // CORS
  app.enableCors();

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  logger.log(`🚀 API Backend is running on: http://localhost:${port}/api/v1`);
  logger.log(`🌐 Frontend UI is running on:  http://localhost:${port}`);
}
bootstrap();
