import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { createObserveModule } from '@nestjs/observe';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ItemsController } from './items/ItemsController ';
import { ItemsModule } from './items/item.module';
import { LoggerMiddleware } from './common/middleware/logger.middleware';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [ItemsModule],
  controllers: [AppController],
  providers: [AppService],
})

export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes({ path: '{*path}', method: RequestMethod.ALL });
  }
}
