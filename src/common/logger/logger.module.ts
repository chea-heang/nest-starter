import { Global, Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import { winstonLogger } from './winston.config';
import { AppLoggerService } from './app-logger.service';

@Global()
@Module({
  imports: [
    WinstonModule.forRoot({ instance: winstonLogger }),
  ],
  providers: [AppLoggerService],
  exports: [AppLoggerService],
})
export class LoggerModule {}
