import { Module } from '@nestjs/common';
import { createObserveModule } from '@nestjs/observe';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ItemsController } from './items/ItemsController ';
import { ItemsModule } from './items/item.module';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [ItemsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
