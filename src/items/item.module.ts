import { Module } from '@nestjs/common';
import { ItemsController } from './ItemsController ';

@Module({
  controllers: [ItemsController],
})
export class ItemsModule { }
