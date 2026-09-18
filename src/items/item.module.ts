import { Module } from '@nestjs/common';
import { ItemsController } from './ItemsController ';
import { ItemsService } from './items.service';

@Module({
  controllers: [ItemsController],
 providers: [ItemsService],
})
export class ItemsModule { }
